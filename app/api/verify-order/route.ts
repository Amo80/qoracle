import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionId = body.session_id as string;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session ID" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment is not complete" },
        { status: 400 }
      );
    }

   const productName =
  session.metadata?.product_name ||
  session.line_items?.data?.[0]?.description ||
  "QRystal Balls Product";

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

const paymentIntentId =
  typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id || null;

const shippingDetails = session.collected_information?.shipping_details;

const quotedShippingZip = session.metadata?.quoted_shipping_zip?.trim().toUpperCase() || "";
const quotedShippingState = session.metadata?.quoted_shipping_state?.trim().toUpperCase() || "";
const quotedShippingCountry = session.metadata?.quoted_shipping_country?.trim().toUpperCase() || "";

const finalShippingZip = shippingDetails?.address?.postal_code?.trim().toUpperCase() || "";
const finalShippingState = shippingDetails?.address?.state?.trim().toUpperCase() || "";
const finalShippingCountry = shippingDetails?.address?.country?.trim().toUpperCase() || "";

const shippingQuoteMismatch =
  session.metadata?.order_type === "merch" &&
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
          printify_product_id: printifyProductId,
          printify_variant_id: printifyVariantId,
          printify_variant_title: printifyVariantTitle,
          quantity,
          customer_name: session.customer_details?.name || null,
          stripe_payment_id: paymentIntentId,
          amount_total: session.amount_total,
          currency: session.currency,
          customer_email: session.customer_details?.email || null,
          shipping_address: shippingAddress,
          payment_status: session.payment_status,
        },
        { onConflict: "stripe_session_id" }
      );

    if (upsertError) {
      console.error(upsertError);

      return NextResponse.json(
        { error: "Unable to save order" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unable to verify order" },
      { status: 500 }
    );
  }
}