import OracleQR from "@/components/OracleQR";
import { normalizeOracleId } from "@/lib/oracles/registry";
import {
  isOracleIntelligenceLiveIntegrationEnabled,
} from "@/lib/experience/featureFlags";

export default async function OraclePage({
  searchParams,
}: {
  searchParams: Promise<{
    theme?: string;
    code?: string;
  }>;
}) {
  const params = await searchParams;

  const theme = normalizeOracleId(params.theme);
  const code = params.code || "web";

  return <OracleQR
    theme={theme}
    code={code}
    jesterIntelligenceEnabled={isOracleIntelligenceLiveIntegrationEnabled("jester")}
    loveIntelligenceEnabled={isOracleIntelligenceLiveIntegrationEnabled("love")}
    dungeonIntelligenceEnabled={isOracleIntelligenceLiveIntegrationEnabled("dnd")}
    chaosIntelligenceEnabled={isOracleIntelligenceLiveIntegrationEnabled("chaos")}
    eclipseIntelligenceEnabled={isOracleIntelligenceLiveIntegrationEnabled("eclipse")}
  />;
}
