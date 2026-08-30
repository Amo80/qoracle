import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
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

    const id = body.id;
    const orderStatus = body.order_status;

    if (!id || !orderStatus) {
      return NextResponse.json(
        { error: "Missing order ID or status" },
        { status: 400 }
      );
    }

    const allowedStatuses = [
      "New",
      "Processing",
      "Shipped",
      "Completed",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return NextResponse.json(
        { error: "Invalid order status" },
        { status: 400 }
      );
    }

    const { error } = await supabase
   .from("orders")
.update({
  order_status: orderStatus,
  shipping_carrier: body.shipping_carrier,
  tracking_number: body.tracking_number,
})
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