export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
import OrderStatus from "./OrderStatus/page";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function OrdersPage() {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div style={{ padding: "30px" }}>Unable to load orders.</div>;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#09090b",
        color: "white",
        padding: "30px",
      }}
    >
      <h1>QoRacle Orders</h1>

      <p style={{ color: "#aaa" }}>
        Paid customer orders will appear here.
      </p>

      <div style={{ overflowX: "auto", marginTop: "30px" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={headerStyle}>Date</th>
              <th style={headerStyle}>Product</th>
              <th style={headerStyle}>Theme</th>
              <th style={headerStyle}>Customer</th>
              <th style={headerStyle}>Amount</th>
              <th style={headerStyle}>Status</th>
            </tr>
          </thead>

          <tbody>
            {orders?.map((order) => (
              <tr key={order.id}>
                <td style={cellStyle}>
                  {new Date(order.created_at).toLocaleString()}
                </td>

                <td style={cellStyle}>{order.product_name}</td>

                <td style={cellStyle}>
                  {order.theme?.toUpperCase()}
                </td>

                <td style={cellStyle}>
                  {order.customer_email || "No email"}
                </td>

                <td style={cellStyle}>
                  {order.amount_total
                    ? `$${(order.amount_total / 100).toFixed(2)}`
                    : "—"}
                </td>

                <td style={cellStyle}>
                  {order.payment_status}
                </td>
<td style={cellStyle}>
  <OrderStatus
    orderId={order.id}
    currentStatus={order.order_status || "New"}
  />
</td>
<td style={cellStyle}>
  <a
    href={`/admin/orders/${order.id}`}
    style={{
      color: "white",
      textDecoration: "none",
      fontWeight: "bold",
    }}
  >
    VIEW
  </a>
</td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

const headerStyle = {
  textAlign: "left" as const,
  padding: "12px",
  borderBottom: "1px solid #333",
  color: "#aaa",
};

const cellStyle = {
  padding: "12px",
  borderBottom: "1px solid #222",
};