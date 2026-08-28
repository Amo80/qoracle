"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

type ScanRow = {
  qr_code_id: string;
  scanned_at: string;
};

type QRCodeRow = {
  code: string;
  product_name: string | null;
  customer_name: string | null;
};

export default function AnalyticsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [scans, setScans] = useState<ScanRow[]>([]);
  const [codes, setCodes] = useState<QRCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);
    setStatus("");

    const { data: scanData, error: scanError } = await supabase
      .from("scans")
      .select("qr_code_id, scanned_at")
      .order("scanned_at", { ascending: false });

    if (scanError) {
      setStatus(scanError.message);
      setLoading(false);
      return;
    }

    const { data: codeData, error: codeError } = await supabase
      .from("qr_codes")
      .select("code, product_name, customer_name");

    if (codeError) {
      setStatus(codeError.message);
      setLoading(false);
      return;
    }

    setScans(scanData || []);
    setCodes(codeData || []);
    setLoading(false);
  }

  const analytics = useMemo(() => {
    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const scansToday = scans.filter(
      (scan) => new Date(scan.scanned_at) >= startOfToday
    ).length;

    const scans7Days = scans.filter(
      (scan) => new Date(scan.scanned_at) >= sevenDaysAgo
    ).length;

    const scans30Days = scans.filter(
      (scan) => new Date(scan.scanned_at) >= thirtyDaysAgo
    ).length;

    const counts: Record<string, number> = {};

    scans.forEach((scan) => {
      counts[scan.qr_code_id] = (counts[scan.qr_code_id] || 0) + 1;
    });

    const topProducts = Object.entries(counts)
      .map(([code, count]) => {
        const product = codes.find((item) => item.code === code);

        return {
          code,
          count,
          product_name: product?.product_name || "Unnamed Product",
          customer_name: product?.customer_name || "—",
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      scansToday,
      scans7Days,
      scans30Days,
      totalScans: scans.length,
      topProducts,
    };
  }, [scans, codes]);

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#07070d",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <p>Loading analytics...</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#07070d",
        color: "white",
        padding: "30px 20px 60px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <button
          onClick={() => router.push("/admin")}
          style={{
            marginBottom: "24px",
            padding: "10px 16px",
            borderRadius: "10px",
            border: "1px solid #3b3b50",
            background: "#181822",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ← BACK TO DASHBOARD
        </button>

        <div
          style={{
            marginBottom: "28px",
          }}
        >
          <p
            style={{
              color: "#a78bfa",
              letterSpacing: "4px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            QORACLE
          </p>

          <h1
            style={{
              fontSize: "40px",
              margin: 0,
            }}
          >
            Scan Analytics
          </h1>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <StatCard title="Scans Today" value={analytics.scansToday} />
          <StatCard title="Last 7 Days" value={analytics.scans7Days} />
          <StatCard title="Last 30 Days" value={analytics.scans30Days} />
          <StatCard title="All-Time Scans" value={analytics.totalScans} />
        </div>

        <div
          style={{
            background: "#11111a",
            border: "1px solid #29293a",
            borderRadius: "18px",
            padding: "28px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Top Scanned Products</h2>

          {analytics.topProducts.length === 0 ? (
            <p style={{ color: "#999" }}>No scan activity yet.</p>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "650px",
                }}
              >
                <thead>
                  <tr>
                    <th style={headerCell}>Product</th>
                    <th style={headerCell}>Customer</th>
                    <th style={headerCell}>Code</th>
                    <th style={headerCell}>Scans</th>
                  </tr>
                </thead>

                <tbody>
                  {analytics.topProducts.map((item) => (
                    <tr key={item.code}>
                      <td style={tableCell}>{item.product_name}</td>
                      <td style={tableCell}>{item.customer_name}</td>
                      <td style={tableCell}>{item.code}</td>
                      <td style={tableCell}>{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {status && (
            <p
              style={{
                color: "#fca5a5",
                marginTop: "20px",
              }}
            >
              {status}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div
      style={{
        background: "#11111a",
        border: "1px solid #29293a",
        borderRadius: "16px",
        padding: "24px",
      }}
    >
      <p
        style={{
          color: "#999",
          margin: "0 0 10px",
        }}
      >
        {title}
      </p>

      <div
        style={{
          fontSize: "34px",
          fontWeight: "bold",
          color: "#c4b5fd",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const headerCell: React.CSSProperties = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #3b3b50",
  color: "#aaa",
};

const tableCell: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #222230",
};