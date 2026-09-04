import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PRINTIFY_SHOP_ID = "28814551";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order ID" },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Order has not been paid" },
        { status: 400 }
      );
    }

    if (!order.printify_product_id || !order.printify_variant_id) {
      return NextResponse.json(
        { error: "This is not a Printify merch order" },
        { status: 400 }
      );
    }

    let shippingAddress: any = {};

    if (order.shipping_address) {
      try {
        shippingAddress =
          typeof order.shipping_address === "string"
            ? JSON.parse(order.shipping_address)
            : order.shipping_address;
      } catch {
        return NextResponse.json(
          { error: "Invalid shipping address" },
          { status: 400 }
        );
      }
    }

    if (
      !shippingAddress.line1 ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.postal_code ||
      !shippingAddress.country
    ) {
      return NextResponse.json(
        { error: "Incomplete shipping address" },
        { status: 400 }
      );
    }

    const printifyResponse = await fetch(
      `https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID}/orders.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          external_id: `qrystal-order-${order.id}`,
          label: `QRystal Balls Order #${order.id}`,

          line_items: [
            {
              product_id: order.printify_product_id,
              variant_id: Number(order.printify_variant_id),
              quantity: 1,
            },
          ],

          shipping_method: 1,

          send_shipping_notification: false,

          address_to: {
            first_name: order.customer_name || "Customer",
            last_name: "",
            email: order.customer_email || "",
            phone: "",
            country: shippingAddress.country,
            region: shippingAddress.state,
            address1: shippingAddress.line1,
            address2: shippingAddress.line2 || "",
            city: shippingAddress.city,
            zip: shippingAddress.postal_code,
          },
        }),
      }
    );

    const printifyData = await printifyResponse.json();

    if (!printifyResponse.ok) {
      console.error("Printify order error:", printifyData);

      return NextResponse.json(
        {
          error: "Printify rejected the order",
          details: printifyData,
        },
        { status: printifyResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order created in Printify for manual review.",
      printifyOrder: printifyData,
    });
  } catch (error) {
    console.error("Printify fulfillment error:", error);

    return NextResponse.json(
      { error: "Unable to create Printify order" },
      { status: 500 }
    );
  }
}