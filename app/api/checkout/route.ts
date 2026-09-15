import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const priceMap: Record<string, number> = {
  "QRystal Balls Sticker": 499,
  "QRystal Balls Card": 799,
  "QRystal Balls Keychain": 1299,
  "Jester Oracle QR Keychain": 1499,
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

    const shippingAddress = body.shippingAddress as {
      first_name?: string;
      last_name?: string;
      address1?: string;
      address2?: string;
      city?: string;
      region?: string;
      zip?: string;
      country?: string;
    } | undefined;

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
    let shippingAmount = 0;
const isMerchFoxKeychain =
  orderType === "artifact" &&
  product === "Jester Oracle QR Keychain" &&
  theme === "jester";
if (isMerchFoxKeychain) {
  if (
    !shippingAddress?.first_name?.trim() ||
    !shippingAddress?.last_name?.trim() ||
    !shippingAddress?.address1?.trim() ||
    !shippingAddress?.city?.trim() ||
    !shippingAddress?.region?.trim() ||
    !shippingAddress?.zip?.trim() ||
    shippingAddress?.country?.trim().toUpperCase() !== "US"
  ) {
    return NextResponse.json(
      { error: "Complete shipping address required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.MERCHFOX_API_KEY;
  const apiSecret = process.env.MERCHFOX_APP_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "MerchFox credentials are missing" },
      { status: 500 }
    );
  }

  const quoteResponse = await fetch(
    "https://api.merchfox.com/api/v1/orders/quote",
    {
      method: "POST",
      headers: {
        "X-Mfx-App-Key": apiKey,
        "X-Mfx-App-Secret": apiSecret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
       items: [
  {
    productId: "6aa2d1c955f4cb0435e94cde",
variantId: "ab203354-c4d1-4eb3-b834-43ea1bb90b90",
quantity,
unitPrice: 14.99,
  },
],        shippingAddress: {
          firstName: shippingAddress.first_name!.trim(),
          lastName: shippingAddress.last_name!.trim(),
          address1: shippingAddress.address1!.trim(),
          address2: shippingAddress.address2?.trim() || "",
          city: shippingAddress.city!.trim(),
          state: shippingAddress.region!.trim().toUpperCase(),
          country: "US",
          zip: shippingAddress.zip!.trim(),
        },
        source: "MANUAL",
        fulfillmentServiceKey: "FIRST_CLASS",
        shippingMode: "PROVIDER",
      }),
      cache: "no-store",
    }
  );

  const quoteResult = await quoteResponse.json().catch(() => null);

  if (!quoteResponse.ok || quoteResult?.code !== 0) {
    console.error("MerchFox quote failed:", quoteResult);

    return NextResponse.json(
      { error: "Unable to calculate keychain shipping" },
      { status: 400 }
    );
  }

  const merchFoxShipping = Number(
    quoteResult?.data?.shippingTotal
  );

  if (
    !Number.isFinite(merchFoxShipping) ||
    merchFoxShipping < 0
  ) {
    return NextResponse.json(
      { error: "Invalid MerchFox shipping quote" },
      { status: 400 }
    );
  }

  shippingAmount = Math.round(merchFoxShipping * 100);
}
    // =========================
    // MERCH ORDER
    // =========================
    if (orderType === "merch") {
      if (
        !shippingAddress?.first_name?.trim() ||
        !shippingAddress?.last_name?.trim() ||
        !shippingAddress?.address1?.trim() ||
        !shippingAddress?.city?.trim() ||
        !shippingAddress?.region?.trim() ||
        !shippingAddress?.zip?.trim() ||
        shippingAddress?.country?.trim().toUpperCase() !== "US"
      ) {
        return NextResponse.json(
          { error: "Complete shipping address required" },
          { status: 400 }
        );

      }

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

      const shippingResponse = await fetch(
        `https://api.printify.com/v1/shops/${shopId}/orders/shipping.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            line_items: [{
              product_id: printifyProductId,
              variant_id: Number(variantId),
              quantity,
            }],
            address_to: {
              first_name: shippingAddress.first_name?.trim(),
              last_name: shippingAddress.last_name?.trim(),
              address1: shippingAddress.address1?.trim(),
              address2: shippingAddress.address2?.trim() || "",
              city: shippingAddress.city?.trim(),
              region: shippingAddress.region?.trim().toUpperCase(),
              zip: shippingAddress.zip?.trim(),
              country: shippingAddress.country?.trim().toUpperCase(),
            },
          }),
          cache: "no-store",
        }
      );

      if (!shippingResponse.ok) {
        return NextResponse.json(
          { error: "Unable to calculate shipping" },
          { status: 400 }
        );
      }

      const shippingRates = await shippingResponse.json();

      if (
        !Number.isInteger(shippingRates.standard) ||
        shippingRates.standard < 0
      ) {
        return NextResponse.json(
          { error: "Standard shipping unavailable" },
          { status: 400 }
        );
      }

      shippingAmount = shippingRates.standard;

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

        automatic_tax: {
          enabled: true,
        },

        shipping_address_collection: {
          allowed_countries: ["US"],
        },

        shipping_options:
           (orderType === "merch" || isMerchFoxKeychain)
            ? [{
                shipping_rate_data: {
                  type: "fixed_amount",
                  fixed_amount: {
                    amount: shippingAmount,
                    currency: "usd",
                  },
                  display_name: "Standard shipping",
                },
              }]
            : undefined,

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
          fulfillment_provider:
            product === "Jester Oracle QR Keychain"
              ? "merchfox"
              : "",

          merchfox_sku:
            product === "Jester Oracle QR Keychain"
              ? "51200"
              : "",
         quoted_shipping_zip:
  (orderType === "merch" || isMerchFoxKeychain)
    ? shippingAddress?.zip?.trim() || ""
    : "",

quoted_shipping_state:
  (orderType === "merch" || isMerchFoxKeychain)
    ? shippingAddress?.region?.trim().toUpperCase() || ""
    : "",

quoted_shipping_country:
  (orderType === "merch" || isMerchFoxKeychain)
    ? shippingAddress?.country?.trim().toUpperCase() || ""
    : "",
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