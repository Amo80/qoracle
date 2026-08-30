import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(request: Request) {
  const authClient = await createServerClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  try {
    const body = await request.json();

    const id = body.id || body.orderId;
const orderStatus = body.order_status;

const hasTrackingUpdate =
  body.shipping_carrier !== undefined ||
  body.tracking_number !== undefined;

if (!id) {
  return NextResponse.json(
    { error: "Missing order ID" },
    { status: 400 }
  );
}

if (!orderStatus && !hasTrackingUpdate) {
  return NextResponse.json(
    { error: "Missing order update" },
    { status: 400 }
  );
}

const allowedStatuses = [
  "New",
  "Processing",
  "Shipped",
  "Completed",
];

if (
  orderStatus &&
  !allowedStatuses.includes(orderStatus)
) {
  return NextResponse.json(
    { error: "Invalid order status" },
    { status: 400 }
  );
}
   const updateData: Record<string, string> = {};

if (orderStatus) {
  updateData.order_status = orderStatus;
}

if (body.shipping_carrier !== undefined) {
  updateData.shipping_carrier = body.shipping_carrier;
}

if (body.tracking_number !== undefined) {
  updateData.tracking_number = body.tracking_number;
}
if (orderStatus === "Shipped") {
  const { data: existingOrder } = await supabase
    .from("orders")
    .select(
      "customer_email, customer_name, product_name, shipping_carrier, tracking_number, shipped_email_sent"
    )
    .eq("id", id)
    .single();

  if (
    existingOrder &&
    !existingOrder.shipped_email_sent &&
    existingOrder.customer_email &&
    existingOrder.tracking_number
  ) {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const carrier = existingOrder.shipping_carrier || "Carrier";
    const trackingNumber = existingOrder.tracking_number;
    const customerName = existingOrder.customer_name || "Customer";

    const trackingLinks: Record<string, string> = {
      USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(
        trackingNumber
      )}`,
      UPS: `https://www.ups.com/track?tracknum=${encodeURIComponent(
        trackingNumber
      )}`,
      FedEx: `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(
        trackingNumber
      )}`,
      DHL: `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${encodeURIComponent(
        trackingNumber
      )}`,
    };

    const trackingUrl = trackingLinks[carrier];

    const { error: emailError } = await resend.emails.send({
      from: "QoRacle <onboarding@resend.dev>",
      to: existingOrder.customer_email,
      subject: `Your QoRacle Order #${id} Has Shipped`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#111;">
          <h1>QoRacle</h1>
          <h2>Your order has shipped! 📦</h2>

          <p>Hello ${customerName},</p>

          <p>
            Your QoRacle order <strong>#${id}</strong> is on its way.
          </p>

          <div style="margin:25px 0;padding:20px;background:#f5f5f5;border-radius:10px;">
            <p><strong>Carrier:</strong> ${carrier}</p>
            <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
            <p><strong>Product:</strong> ${
              existingOrder.product_name || "QoRacle Card"
            }</p>
          </div>

          ${
            trackingUrl
              ? `<p>
                  <a href="${trackingUrl}"
                    style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">
                    Track Your Package
                  </a>
                </p>`
              : ""
          }

          <p>Thank you for your order!</p>
          <p>— The QoRacle Team</p>
        </div>
      `,
    });

    if (!emailError) {
      await supabase
        .from("orders")
        .update({ shipped_email_sent: true })
        .eq("id", id);
    } else {
      console.error("Shipping email failed:", emailError);
    }
  }
}
const { error } = await supabase
  .from("orders")
  .update(updateData)
  .eq("id", id);
    if (error) {
      console.error(error);

      return NextResponse.json(
        { error: "Unable to update order" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unable to update order" },
      { status: 500 }
    );
  }
}