import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const priceMap: Record<string, number> = {
  "QRystal Balls Sticker": 499,
  "QRystal Balls Card": 799,
  "QRystal Balls Keychain": 1299,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const product = body.product as string;
    const theme = body.theme as string | null;

    const orderType = body.orderType as
      | "artifact"
      | "merch"
      | undefined;

    const printifyProductId =
      body.printifyProductId as string | null;

    const variantId =
      body.variantId as string | number | null;
const quantity = Math.max(
  1,
  Math.min(10, Number(body.quantity) || 1)
);

    const origin = new URL(request.url).origin;

    let amount: number;
    let description: string;
    let variantTitle = "";

    // =========================
    // MERCH ORDER
    // =========================
    if (orderType === "merch") {
      const token = process.env.PRINTIFY_API_TOKEN;
      const shopId = process.env.PRINTIFY_SHOP_ID;

      if (
        !token ||
        !shopId ||
        !printifyProductId ||
        !variantId
      ) {
        return NextResponse.json(
          { error: "Missing Printify information" },
          { status: 400 }
        );
      }

      const response = await fetch(
        `https://api.printify.com/v1/shops/${shopId}/products/${printifyProductId}.json`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return NextResponse.json(
          { error: "Unable to verify Printify product" },
          { status: 400 }
        );
      }

      const printifyProduct = await response.json();

      const selectedVariant =
        printifyProduct.variants?.find(
          (variant: {
            id: number;
            title: string;
            price: number;
            is_enabled: boolean;
            is_available: boolean;
          }) =>
            String(variant.id) === String(variantId) &&
            variant.is_enabled &&
            variant.is_available
        );

      if (!selectedVariant) {
        return NextResponse.json(
          { error: "Invalid Printify variant" },
          { status: 400 }
        );
      }

      amount = selectedVariant.price;
      variantTitle = selectedVariant.title;

      description = `Qrystal Merch — ${(theme || "jester").toUpperCase()} — ${variantTitle}`;
    }

    // =========================
    // QR ARTIFACT ORDER
    // =========================
    else {
      const artifactAmount = priceMap[product];

      if (!artifactAmount) {
        return NextResponse.json(
          { error: "Invalid product" },
          { status: 400 }
        );
      }

      amount = artifactAmount;

      description = `QRystal Balls theme: ${
        theme || "jester"
      }`;
    }

    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",

        shipping_address_collection: {
          allowed_countries: ["US"],
        },

        customer_creation: "always",

        metadata: {
          product_name: product,
          order_type:
            orderType === "merch"
              ? "merch"
              : "artifact",

       theme: theme || "jester",

          printify_product_id:
            printifyProductId || "",

          printify_variant_id:
            variantId
              ? String(variantId)
              : "",

          printify_variant_title:
            variantTitle,
quantity: String(quantity),
        },

        line_items: [
          {
            price_data: {
              currency: "usd",

              product_data: {
                name: product,
                description,
              },

              unit_amount: amount,
            },

            quantity,
          },
        ],

        success_url:
          `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          orderType === "merch"
            ? `${origin}/merch/${printifyProductId}`
            : `${origin}/checkout?product=${encodeURIComponent(
                product
              )}&theme=${encodeURIComponent(
                theme || "jester"
              )}&price=$${(
                amount / 100
              ).toFixed(2)}`,
      });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Unable to create checkout session",
      },
      { status: 500 }
    );
  }
}