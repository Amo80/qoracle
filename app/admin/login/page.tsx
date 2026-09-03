"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";


export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setStatus("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

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
          maxWidth: "420px",
          background: "#11111a",
          border: "1px solid #29293a",
          borderRadius: "20px",
          padding: "32px",
        }}
      >
        <p
          style={{
            color: "#a78bfa",
            letterSpacing: "4px",
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: "8px",
          }}
        >
         THE QRYSTAL BALLS
        </p>

        <h1
          style={{
            textAlign: "center",
            marginTop: 0,
            marginBottom: "8px",
          }}
        >
          Admin Login
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#999",
            marginBottom: "28px",
          }}
        >
         Sign in to access The QRystal Balls dashboard.
        </p>

        <form onSubmit={handleLogin}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{
              width: "100%",
              padding: "14px",
              marginBottom: "18px",
              borderRadius: "10px",
              border: "1px solid #3b3b50",
              background: "#090910",
              color: "white",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
          />

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              width: "100%",
              padding: "14px",
              marginBottom: "18px",
              borderRadius: "10px",
              border: "1px solid #3b3b50",
              background: "#090910",
              color: "white",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: "10px",
              border: "none",
              background: "#7c3aed",
              color: "white",
              fontWeight: "bold",
              fontSize: "16px",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>

          {status && (
            <p
              style={{
                marginTop: "18px",
                textAlign: "center",
                color: "#fca5a5",
              }}
            >
              {status}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}