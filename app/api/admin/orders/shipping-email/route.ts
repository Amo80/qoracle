import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";



const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
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

    const carrier = order.shipping_carrier || "Carrier";
    const trackingNumber = order.tracking_number;

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

    const trackingUrl =
      trackingLinks[carrier] || null;

    const fromEmail =
      process.env.RESEND_FROM_EMAIL ||
      "The QRystal Balls <onboarding@resend.dev>";

    const customerName =
      order.customer_name || "Customer";

    const trackingButton = trackingUrl
      ? `
        <p style="margin-top: 25px;">
          <a
            href="${trackingUrl}"
            style="
              display:inline-block;
              padding:12px 20px;
              background:#111;
              color:#fff;
              text-decoration:none;
              border-radius:8px;
              font-weight:bold;
            "
          >
            Track Your Package
          </a>
        </p>
      `
      : "";

    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: order.customer_email,
      subject: `Your QRystal Balls Order #${order.id} Has Shipped`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#111;">
          <h1>The QRystal Balls</h1>

          <h2>Your order has shipped! 📦</h2>

          <p>Hello ${customerName},</p>

          <p>
            Great news! Your QRystal Balls order
            <strong>#${order.id}</strong>
            is on its way.
          </p>

          <div
            style="
              margin:25px 0;
              padding:20px;
              background:#f5f5f5;
              border-radius:10px;
            "
          >
            <p>
              <strong>Carrier:</strong> ${carrier}
            </p>

            <p>
              <strong>Tracking Number:</strong>
              ${trackingNumber}
            </p>

            <p>
              <strong>Product:</strong>
              ${order.product_name || "QRystal Balls Card"}
            </p>
          </div>

          ${trackingButton}

          <p style="margin-top:30px;">
            Thank you for your order!
          </p>

          <p>
            — The QRystal Balls Team
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error(emailError);

      return NextResponse.json(
        { error: "Unable to send shipping email" },
        { status: 500 }
      );
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