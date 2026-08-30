import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function PackingSlipPage({
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
          padding: "40px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h1>Order Not Found</h1>
        <p>Unable to load this order.</p>
      </main>
    );
  }

  let shippingAddress = "—";

  if (order.shipping_address) {
    try {
      const address =
        typeof order.shipping_address === "string"
          ? JSON.parse(order.shipping_address)
          : order.shipping_address;

      shippingAddress = [
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
      shippingAddress = String(order.shipping_address);
    }
  }

  const amount = order.amount_total
    ? `$${(order.amount_total / 100).toFixed(2)}`
    : "—";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        color: "#111",
      }}
    >
      <div
        className="no-print"
        style={{
          marginBottom: "20px",
          display: "flex",
          gap: "10px",
        }}
      >
        <a
          href={`/admin/orders/${order.id}`}
          style={{
            padding: "10px 16px",
            background: "#222",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
          }}
        >
          ← Back to Order
        </a>

             </div>

      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          background: "white",
          padding: "45px",
          border: "1px solid #ddd",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "2px solid #111",
            paddingBottom: "20px",
            marginBottom: "30px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "32px",
              }}
            >
              QoRacle
            </h1>

            <p
              style={{
                margin: "6px 0 0",
                color: "#666",
              }}
            >
              Packing Slip
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <strong>Order #{order.id}</strong>
            <br />
            {new Date(order.created_at).toLocaleDateString()}
          </div>
        </div>

        <section style={{ marginBottom: "30px" }}>
          <h2 style={sectionHeadingStyle}>Ship To</h2>

          <div
            style={{
              fontSize: "17px",
              lineHeight: "1.6",
            }}
          >
            <strong>{order.customer_name || "Customer"}</strong>
            <br />
            {shippingAddress}
          </div>
        </section>

        <section style={{ marginBottom: "30px" }}>
          <h2 style={sectionHeadingStyle}>Order Information</h2>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <tbody>
              <tr>
                <td style={labelStyle}>Product</td>
                <td style={valueStyle}>
                  {order.product_name || "—"}
                </td>
              </tr>

              <tr>
                <td style={labelStyle}>Theme</td>
                <td style={valueStyle}>
                  {order.theme?.toUpperCase() || "—"}
                </td>
              </tr>

              <tr>
                <td style={labelStyle}>Quantity</td>
                <td style={valueStyle}>1</td>
              </tr>

              <tr>
                <td style={labelStyle}>Amount Paid</td>
                <td style={valueStyle}>{amount}</td>
              </tr>

              <tr>
                <td style={labelStyle}>Payment Status</td>
                <td style={valueStyle}>
                  {order.payment_status || "—"}
                </td>
              </tr>

              <tr>
                <td style={labelStyle}>Order Status</td>
                <td style={valueStyle}>
                  {order.order_status || "New"}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 style={sectionHeadingStyle}>Customer Contact</h2>

          <p style={{ margin: 0 }}>
            {order.customer_email || "No email provided"}
          </p>
        </section>

        <div
          style={{
            borderTop: "2px solid #111",
            marginTop: "40px",
            paddingTop: "20px",
            textAlign: "center",
            color: "#666",
          }}
        >
          Thank you for your QoRacle order!
        </div>
      </div>

      <style>{`
        @media print {
          body {
            margin: 0;
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          main {
            padding: 0 !important;
            background: white !important;
          }

          main > div {
            box-shadow: none !important;
            border: none !important;
            max-width: none !important;
            padding: 20px !important;
          }
        }
      `}</style>
    </main>
  );
}

const sectionHeadingStyle = {
  fontSize: "18px",
  marginBottom: "12px",
  borderBottom: "1px solid #ddd",
  paddingBottom: "8px",
};

const labelStyle = {
  padding: "10px 0",
  fontWeight: "bold" as const,
  width: "180px",
  borderBottom: "1px solid #eee",
};

const valueStyle = {
  padding: "10px 0",
  borderBottom: "1px solid #eee",
};