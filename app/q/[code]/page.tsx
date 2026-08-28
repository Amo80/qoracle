import { notFound } from "next/navigation";
import OracleQR from "@/components/OracleQR";
import { createClient } from "@/lib/supabase/server";

export default async function QRPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("qr_codes").select("code, theme, active").eq("code", code).single();

  if (!data || !data.active) notFound();

  await supabase.from("scans").insert({ qr_code_id: data.code });

  return <OracleQR theme={data.theme} code={data.code} />;
}