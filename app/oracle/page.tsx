import OracleQR from "@/components/OracleQR";

export default async function OraclePage({
  searchParams,
}: {
  searchParams: Promise<{
    theme?: string;
    code?: string;
  }>;
}) {
  const params = await searchParams;

  const theme = params.theme || "classic";
  const code = params.code || "web";

  return <OracleQR theme={theme} code={code} />;
}