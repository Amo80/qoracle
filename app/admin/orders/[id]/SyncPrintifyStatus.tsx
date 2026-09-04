"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SyncPrintifyStatus({
  orderId,
}: {
  orderId: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function syncStatus() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/printify/orders/status", {
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
            "Unable to sync Printify status."
        );
        return;
      }

      setMessage(`Printify status updated: ${data.status}`);

      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Unable to sync Printify status.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: "14px" }}>
      <button
        type="button"
        onClick={syncStatus}
        disabled={loading}
        style={{
          padding: "10px 16px",
          border: "1px solid #3f3f46",
          borderRadius: "8px",
          background: loading ? "#3f3f46" : "#27272a",
          color: "white",
          fontWeight: "bold",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "SYNCING..." : "SYNC PRINTIFY STATUS"}
      </button>

      {message && (
        <p
          style={{
            marginTop: "10px",
            color: "#c4b5fd",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}