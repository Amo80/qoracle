import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);

    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === "paid") {
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || null;

      const productName =
        session.metadata?.product_name || "QRystal Balls Product";

      const theme = session.metadata?.theme || "jester";
const printifyProductId =
  session.metadata?.printify_product_id || null;

const printifyVariantId =
  session.metadata?.printify_variant_id || null;

const printifyVariantTitle =
  session.metadata?.printify_variant_title || null;

const metadataQuantity = Number(session.metadata?.quantity);
const quantity =
  Number.isInteger(metadataQuantity) &&
  metadataQuantity >= 1 &&
  metadataQuantity <= 10
    ? metadataQuantity
    : 1;
const fulfillmentProvider =
  session.metadata?.fulfillment_provider || null;

const merchfoxSku =
  session.metadata?.merchfox_sku || null;

const isMerchFoxJesterKeychain =
  fulfillmentProvider === "merchfox" &&
  merchfoxSku === "51200" &&
  productName === "Jester Oracle QR Keychain" &&
  theme === "jester";


      const customerName =
        session.customer_details?.name || null;

      const customerEmail =
        session.customer_details?.email || null;

const shippingDetails = session.collected_information?.shipping_details;

const quotedShippingZip = session.metadata?.quoted_shipping_zip?.trim().toUpperCase() || "";
const quotedShippingState = session.metadata?.quoted_shipping_state?.trim().toUpperCase() || "";
const quotedShippingCountry = session.metadata?.quoted_shipping_country?.trim().toUpperCase() || "";

const finalShippingZip = shippingDetails?.address?.postal_code?.trim().toUpperCase() || "";
const finalShippingState = shippingDetails?.address?.state?.trim().toUpperCase() || "";
const finalShippingCountry = shippingDetails?.address?.country?.trim().toUpperCase() || "";

const shippingQuoteMismatch =
  (session.metadata?.order_type === "merch" ||
    isMerchFoxJesterKeychain) &&
  (!quotedShippingZip ||
    !quotedShippingState ||
    !quotedShippingCountry ||
    quotedShippingZip !== finalShippingZip ||
    quotedShippingState !== finalShippingState ||
    quotedShippingCountry !== finalShippingCountry);

const shippingAddress =
  shippingDetails?.address
    ? JSON.stringify(shippingDetails.address)
    : null;

      const { error: upsertError } = await supabase
        .from("orders")
        .upsert(
          {
            stripe_session_id: session.id,
            product_name: productName,
            theme,
            customer_name: customerName,
            stripe_payment_id: paymentIntentId,
            amount_total: session.amount_total,
            currency: session.currency,
printify_product_id: printifyProductId,
printify_variant_id: printifyVariantId,
printify_variant_title: printifyVariantTitle,
            quantity,
            customer_email: customerEmail,
            shipping_address: shippingAddress,
            payment_status: session.payment_status,
          },
          { onConflict: "stripe_session_id" }
        );

      if (upsertError) {
        console.error("Unable to save webhook order:", upsertError);

        return NextResponse.json(
          { error: "Unable to save order" },
          { status: 500 }
        );
      }
      if (isMerchFoxJesterKeychain) {
        if (shippingQuoteMismatch) {
         console.error("MerchFox fulfillment blocked: shipping address mismatch", {
  sessionId: session.id,
  quoted: {
    zip: quotedShippingZip,
    state: quotedShippingState,
    country: quotedShippingCountry,
  },
  final: {
    zip: finalShippingZip,
    state: finalShippingState,
    country: finalShippingCountry,
  },
});
          return NextResponse.json(
            { error: "Shipping address changed after quote" },
            { status: 400 }
          );
        }

        if (!shippingDetails?.address) {
          console.error(
            `MerchFox fulfillment blocked: Stripe session ${session.id} has no shipping address.`
          );

          return NextResponse.json(
            { error: "Missing shipping address" },
            { status: 400 }
          );
        }

      const merchFoxApiKey =
  process.env.MERCHFOX_SANDBOX_API_KEY;

const merchFoxApiSecret =
  process.env.MERCHFOX_SANDBOX_APP_SECRET;

        if (!merchFoxApiKey || !merchFoxApiSecret) {
          console.error("MerchFox credentials are missing");

          return NextResponse.json(
            { error: "MerchFox credentials are missing" },
            { status: 500 }
          );
        }
        const merchFoxResponse = await fetch(
          "https://api-sandbox.merchfox.com/api/v1/orders/quick/submit",
          {
            method: "POST",
            headers: {
              "X-Mfx-App-Key": merchFoxApiKey,
              "X-Mfx-App-Secret": merchFoxApiSecret,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderid: session.id,
              firstName:
                shippingDetails.name?.trim().split(" ")[0] ||
                customerName?.trim().split(" ")[0] ||
                "Customer",
              lastName:
                shippingDetails.name?.trim().split(" ").slice(1).join(" ") ||
                customerName?.trim().split(" ").slice(1).join(" ") ||
                "Customer",
              address1: shippingDetails.address.line1 || "",
              address2: shippingDetails.address.line2 || "",
              city: shippingDetails.address.city || "",
              state: shippingDetails.address.state || "",
              country: shippingDetails.address.country || "US",
              zip: shippingDetails.address.postal_code || "",
              email: customerEmail || "",
              fulfillmentServiceKey: "FIRST_CLASS",
              priorityTrackingAddOnEnabled: false,
              printAreaCount: 1,
              createProducts: false,
              products: [
                {
                  sku: "51200",
                  quantity,
                  blueprintId:
                    "504d6843-b927-4f0d-afdb-f54321e8aac2",
                  designUrlsByArea: {
                    FRONT:
                      "https://theqrystalballs.com/products/jester-keychain-print.png",
                  },
                },
              ],
            }),
            cache: "no-store",
          }
        );
        const merchFoxResult = await merchFoxResponse
          .json()
          .catch(() => null);

        if (
          !merchFoxResponse.ok ||
          merchFoxResult?.code !== 0
        ) {
          console.error(
            "MerchFox fulfillment failed:",
            merchFoxResult
          );

          return NextResponse.json(
            { error: "Unable to submit MerchFox fulfillment" },
            { status: 500 }
          );
        }

        console.log(
          `MerchFox sandbox fulfillment accepted for Stripe session ${session.id}:`,
          merchFoxResult
        );
      }
      if (!customerEmail) {
        console.warn(
          `Order confirmation not sent: Stripe session ${session.id} has no customer email.`
        );
      } else {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail =
          process.env.RESEND_FROM_EMAIL ||
          "The QRystal Balls <onboarding@resend.dev>";
        const amountPaid = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: (session.currency || "usd").toUpperCase(),
        }).format((session.amount_total || 0) / 100);
        const variantRow = printifyVariantTitle
          ? `<p><strong>Variant:</strong> ${escapeHtml(printifyVariantTitle)}</p>`
          : "";

        try {
          const { error: emailError } = await resend.emails.send(
            {
              from: fromEmail,
              to: customerEmail,
              subject: "Your QRystal Balls™ order is confirmed",
              html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#111;">
                  <h1>The QRystal Balls™</h1>
                  <h2>Thank you for your order!</h2>
                  <p>Your payment was successful and your order is confirmed.</p>
                  <div style="margin:25px 0;padding:20px;background:#f5f5f5;border-radius:10px;">
                    <p><strong>Product:</strong> ${escapeHtml(productName)}</p>
                    ${variantRow}
                    <p><strong>Quantity:</strong> ${quantity}</p>
                    <p><strong>Total paid:</strong> ${escapeHtml(amountPaid)}</p>
                    <p><strong>Customer email:</strong> ${escapeHtml(customerEmail)}</p>
                  </div>
                  <p>Shipping and tracking details will follow when your order ships.</p>
                  <p>
                    Need help? Contact us at
                    <a href="mailto:support@theqrystalballs.com">support@theqrystalballs.com</a>.
                  </p>
                  <p>— The QRystal Balls Team</p>
                </div>
              `,
            },
            {
              idempotencyKey: `order-confirmation-${session.id}`,
            }
          );

          if (emailError) {
            console.error("Order confirmation email failed:", emailError);

            return NextResponse.json(
              { error: "Unable to send order confirmation" },
              { status: 500 }
            );
          }
        } catch (error) {
          console.error("Order confirmation email failed:", error);

          return NextResponse.json(
            { error: "Unable to send order confirmation" },
            { status: 500 }
          );
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}