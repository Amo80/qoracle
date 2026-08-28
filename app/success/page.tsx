"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get("session_id");

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

        <h1 style={{ marginTop: 0 }}>Payment Successful</h1>

        <p
          style={{
            color: "#aaa",
            fontSize: "18px",
            lineHeight: "1.6",
          }}
        >
          Your test payment was completed successfully.
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