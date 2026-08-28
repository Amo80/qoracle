"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const product = searchParams.get("product") || "QoRacle Product";
  const theme = searchParams.get("theme") || "classic";
  const price = searchParams.get("price") || "$0.00";

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
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        <button
          onClick={() => router.push("/shop")}
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
          ← BACK TO SHOP
        </button>

        <div
          style={{
            background: "#11111a",
            border: "1px solid #29293a",
            borderRadius: "18px",
            padding: "30px",
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
            QORACLE CHECKOUT
          </p>

          <h1 style={{ marginTop: 0 }}>Review Your Order</h1>

          <div
            style={{
              marginTop: "28px",
              background: "#090910",
              border: "1px solid #29293a",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p>
              <strong>Product:</strong> {product}
            </p>

            <p>
              <strong>Theme:</strong> {theme.toUpperCase()}
            </p>

            <p>
              <strong>Price:</strong> {price}
            </p>
          </div>

          <button
            disabled
            style={{
              width: "100%",
              marginTop: "24px",
              padding: "15px",
              borderRadius: "10px",
              border: "none",
              background: "#3b3b50",
              color: "#aaa",
              fontWeight: "bold",
              cursor: "not-allowed",
              fontSize: "16px",
            }}
          >
            PAYMENT COMING NEXT
          </button>
        </div>
      </div>
    </main>
  );
}
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
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
          <p>Loading checkout...</p>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}