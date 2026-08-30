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