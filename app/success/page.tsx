"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get("session_id");
const [verifying, setVerifying] = useState(true);
const [verified, setVerified] = useState(false);
const [error, setError] = useState("");
useEffect(() => {
  if (!sessionId) {
    setError("Missing payment session.");
    setVerifying(false);
    return;
  }

  async function verifyOrder() {
    try {
      const response = await fetch("/api/verify-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to verify order.");
        return;
      }

      setVerified(true);
    } catch {
      setError("Unable to verify order.");
    } finally {
      setVerifying(false);
    }
  }

  verifyOrder();
}, [sessionId]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#07070d",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "650px",
          background: "#11111a",
          border: "1px solid #29293a",
          borderRadius: "20px",
          padding: "36px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "#a78bfa",
            letterSpacing: "4px",
            fontWeight: "bold",
            marginBottom: "10px",
          }}
        >
          QORACLE
        </p>

        <h1 style={{ marginTop: 0 }}>
  {verifying
    ? "Verifying Payment..."
    : verified
    ? "Payment Successful"
    : "Order Verification Problem"}
</h1>

        <p
  style={{
    color: error ? "#fca5a5" : "#aaa",
    fontSize: "18px",
    lineHeight: "1.6",
  }}
>
  {verifying
    ? "Please wait while we verify your payment and create your QoRacle order."
    : verified
    ? "Your payment was verified and your QoRacle order was created successfully."
    : error}
</p>

        {sessionId && (
          <p
            style={{
              marginTop: "24px",
              color: "#777",
              fontSize: "13px",
              wordBreak: "break-all",
            }}
          >
            Session: {sessionId}
          </p>
        )}

        <button
          onClick={() => router.push("/shop")}
          style={{
            marginTop: "26px",
            padding: "14px 22px",
            borderRadius: "10px",
            border: "none",
            background: "#7c3aed",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          BACK TO SHOP
        </button>
      </div>
    </main>
  );
}

export default function SuccessPage() {
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
          <p>Loading...</p>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}