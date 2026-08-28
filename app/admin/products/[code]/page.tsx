"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/browser";

type QRCodeRow = {
  code: string;
  theme: string;
  active: boolean;
  created_at: string;
  product_name: string | null;
  customer_name: string | null;
  notes: string | null;
};

type ScanRow = {
  scanned_at: string;
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const code = params.code as string;

  const [product, setProduct] = useState<QRCodeRow | null>(null);
  const [scans, setScans] = useState<ScanRow[]>([]);
const [totalScans, setTotalScans] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadProduct();
  }, [code]);

  async function loadProduct() {
    setLoading(true);

    const { data: productData, error: productError } = await supabase
      .from("qr_codes")
      .select(
        "code, theme, active, created_at, product_name, customer_name, notes"
      )
      .eq("code", code)
      .single();

    if (productError) {
      setStatus(productError.message);
      setLoading(false);
      return;
    }

    const { data: scanData, error: scanError } = await supabase
      .from("scans")
      .select("scanned_at")
      .eq("qr_code_id", code)
      .order("scanned_at", { ascending: false })
      .limit(10);
const { count: scanCount, error: countError } = await supabase
  .from("scans")
  .select("*", { count: "exact", head: true })
  .eq("qr_code_id", code);

    setProduct(productData);
if (!countError) {
  setTotalScans(scanCount || 0);
}
    if (scanError) {
      setStatus("Product loaded, but recent scans could not be loaded.");
      setScans([]);
    } else {
      setScans(scanData || []);
      setStatus("");
    }

    setLoading(false);
  }

  async function downloadQR() {
    const url = `${window.location.origin}/q/${code}`;

    const image = await QRCode.toDataURL(url, {
      width: 1200,
      margin: 4,
      errorCorrectionLevel: "H",
    });

    const link = document.createElement("a");
    link.href = image;
    link.download = `${code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

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
        <p>Loading product...</p>
      </main>
    );
  }

  if (!product) {
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
        <div style={{ textAlign: "center" }}>
          <h1>Product not found</h1>
          <button onClick={() => router.push("/admin")}>
            BACK TO DASHBOARD
          </button>
        </div>
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
          maxWidth: "900px",
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
            background: "#11111a",
            border: "1px solid #29293a",
            borderRadius: "18px",
            padding: "28px",
            marginBottom: "24px",
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
            QORACLE PRODUCT
          </p>

          <h1
            style={{
              marginTop: 0,
              fontSize: "38px",
            }}
          >
            {product.product_name || product.code}
          </h1>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginTop: "24px",
            }}
          >
            <InfoCard title="Code" value={product.code} />
            <InfoCard
              title="Customer"
              value={product.customer_name || "—"}
            />
            <InfoCard title="Theme" value={product.theme.toUpperCase()} />
            <InfoCard
              title="Status"
              value={product.active ? "ACTIVE" : "INACTIVE"}
            />
            <InfoCard title="Total Scans" value={String(totalScans)} />
            <InfoCard
              title="Created"
              value={new Date(product.created_at).toLocaleDateString()}
            />
          </div>

          <div
            style={{
              marginTop: "24px",
              background: "#090910",
              border: "1px solid #29293a",
              borderRadius: "12px",
              padding: "18px",
            }}
          >
            <strong>Notes</strong>
            <p style={{ color: "#aaa", marginBottom: 0 }}>
              {product.notes || "No notes"}
            </p>
          </div>

          <button
            onClick={downloadQR}
            style={{
              marginTop: "20px",
              padding: "14px 22px",
              borderRadius: "10px",
              border: "none",
              background: "#7c3aed",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            DOWNLOAD QR
          </button>
        </div>

        <div
          style={{
            background: "#11111a",
            border: "1px solid #29293a",
            borderRadius: "18px",
            padding: "28px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Recent Scan Activity</h2>

          {scans.length === 0 ? (
            <p style={{ color: "#999" }}>No recent scans yet.</p>
          ) : (
            scans.map((scan, index) => (
              <div
                key={`${scan.scanned_at}-${index}`}
                style={{
                  padding: "12px 0",
                  borderTop:
                    index === 0 ? "none" : "1px solid #29293a",
                }}
              >
                {new Date(scan.scanned_at).toLocaleString()}
              </div>
            ))
          )}

          {status && (
            <p style={{ color: "#fca5a5", marginTop: "20px" }}>
              {status}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#090910",
        border: "1px solid #29293a",
        borderRadius: "12px",
        padding: "18px",
      }}
    >
      <p
        style={{
          color: "#999",
          margin: "0 0 8px",
        }}
      >
        {title}
      </p>

      <div
        style={{
          fontWeight: "bold",
          color: "#c4b5fd",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}