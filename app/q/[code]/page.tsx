import { notFound } from "next/navigation";
import OracleQR from "@/components/OracleQR";
import { createClient } from "@/lib/supabase/server";

export default async function QRPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("qr_codes").select("code, theme, active").eq("code", code).single();

  if (!data) notFound();

if (!data.active) {
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
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          background: "#11111a",
          border: "1px solid #29293a",
          borderRadius: "20px",
          padding: "40px 30px",
        }}
      >
        <p
          style={{
            color: "#a78bfa",
            letterSpacing: "4px",
            fontWeight: "bold",
          }}
        >
          QORACLE
        </p>

        <h1>This QoRacle is currently inactive</h1>

        <p
          style={{
            color: "#aaa",
            lineHeight: "1.6",
          }}
        >
          This oracle is not available right now.
          Please check back later.
        </p>
      </div>
    </main>
  );
}

  await supabase.from("scans").insert({ qr_code_id: data.code });

  return <OracleQR theme={data.theme} code={data.code} />;
}