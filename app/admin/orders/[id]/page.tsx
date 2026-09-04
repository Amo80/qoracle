import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import TrackingForm from "./TrackingForm/page";
import OrderStatus from "../OrderStatus/page";
import ShippingEmail from "./ShippingEmail/page";
import SendToPrintify from "./SendToPrintify";
import SyncPrintifyStatus from "./SyncPrintifyStatus";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !order) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#09090b",
          color: "white",
          padding: "40px",
        }}
      >
        <h1>Order Not Found</h1>
        <Link
          href="/admin/orders"
          style={{ color: "#aaa" }}
        >
          Back to Orders
        </Link>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#09090b",
        color: "white",
        padding: "40px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <Link
          href="/admin/orders"
          style={{
            color: "#aaa",
            textDecoration: "none",
          }}
        >
          ← Back to Orders
        </Link>
<Link
  href={`/admin/orders/${order.id}/packing-slip`}
  style={{
    display: "inline-block",
    marginTop: "15px",
    padding: "10px 16px",
    background: "#222",
    color: "white",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: "bold",
  }}
>
  🖨️ Packing Slip
</Link>

        <h1 style={{ marginTop: "25px" }}>
          Order #{order.id}
        </h1>

        <div
          style={{
            background: "#11111a",
            border: "1px solid #29293a",
            borderRadius: "18px",
            padding: "30px",
            marginTop: "25px",
          }}
        >
          <h2>Order Details</h2>

          <p>
            <strong>Customer:</strong>{" "}
            {order.customer_name || "—"}
          </p>

          <p>
            <strong>Email:</strong>{" "}
            {order.customer_email || "—"}
          </p>
<p>
  <strong>Shipping Address:</strong>{" "}
  {order.shipping_address
    ? (() => {
        try {
          const address = JSON.parse(order.shipping_address);

          return [
            address.line1,
            address.line2,
            address.city,
            address.state,
            address.postal_code,
            address.country,
          ]
            .filter(Boolean)
            .join(", ");
        } catch {
          return order.shipping_address;
        }
      })()
    : "—"}
</p>
<p>
  <strong>Shipping Carrier:</strong>{" "}
  {order.shipping_carrier || "Not shipped"}
</p>

<p>
  <strong>Tracking Number:</strong>{" "}
  {order.tracking_number || "Not shipped"}
</p>
<TrackingForm
  orderId={order.id}
  currentCarrier={order.shipping_carrier}
  currentTrackingNumber={order.tracking_number}
/>
<ShippingEmail
  orderId={order.id}
  customerEmail={order.customer_email}
  trackingNumber={order.tracking_number}
/>
          <p>
            <strong>Product:</strong>{" "}
            {order.product_name}
          </p>

          <p>
            <strong>Theme:</strong>{" "}
            {order.theme?.toUpperCase() || "—"}
          </p>
<p>
  <strong>Variant:</strong>{" "}
  {order.printify_variant_title || "—"}
</p>
<p>
  <strong>Quantity:</strong>{" "}
  {order.quantity || 1}
</p>

<p>
  <strong>Printify Variant ID:</strong>{" "}
  {order.printify_variant_id || "—"}
</p>

<p>
  <strong>Printify Product ID:</strong>{" "}
  {order.printify_product_id || "—"}
</p>

{order.printify_product_id &&
  order.printify_variant_id &&
  order.payment_status === "paid" &&
  !order.printify_order_id && (
    <SendToPrintify orderId={order.id} />
  )}

{order.printify_order_id && (
  <div
    style={{
      marginTop: "24px",
      padding: "20px",
      border: "1px solid #2f4f3f",
      borderRadius: "12px",
      background: "#102018",
    }}
  >
    <h3 style={{ marginTop: 0 }}>
      Printify Order Created
    </h3>

    <p style={{ color: "#bbb", marginBottom: "6px" }}>
      This order has already been sent to Printify for manual review.
    </p>

    <p style={{ marginBottom: 0 }}>
      <strong>Printify Order ID:</strong>{" "}
      {order.printify_order_id}
    </p>

<p style={{ marginTop: "10px", marginBottom: 0 }}>
  <strong>Printify Status:</strong>{" "}
  {order.printify_fulfillment_status || "unknown"}
</p>

<SyncPrintifyStatus orderId={order.id} />
  </div>
)}

          <p>
            <strong>Amount:</strong>{" "}
            {order.amount_total
              ? `$${(order.amount_total / 100).toFixed(2)}`
              : "—"}
          </p>

          <p>
            <strong>Payment Status:</strong>{" "}
            {order.payment_status || "—"}
          </p>

        <div style={{ marginTop: "16px" }}>
  <strong>Order Status:</strong>

  <div style={{ marginTop: "8px" }}>
    <OrderStatus
      orderId={order.id}
      currentStatus={order.order_status || "New"}
    />
  </div>
</div>
          <p>
            <strong>Stripe Payment ID:</strong>{" "}
            {order.stripe_payment_id || "—"}
          </p>

          <p>
            <strong>Stripe Session ID:</strong>{" "}
            {order.stripe_session_id || "—"}
          </p>

          <p>
            <strong>Order Date:</strong>{" "}
            {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    </main>
  );
}