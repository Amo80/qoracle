"use client";

import { useState } from "react";

type Props = {
  orderId: number;
  currentCarrier?: string | null;
  currentTrackingNumber?: string | null;
};

export default function TrackingForm({
  orderId,
  currentCarrier,
  currentTrackingNumber,
}: Props) {
  const [carrier, setCarrier] = useState(currentCarrier || "");
  const [trackingNumber, setTrackingNumber] = useState(
    currentTrackingNumber || ""
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveTracking() {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          shipping_carrier: carrier,
          tracking_number: trackingNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save tracking");
      }

      setMessage("Saved");
    } catch (error) {
      console.error(error);
      setMessage("Unable to save");
    } finally {
      setSaving(false);
    }
  }

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
      <h3 style={{ marginTop: 0 }}>Shipping Tracking</h3>

      <div style={{ marginBottom: "12px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "6px",
            color: "#aaa",
          }}
        >
          Carrier
        </label>

        <select
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #3b3b50",
            background: "#181822",
            color: "white",
          }}
        >
          <option value="">Select carrier</option>
          <option value="USPS">USPS</option>
          <option value="UPS">UPS</option>
          <option value="FedEx">FedEx</option>
          <option value="DHL">DHL</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "6px",
            color: "#aaa",
          }}
        >
          Tracking Number
        </label>

        <input
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="Enter tracking number"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #3b3b50",
            background: "#181822",
            color: "white",
          }}
        />
      </div>

      <button
        type="button"
        onClick={saveTracking}
        disabled={saving}
        style={{
          padding: "10px 16px",
          borderRadius: "8px",
          border: "none",
          background: "#222",
          color: "white",
          fontWeight: "bold",
          cursor: saving ? "wait" : "pointer",
        }}
      >
        {saving ? "Saving..." : "Save Tracking"}
      </button>

      {message && (
        <span style={{ marginLeft: "12px", color: "#aaa" }}>
          {message}
        </span>
      )}
    </div>
  );
}