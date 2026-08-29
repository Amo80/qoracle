"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  orderId: number;
  currentStatus: string;
};

export default function OrderStatus({
  orderId,
  currentStatus,
}: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function updateStatus(newStatus: string) {
    setStatus(newStatus);
    setSaving(true);

    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: orderId,
          order_status: newStatus,
        }),
      });

      if (!response.ok) {
        setStatus(currentStatus);
        alert("Unable to update order status.");
      }

if (response.ok) {
  router.refresh();
}
    } catch {
      setStatus(currentStatus);
      alert("Unable to update order status.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={status}
      disabled={saving}
      onChange={(e) => updateStatus(e.target.value)}
      style={{
        padding: "8px 10px",
        borderRadius: "8px",
        background: "#181822",
        color: "white",
        border: "1px solid #3b3b50",
        cursor: saving ? "wait" : "pointer",
      }}
    >
      <option value="New">New</option>
      <option value="Processing">Processing</option>
      <option value="Shipped">Shipped</option>
      <option value="Completed">Completed</option>
    </select>
  );
}