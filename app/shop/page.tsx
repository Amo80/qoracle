"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
const products = [
  {
    name: "QoRacle Sticker",
    price: "$4.99",
    description: "A scannable QoRacle sticker you can place almost anywhere.",
  },
  {
    name: "QoRacle Card",
    price: "$7.99",
    description: "A pocket-sized QoRacle card with its own unique QR code.",
  },
  {
    name: "QoRacle Keychain",
    price: "$12.99",
    description: "Carry your QoRacle with you wherever you go.",
  },
];

const themes = ["classic", "chaos", "love", "eclipse", "dnd"];

export default function ShopPage() {
  const [selectedTheme, setSelectedTheme] = useState("classic");
const router = useRouter();
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#07070d",
        color: "white",
        padding: "40px 20px 60px",
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
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          <p
            style={{
              color: "#a78bfa",
              letterSpacing: "5px",
              fontWeight: "bold",
            }}
          >
            QORACLE
          </p>

          <h1
            style={{
              fontSize: "48px",
              marginBottom: "12px",
            }}
          >
            Choose Your Oracle
          </h1>

          <p
            style={{
              color: "#aaa",
              fontSize: "18px",
              maxWidth: "650px",
              margin: "0 auto",
              lineHeight: "1.6",
            }}
          >
            Pick a product, choose your oracle theme, and make every scan a
            little more mysterious.
          </p>
        </div>

        <div
          style={{
            background: "#11111a",
            border: "1px solid #29293a",
            borderRadius: "18px",
            padding: "24px",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Choose Your Theme</h2>

          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "10px",
              background: "#090910",
              color: "white",
              border: "1px solid #3b3b50",
              fontSize: "16px",
            }}
          >
            {themes.map((theme) => (
              <option key={theme} value={theme}>
                {theme.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
          }}
        >
          {products.map((product) => (
            <div
              key={product.name}
              style={{
                background: "#11111a",
                border: "1px solid #29293a",
                borderRadius: "18px",
                padding: "26px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>{product.name}</h2>

              <p
                style={{
                  color: "#aaa",
                  lineHeight: "1.6",
                  minHeight: "70px",
                }}
              >
                {product.description}
              </p>

              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#c4b5fd",
                  marginBottom: "18px",
                }}
              >
                {product.price}
              </div>

              <p
                style={{
                  color: "#888",
                  fontSize: "14px",
                }}
              >
                Theme: {selectedTheme.toUpperCase()}
              </p>

              <button
onClick={() =>
  router.push(
    `/checkout?product=${encodeURIComponent(product.name)}&theme=${encodeURIComponent(selectedTheme)}&price=${encodeURIComponent(product.price)}`
  )
}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#7c3aed",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "15px",
                }}
              >
                CHOOSE THIS PRODUCT
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}