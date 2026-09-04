"use client";

import { useState } from "react";

export default function SendToPrintify({
  orderId,
}: {
  orderId: number;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSend() {
    const confirmed = window.confirm(
      "Create this paid order in Printify for manual review?"
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/printify/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data?.details?.message ||
            data?.error ||
            "Unable to create Printify order."
        );
        return;
      }

      setMessage(
        "Created in Printify. Review it there before submitting to production."
      );
    } catch (error) {
      console.error(error);
      setMessage("Unable to create Printify order.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        marginTop: "24px",
        padding: "20px",
        border: "1px solid #3b2a52",
        borderRadius: "12px",
        background: "#17101f",
      }}
    >
      <h3 style={{ marginTop: 0 }}>
        Printify Fulfillment
      </h3>

      <p style={{ color: "#bbb" }}>
        Creates this paid merch order in Printify for manual review.
        It will not be submitted to production automatically.
      </p>

      <button
        type="button"
        onClick={handleSend}
        disabled={loading}
        style={{
          padding: "12px 18px",
          border: "none",
          borderRadius: "8px",
          background: loading ? "#555" : "#7c3aed",
          color: "white",
          fontWeight: "bold",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "SENDING..." : "SEND TO PRINTIFY"}
      </button>

      {message && (
        <p
          style={{
            marginTop: "14px",
            color: "#ddd",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}