import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const PRINTIFY_SHOP_ID = "28814551";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // Require a logged-in Supabase user.
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order ID" },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabaseAdmin
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

    if (order.printify_order_id) {
      return NextResponse.json(
        {
          error: "This order has already been created in Printify.",
          printifyOrderId: order.printify_order_id,
        },
        { status: 409 }
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

    const nameParts = (order.customer_name || "Customer")
      .trim()
      .split(/\s+/);

    const firstName = nameParts.shift() || "Customer";
    const lastName = nameParts.join(" ") || "Customer";

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
              quantity: order.quantity || 1,
            },
          ],

          shipping_method: 1,
          send_shipping_notification: false,

          address_to: {
            first_name: firstName,
            last_name: lastName,
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

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        printify_order_id: printifyData.id,
        printify_fulfillment_status: "created",
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("Unable to save Printify order ID:", updateError);

      return NextResponse.json(
        {
          error:
            "Printify order was created, but the Printify order ID could not be saved.",
          printifyOrder: printifyData,
        },
        { status: 500 }
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