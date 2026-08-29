import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
        session.metadata?.product_name || "QoRacle Product";

      const theme = session.metadata?.theme || "classic";

      const customerName =
        session.customer_details?.name || null;

      const customerEmail =
        session.customer_details?.email || null;

const shippingAddress =
  session.customer_details?.address
    ? JSON.stringify(session.customer_details.address)
    : null;

      const { data: existingOrder, error: lookupError } =
        await supabase
          .from("orders")
          .select("id")
          .eq("stripe_session_id", session.id)
          .maybeSingle();

      if (lookupError) {
        console.error("Unable to check existing order:", lookupError);

        return NextResponse.json(
          { error: "Unable to check order" },
          { status: 500 }
        );
      }

      if (existingOrder) {
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            product_name: productName,
            theme,
            customer_name: customerName,
            stripe_payment_id: paymentIntentId,
            amount_total: session.amount_total,
            currency: session.currency,
            customer_email: customerEmail,
            payment_status: session.payment_status,
          })
          .eq("stripe_session_id", session.id);

        if (updateError) {
          console.error(
            "Unable to update existing order:",
            updateError
          );

          return NextResponse.json(
            { error: "Unable to update order" },
            { status: 500 }
          );
        }
      } else {
        const { error: insertError } = await supabase
          .from("orders")
          .insert({
            stripe_session_id: session.id,
            product_name: productName,
            theme,
            customer_name: customerName,
            stripe_payment_id: paymentIntentId,
            amount_total: session.amount_total,
            currency: session.currency,
            customer_email: customerEmail,
            payment_status: session.payment_status,
          });

        if (insertError) {
          console.error(
            "Unable to save webhook order:",
            insertError
          );

          return NextResponse.json(
            { error: "Unable to save order" },
            { status: 500 }
          );
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}