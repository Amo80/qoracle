export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import OrderStatus from "./OrderStatus/page";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div style={{ padding: "30px" }}>
        Unable to load orders.
      </div>
    );
  }

  const filteredOrders = (orders || []).filter((order) => {
    if (!q) return true;

    const search = q.toLowerCase();

    return (
      String(order.id).toLowerCase().includes(search) ||
      (order.customer_name || "").toLowerCase().includes(search) ||
      (order.customer_email || "").toLowerCase().includes(search) ||
      (order.product_name || "").toLowerCase().includes(search)
    );
  });

  const totalRevenue =
    (orders || []).reduce(
      (total, order) => total + (order.amount_total || 0),
      0
    ) / 100;

  const averageOrderValue =
    orders && orders.length
      ? totalRevenue / orders.length
      : 0;

  const totalPaid =
    orders?.filter(
      (order) => order.payment_status === "paid"
    ).length || 0;

  const newOrders =
    orders?.filter(
      (order) => (order.order_status || "New") === "New"
    ).length || 0;

  const processingOrders =
    orders?.filter(
      (order) => order.order_status === "Processing"
    ).length || 0;

  const shippedOrders =
    orders?.filter(
      (order) => order.order_status === "Shipped"
    ).length || 0;

  const completedOrders =
    orders?.filter(
      (order) => order.order_status === "Completed"
    ).length || 0;

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

      <form
        method="GET"
        style={{
          marginTop: "20px",
          marginBottom: "25px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search customer, email, product, or order ID..."
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "12px 14px",
            borderRadius: "10px",
            border: "1px solid #3b3b50",
            background: "#11111a",
            color: "white",
            fontSize: "16px",
          }}
        />

        <button
          type="submit"
          style={{
            padding: "12px 18px",
            borderRadius: "10px",
            border: "1px solid #3b3b50",
            background: "#222230",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Search
        </button>

        <a
          href="/admin/orders"
          style={{
            padding: "12px 18px",
            borderRadius: "10px",
            border: "1px solid #3b3b50",
            background: "#11111a",
            color: "white",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Clear
        </a>
      </form>

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "25px",
        }}
      >
        <div style={summaryCardStyle}>
          <strong>New</strong>
          <div>{newOrders}</div>
        </div>

        <div style={summaryCardStyle}>
          <strong>Processing</strong>
          <div>{processingOrders}</div>
        </div>

        <div style={summaryCardStyle}>
          <strong>Shipped</strong>
          <div>{shippedOrders}</div>
        </div>

        <div style={summaryCardStyle}>
          <strong>Completed</strong>
          <div>{completedOrders}</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "25px",
        }}
      >
        <div style={summaryCardStyle}>
          <strong>Total Orders</strong>
          <div>{orders?.length || 0}</div>
        </div>

        <div style={summaryCardStyle}>
          <strong>Total Paid</strong>
          <div>{totalPaid}</div>
        </div>

        <div style={summaryCardStyle}>
          <strong>Total Revenue</strong>
          <div>${totalRevenue.toFixed(2)}</div>
        </div>

        <div style={summaryCardStyle}>
          <strong>Average Order</strong>
          <div>${averageOrderValue.toFixed(2)}</div>
        </div>
      </div>

      <p style={{ color: "#aaa" }}>
        {q
          ? `Showing ${filteredOrders.length} matching order${
              filteredOrders.length === 1 ? "" : "s"
            }.`
          : "Paid customer orders will appear here."}
      </p>

      <div
        style={{
          overflowX: "auto",
          marginTop: "30px",
        }}
      >
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
              <th style={headerStyle}>Payment</th>
              <th style={headerStyle}>Order Status</th>
              <th style={headerStyle}>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td style={cellStyle}>
                  {new Date(
                    order.created_at
                  ).toLocaleString()}
                </td>

                <td style={cellStyle}>
                  {order.product_name}
                </td>

                <td style={cellStyle}>
                  {order.theme?.toUpperCase()}
                </td>

                <td style={cellStyle}>
                  {order.customer_email || "No email"}
                </td>

                <td style={cellStyle}>
                  {order.amount_total
                    ? `$${(
                        order.amount_total / 100
                      ).toFixed(2)}`
                    : "—"}
                </td>

                <td style={cellStyle}>
                  {order.payment_status}
                </td>

                <td style={cellStyle}>
                  <OrderStatus
                    orderId={order.id}
                    currentStatus={
                      order.order_status || "New"
                    }
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

const summaryCardStyle = {
  background: "#11111a",
  border: "1px solid #29293a",
  borderRadius: "12px",
  padding: "14px 18px",
  minWidth: "120px",
};

const cellStyle = {
  padding: "12px",
  borderBottom: "1px solid #222",
};