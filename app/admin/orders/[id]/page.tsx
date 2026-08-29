import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

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
            <strong>Product:</strong>{" "}
            {order.product_name}
          </p>

          <p>
            <strong>Theme:</strong>{" "}
            {order.theme?.toUpperCase() || "—"}
          </p>

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

          <p>
            <strong>Order Status:</strong>{" "}
            {order.order_status || "New"}
          </p>

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