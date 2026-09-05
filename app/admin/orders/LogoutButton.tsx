"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      style={{
        padding: "10px 16px",
        borderRadius: "10px",
        border: "1px solid #7c3aed",
        background: "#7c3aed",
        color: "white",
        fontWeight: "bold",
        cursor: isLoggingOut ? "default" : "pointer",
        opacity: isLoggingOut ? 0.7 : 1,
      }}
    >
      {isLoggingOut ? "LOGGING OUT..." : "LOG OUT"}
    </button>
  );
}