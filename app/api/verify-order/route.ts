import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { buildOrderRecord } from "@/lib/commerce/order";

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!);

const getSupabase = () =>
  createClient(
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

  const session = await getStripe().checkout.sessions.retrieve(sessionId,
 {
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

    const orderRecord = buildOrderRecord(session, productName);
    const { error: upsertError } = await getSupabase()
      .from("orders")
      .upsert(
        orderRecord,
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
