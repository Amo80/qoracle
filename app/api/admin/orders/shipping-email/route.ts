import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { requireAdminApi } from "@/lib/auth/admin";
import { buildShippingEmailHtml } from "@/lib/email/shipping";



const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const { response } = await requireAdminApi();
  if (response) return response;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const body = await request.json();
    const orderId = body.orderId;

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order ID" },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (!order.customer_email) {
      return NextResponse.json(
        { error: "Customer email is missing" },
        { status: 400 }
      );
    }

    if (!order.tracking_number) {
      return NextResponse.json(
        { error: "Tracking number is missing" },
        { status: 400 }
      );
    }

    const fromEmail =
      process.env.RESEND_FROM_EMAIL ||
      "The QRystal Balls <onboarding@resend.dev>";

    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: order.customer_email,
      subject: `Your QRystal Balls Order #${order.id} Has Shipped`,
      html: buildShippingEmailHtml({
        orderId: order.id,
        customerName: order.customer_name,
        productName: order.product_name,
        carrier: order.shipping_carrier,
        trackingNumber: order.tracking_number,
      }),
    });

    if (emailError) {
      console.error(emailError);

      return NextResponse.json(
        { error: "Unable to send shipping email" },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ shipped_email_sent: true })
      .eq("id", order.id);

    if (updateError) {
      console.error("Shipping email sent but status could not be saved:", updateError);
    }

    return NextResponse.json({
      success: true,
      message: "Shipping email sent",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unable to send shipping email" },
      { status: 500 }
    );
  }
}
