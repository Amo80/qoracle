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
      .select("id, printify_order_id")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (!order.printify_order_id) {
      return NextResponse.json(
        { error: "This order has not been created in Printify yet" },
        { status: 400 }
      );
    }

    const printifyResponse = await fetch(
      `https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID}/orders/${order.printify_order_id}.json`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const printifyData = await printifyResponse.json();

    if (!printifyResponse.ok) {
      return NextResponse.json(
        {
          error: "Unable to retrieve Printify order status",
          details: printifyData,
        },
        { status: printifyResponse.status }
      );
    }

    const fulfillmentStatus = printifyData.status || "unknown";

    const shipment =
      Array.isArray(printifyData.shipments) &&
      printifyData.shipments.length > 0
        ? printifyData.shipments[0]
        : null;

    const updateData: Record<string, any> = {
      printify_fulfillment_status: fulfillmentStatus,
    };

    if (shipment?.carrier) {
      updateData.shipping_carrier = shipment.carrier;
    }

    if (shipment?.number) {
      updateData.tracking_number = shipment.number;
    }

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update(updateData)
      .eq("id", order.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Unable to save Printify status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: fulfillmentStatus,
      carrier: shipment?.carrier || null,
      trackingNumber: shipment?.number || null,
    });
  } catch (error) {
    console.error("Printify status sync error:", error);

    return NextResponse.json(
      { error: "Unable to sync Printify status" },
      { status: 500 }
    );
  }
}