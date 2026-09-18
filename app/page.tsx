import { OracleChamber } from "@/components/chamber/OracleChamber";
import LegacyHome from "@/components/home/LegacyHome";
import { shouldRenderOracleChamber } from "@/lib/experience/featureFlags";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ classic?: string }>;
}) {
  const params = await searchParams;
  const showChamber = shouldRenderOracleChamber({
    classicRequested: params.classic === "1",
  });

  return showChamber ? <OracleChamber /> : <LegacyHome />;
}
