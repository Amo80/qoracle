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
      const productName =
        session.metadata?.product_name || "QoRacle Product";

      const theme = session.metadata?.theme || "classic";
const customerName =
  session.customer_details?.name || null;

      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("stripe_session_id", session.id)
        .maybeSingle();

      if (!existingOrder) {
        const { error: insertError } = await supabase
          .from("orders")
          .insert({
            stripe_session_id: session.id,
            product_name: productName,
            theme,
            customer_name: customerName,
            amount_total: session.amount_total,
            currency: session.currency,
            customer_email: session.customer_details?.email || null,
            payment_status: session.payment_status,
          });

        if (insertError) {
          console.error("Unable to save webhook order:", insertError);

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