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

    const lineItem = session.line_items?.data?.[0];

    const productName = lineItem?.description || "QoRacle Product";

    const themeMatch =
      lineItem?.price?.product &&
      typeof lineItem.price.product === "object" &&
      "description" in lineItem.price.product
        ? lineItem.price.product.description
        : null;

    const theme =
      typeof themeMatch === "string"
        ? themeMatch.replace("QoRacle theme: ", "")
        : "classic";

    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_session_id", session.id)
      .maybeSingle();

    if (!existingOrder) {
      const { error: insertError } = await supabase.from("orders").insert({
        stripe_session_id: session.id,
        product_name: productName,
        theme,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_details?.email || null,
        payment_status: session.payment_status,
      });

      if (insertError) {
        console.error(insertError);

        return NextResponse.json(
          { error: "Unable to save order" },
          { status: 500 }
        );
      }
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