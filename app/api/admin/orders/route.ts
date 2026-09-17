import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdminApi } from "@/lib/auth/admin";
import { buildShippingEmailHtml } from "@/lib/email/shipping";

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

const allowedStatuses = ["New", "Processing", "Shipped", "Completed"];

export async function PATCH(request: Request) {
  const { response } = await requireAdminApi();
  if (response) return response;

  try {
    const body = await request.json();
    const id = body.id || body.orderId;
    const orderStatus = body.order_status;
    const hasTrackingUpdate =
      body.shipping_carrier !== undefined || body.tracking_number !== undefined;

    if (!id) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    if (!orderStatus && !hasTrackingUpdate) {
      return NextResponse.json({ error: "Missing order update" }, { status: 400 });
    }

    if (orderStatus && !allowedStatuses.includes(orderStatus)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
    }

    const updateData: Record<string, string> = {};
    if (orderStatus) updateData.order_status = orderStatus;
    if (body.shipping_carrier !== undefined) {
      updateData.shipping_carrier = String(body.shipping_carrier).trim();
    }
    if (body.tracking_number !== undefined) {
      updateData.tracking_number = String(body.tracking_number).trim();
    }

    const { data: updatedOrder, error: updateError } = await getSupabase()
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select(
        "id, customer_email, customer_name, product_name, shipping_carrier, tracking_number, shipped_email_sent"
      )
      .single();

    if (updateError || !updatedOrder) {
      console.error(updateError);
      return NextResponse.json({ error: "Unable to update order" }, { status: 500 });
    }

    if (
      orderStatus === "Shipped" &&
      !updatedOrder.shipped_email_sent &&
      updatedOrder.customer_email &&
      updatedOrder.tracking_number
    ) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail =
        process.env.RESEND_FROM_EMAIL ||
        "The QRystal Balls <onboarding@resend.dev>";
      const { error: emailError } = await resend.emails.send({
        from: fromEmail,
        to: updatedOrder.customer_email,
        subject: `Your QRystal Balls Order #${id} Has Shipped`,
        html: buildShippingEmailHtml({
          orderId: id,
          customerName: updatedOrder.customer_name,
          productName: updatedOrder.product_name,
          carrier: updatedOrder.shipping_carrier,
          trackingNumber: updatedOrder.tracking_number,
        }),
      });

      if (emailError) {
        console.error("Shipping email failed:", emailError);
      } else {
        await getSupabase()
          .from("orders")
          .update({ shipped_email_sent: true })
          .eq("id", id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to update order" }, { status: 500 });
  }
}
