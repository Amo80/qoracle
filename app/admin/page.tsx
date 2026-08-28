"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { createClient } from "@supabase/supabase-js";

const themes = ["classic", "chaos", "love", "dark", "dnd"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default function AdminPage() {
  const [theme, setTheme] = useState("classic");
  const [code, setCode] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [status, setStatus] = useState("");

  async function generateQR() {
    setStatus("Creating...");

    const randomCode =
      "QOR-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error } = await supabase.from("qr_codes").insert({
      code: randomCode,
      theme,
      active: true,
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    const url = `${window.location.origin}/q/${randomCode}`;

    const image = await QRCode.toDataURL(url, {
      width: 320,
      margin: 2,
    });

    setCode(randomCode);
    setQrImage(image);
    setStatus("Saved to Supabase.");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#07070d",
        color: "white",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "650px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "#a78bfa",
            letterSpacing: "4px",
            fontWeight: "bold",
          }}
        >
          QoRacle ADMIN
        </p>

        <h1
          style={{
            fontSize: "42px",
            marginBottom: "10px",
          }}
        >
          QR Generator
        </h1>

        <p style={{ color: "#aaa", marginBottom: "35px" }}>
          Create a unique QoRacle code and QR image.
        </p>

        <div
          style={{
            background: "#11111a",
            border: "1px solid #29293a",
            borderRadius: "18px",
            padding: "30px",
          }}
        >
          <label
            style={{
              display: "block",
              textAlign: "left",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            Choose Theme
          </label>

          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "10px",
              marginBottom: "20px",
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
            onClick={generateQR}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "12px",
              border: "none",
              background: "#7c3aed",
              color: "white",
              fontWeight: "bold",
              fontSize: "17px",
              cursor: "pointer",
            }}
          >
            GENERATE QORACLE
          </button>

          {status && (
            <p style={{ marginTop: "20px", color: "#aaa" }}>{status}</p>
          )}

          {code && (
            <div style={{ marginTop: "30px" }}>
              <p style={{ color: "#aaa" }}>Generated Code</p>

              <h2
                style={{
                  color: "#c4b5fd",
                  letterSpacing: "2px",
                }}
              >
                {code}
              </h2>

              <p style={{ color: "#888" }}>
                Theme: {theme.toUpperCase()}
              </p>

              {qrImage && (
                <img
                  src={qrImage}
                  alt="QoRacle QR Code"
                  style={{
                    marginTop: "20px",
                    width: "280px",
                    maxWidth: "100%",
                    background: "white",
                    padding: "10px",
                    borderRadius: "14px",
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}