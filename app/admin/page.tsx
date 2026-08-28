"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";


const themes = ["classic", "chaos", "love", "dark", "dnd"];

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
  qr_code_id: string;
};

type DashboardQR = QRCodeRow & {
  scans: number;
};

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [theme, setTheme] = useState("classic");
  const [productName, setProductName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [codes, setCodes] = useState<DashboardQR[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/admin/login");
      return;
    }

    setCheckingAuth(false);
    await loadDashboard();
  }

  async function loadDashboard() {
    setLoading(true);

    const { data: qrData, error: qrError } = await supabase
      .from("qr_codes")
      .select("code, theme, active, created_at, product_name, customer_name, notes")
      .order("created_at", { ascending: false });

    if (qrError) {
      setStatus(qrError.message);
      setLoading(false);
      return;
    }

    const { data: scanData, error: scanError } = await supabase
      .from("scans")
      .select("qr_code_id");

    const scans = (scanData || []) as ScanRow[];

    const dashboardCodes = ((qrData || []) as QRCodeRow[]).map((qr) => ({
      ...qr,
      scans: scans.filter((scan) => scan.qr_code_id === qr.code).length,
    }));

    setCodes(dashboardCodes);

    if (scanError) {
      setStatus("QR codes loaded. Scan totals could not be loaded yet.");
    } else {
      setStatus("");
    }

    setLoading(false);
  }
function startEditing(item: DashboardQR) {
  setEditingCode(item.code);
  setProductName(item.product_name || "");
  setCustomerName(item.customer_name || "");
  setNotes(item.notes || "");
  setTheme(item.theme);
  window.scrollTo({ top: 0, behavior: "smooth" });
}
async function saveEdit() {
  if (!editingCode) return;

  setStatus(`Saving ${editingCode}...`);

  const { error } = await supabase
    .from("qr_codes")
    .update({
      product_name: productName.trim() || null,
      customer_name: customerName.trim() || null,
      notes: notes.trim() || null,
      theme,
    })
    .eq("code", editingCode);

  if (error) {
    setStatus(error.message);
    return;
  }

  setStatus(`Updated ${editingCode}`);
  setEditingCode(null);
  setProductName("");
  setCustomerName("");
  setNotes("");
  setTheme("classic");

  await loadDashboard();
}
async function toggleActive(item: DashboardQR) {
  const newStatus = !item.active;

  setStatus(
    `${newStatus ? "Activating" : "Deactivating"} ${item.code}...`
  );

  const { error } = await supabase
    .from("qr_codes")
    .update({
      active: newStatus,
    })
    .eq("code", item.code);

  if (error) {
    setStatus(error.message);
    return;
  }

  setStatus(
    `${item.code} is now ${newStatus ? "ACTIVE" : "INACTIVE"}`
  );

  await loadDashboard();
}

async function generateQR() {
  setStatus("Creating QoRacle...");

  const randomCode =
    "QOR-" + Math.random().toString(36).substring(2, 8).toUpperCase();

  const { error } = await supabase.from("qr_codes").insert({
    code: randomCode,
    theme,
    active: true,
    product_name: productName.trim() || null,
    customer_name: customerName.trim() || null,
    notes: notes.trim() || null,
  });

  if (error) {
    setStatus(error.message);
    return;
  }

  setStatus(`Created ${randomCode}`);

  setProductName("");
  setCustomerName("");
  setNotes("");

  await loadDashboard();
}
async function generateQR() {
  setStatus("Creating QoRacle...");

  const randomCode =
    "QOR-" + Math.random().toString(36).substring(2, 8).toUpperCase();

  const { error } = await supabase.from("qr_codes").insert({
    code: randomCode,
    theme,
    active: true,
    product_name: productName.trim() || null,
    customer_name: customerName.trim() || null,
    notes: notes.trim() || null,
  });

  if (error) {
    setStatus(error.message);
    return;
  }

  setStatus(`Created ${randomCode}`);

  setProductName("");
  setCustomerName("");
  setNotes("");

  await loadDashboard();
}
 
  async function downloadQR(code: string) {
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

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  const totalScans = codes.reduce((total, item) => total + item.scans, 0);

  if (checkingAuth) {
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
        <p>Checking admin access...</p>
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div>
            <p
              style={{
                color: "#a78bfa",
                letterSpacing: "4px",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              QORACLE ADMIN
            </p>

            <h1
              style={{
                fontSize: "42px",
                margin: 0,
              }}
            >
              Dashboard
            </h1>

            <p style={{ color: "#999" }}>
              Create, track and manage your QoRacle QR codes.
            </p>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: "11px 18px",
              borderRadius: "10px",
              border: "1px solid #3b3b50",
              background: "#181822",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            LOG OUT
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "30px",
          }}
        >
          <StatCard title="Total QR Codes" value={codes.length} />
          <StatCard title="Total Scans" value={totalScans} />
          <StatCard
            title="Active Codes"
            value={codes.filter((item) => item.active).length}
          />
        </div>

        <div
          style={{
            background: "#11111a",
            border: "1px solid #29293a",
            borderRadius: "18px",
            padding: "25px",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Generate New QoRacle</h2>
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  }}
>
  <input
    type="text"
    placeholder="Product name"
    value={productName}
    onChange={(e) => setProductName(e.target.value)}
    style={{
      padding: "14px",
      borderRadius: "10px",
      background: "#090910",
      color: "white",
      border: "1px solid #3b3b50",
      fontSize: "16px",
    }}
  />

  <input
    type="text"
    placeholder="Customer name"
    value={customerName}
    onChange={(e) => setCustomerName(e.target.value)}
    style={{
      padding: "14px",
      borderRadius: "10px",
      background: "#090910",
      color: "white",
      border: "1px solid #3b3b50",
      fontSize: "16px",
    }}
  />

  <input
    type="text"
    placeholder="Notes"
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
    style={{
      padding: "14px",
      borderRadius: "10px",
      background: "#090910",
      color: "white",
      border: "1px solid #3b3b50",
      fontSize: "16px",
    }}
  />
</div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{
                flex: 1,
                minWidth: "180px",
                padding: "14px",
                borderRadius: "10px",
                background: "#090910",
                color: "white",
                border: "1px solid #3b3b50",
                fontSize: "16px",
              }}
            >
              {themes.map((item) => (
                <option key={item} value={item}>
                  {item.toUpperCase()}
                </option>
              ))}
            </select>

            <button
              onClick={editingCode ? saveEdit : generateQR}
              style={{
                padding: "14px 24px",
                borderRadius: "10px",
                border: "none",
                background: "#7c3aed",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {editingCode ? "SAVE CHANGES" : "GENERATE QORACLE"}
{editingCode && (
  <button
    onClick={() => {
      setEditingCode(null);
      setProductName("");
      setCustomerName("");
      setNotes("");
      setTheme("classic");
      setStatus("");
    }}
    style={{
      padding: "14px 24px",
      borderRadius: "10px",
      border: "1px solid #3b3b50",
      background: "#181822",
      color: "white",
      fontWeight: "bold",
      cursor: "pointer",
    }}
  >
    CANCEL EDIT
  </button>
)}
            </button>

            <button
              onClick={loadDashboard}
              style={{
                padding: "14px 24px",
                borderRadius: "10px",
                border: "1px solid #3b3b50",
                background: "#181822",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              REFRESH
            </button>
          </div>

          {status && (
            <p
              style={{
                color: "#c4b5fd",
                marginBottom: 0,
              }}
            >
              {status}
            </p>
          )}
        </div>

        <div
          style={{
            background: "#11111a",
            border: "1px solid #29293a",
            borderRadius: "18px",
            padding: "25px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Your QoRacle Codes</h2>

          {loading ? (
            <p style={{ color: "#999" }}>Loading dashboard...</p>
          ) : codes.length === 0 ? (
            <p style={{ color: "#999" }}>
              No QoRacle codes found yet.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "700px",
                }}
              >
                <thead>
                 <tr style={{ textAlign: "left", color: "#aaa" }}>
  <th style={tableHeader}>Code</th>
  <th style={tableHeader}>Product</th>
  <th style={tableHeader}>Customer</th>
  <th style={tableHeader}>Theme</th>
  <th style={tableHeader}>Scans</th>
  <th style={tableHeader}>Status</th>
  <th style={tableHeader}>Created</th>
  <th style={tableHeader}>QR</th>
</tr>
                </thead>

                <tbody>
                  {codes.map((item) => (
                    <tr
                      key={item.code}
                      style={{
                        borderTop: "1px solid #29293a",
                      }}
                    >
                     <td style={tableCell}>
  <strong style={{ color: "#c4b5fd" }}>
    {item.code}
  </strong>
</td>

<td style={tableCell}>
  {item.product_name || "—"}
</td>

<td style={tableCell}>
  {item.customer_name || "—"}
</td>

<td style={tableCell}>
  {item.theme.toUpperCase()}
</td>
                      <td style={tableCell}>
                        {item.scans}
                      </td>

                      <td style={tableCell}>
                        <button
  onClick={() => toggleActive(item)}
  style={{
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #3b3b50",
    background: item.active ? "#16351f" : "#351616",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  }}
>
  {item.active ? "ACTIVE" : "INACTIVE"}
</button>
                      </td>

                      <td style={tableCell}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>

                      <td style={tableCell}>
<button
  onClick={() => startEditing(item)}
  style={{
    padding: "9px 14px",
    borderRadius: "8px",
    border: "1px solid #3b3b50",
    background: "#181822",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    marginRight: "8px",
  }}
>
  EDIT
</button>
                        <button
                          onClick={() => downloadQR(item.code)}
                          style={{
                            padding: "9px 14px",
                            borderRadius: "8px",
                            border: "none",
                            background: "#7c3aed",
                            color: "white",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          DOWNLOAD QR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
        padding: "22px",
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
          fontSize: "32px",
          fontWeight: "bold",
          color: "#c4b5fd",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const tableHeader = {
  padding: "14px 12px",
};

const tableCell = {
  padding: "16px 12px",
};