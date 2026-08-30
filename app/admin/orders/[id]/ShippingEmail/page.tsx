"use client";

import { useState } from "react";

type Props = {
  orderId: number;
  customerEmail?: string | null;
  trackingNumber?: string | null;
};

export default function ShippingEmail({
  orderId,
  customerEmail,
  trackingNumber,
}: Props) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  async function sendEmail() {
    setSending(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/orders/shipping-email", {
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
        throw new Error(
          data.error || "Unable to send shipping email"
        );
      }

      setMessage("Shipping email sent!");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to send shipping email"
      );
    } finally {
      setSending(false);
    }
  }

  const disabled =
    sending || !customerEmail || !trackingNumber;

  return (
    <div
      style={{
        marginTop: "20px",
        padding: "20px",
        border: "1px solid #29293a",
        borderRadius: "12px",
        background: "#11111a",
      }}
    >
      <h3 style={{ marginTop: 0 }}>
        Customer Shipping Email
      </h3>

      <p
        style={{
          color: "#aaa",
          marginTop: "0",
        }}
      >
        Send the customer an email with their shipping
        carrier and tracking information.
      </p>

      {!customerEmail && (
        <p style={{ color: "#aaa" }}>
          Customer email is missing.
        </p>
      )}

      {!trackingNumber && (
        <p style={{ color: "#aaa" }}>
          Add a tracking number before sending.
        </p>
      )}

      <button
        type="button"
        onClick={sendEmail}
        disabled={disabled}
        style={{
          padding: "10px 16px",
          borderRadius: "8px",
          border: "none",
          background: disabled ? "#333" : "#222",
          color: "white",
          fontWeight: "bold",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {sending ? "Sending..." : "📧 Send Shipping Email"}
      </button>

      {message && (
        <span
          style={{
            marginLeft: "12px",
            color: "#aaa",
          }}
        >
          {message}
        </span>
      )}
    </div>
  );
}