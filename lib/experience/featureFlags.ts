type ChamberEnvironment = Readonly<Record<string, string | undefined>>;

const enabled = (value: string | undefined) =>
  value?.trim().toLowerCase() === "true";

export function isOracleChamberEnabled(
  environment: ChamberEnvironment = process.env
) {
  return environment.ORACLE_CHAMBER_V2_ENABLED?.trim().toLowerCase() === "true";
}

export function shouldRenderOracleChamber({
  environment = process.env,
  classicRequested = false,
}: {
  environment?: ChamberEnvironment;
  classicRequested?: boolean;
} = {}) {
  return !classicRequested && isOracleChamberEnabled(environment);
}

export function isLivingOracleEnabled(
  environment: ChamberEnvironment = process.env
) {
  return environment.LIVING_ORACLE_V3_ENABLED?.trim().toLowerCase() === "true";
}

export function isJester3DEnabled(
  environment: ChamberEnvironment = process.env
) {
  return environment.JESTER_3D_V4A_ENABLED?.trim().toLowerCase() === "true";
}

export function isLove3DEnabled(
  environment: ChamberEnvironment = process.env
) {
  return environment.LOVE_3D_V4B_ENABLED?.trim().toLowerCase() === "true";
}

export function isDragon3DEnabled(
  environment: ChamberEnvironment = process.env
) {
  return environment.DRAGON_3D_V4C_ENABLED?.trim().toLowerCase() === "true";
}

export function isChaos3DEnabled(
  environment: ChamberEnvironment = process.env
) {
  return environment.CHAOS_3D_V4D_ENABLED?.trim().toLowerCase() === "true";
}

export function isEclipse3DEnabled(
  environment: ChamberEnvironment = process.env
) {
  return environment.ECLIPSE_3D_V4E_ENABLED?.trim().toLowerCase() === "true";
}

export function isOracleIntelligenceEnabled(
  environment: ChamberEnvironment = process.env
) {
  return enabled(environment.ORACLE_INTELLIGENCE_ENABLED);
}

const INTELLIGENCE_ORACLE_FLAGS = {
  jester: "ORACLE_INTELLIGENCE_JESTER_ENABLED",
  love: "ORACLE_INTELLIGENCE_LOVE_ENABLED",
  dnd: "ORACLE_INTELLIGENCE_DUNGEON_ENABLED",
  chaos: "ORACLE_INTELLIGENCE_CHAOS_ENABLED",
  eclipse: "ORACLE_INTELLIGENCE_ECLIPSE_ENABLED",
} as const;

export function getOracleIntelligenceRolloutPercent(
  environment: ChamberEnvironment = process.env
) {
  const raw = environment.ORACLE_INTELLIGENCE_ROLLOUT_PERCENT?.trim();
  if (!raw || !/^\d{1,3}$/.test(raw)) return 0;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 && value <= 100 ? value : 0;
}

export function isOracleIntelligenceEnabledFor(
  oracleId: keyof typeof INTELLIGENCE_ORACLE_FLAGS,
  environment: ChamberEnvironment = process.env
) {
  return (
    isOracleIntelligenceEnabled(environment) &&
    enabled(environment[INTELLIGENCE_ORACLE_FLAGS[oracleId]]) &&
    getOracleIntelligenceRolloutPercent(environment) > 0
  );
}

export function hasProductionIntelligenceRateLimitConfiguration(
  environment: ChamberEnvironment = process.env
) {
  return Boolean(
    environment.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    environment.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
    environment.ORACLE_INTELLIGENCE_RATE_LIMIT_SECRET?.trim() &&
    environment.ORACLE_INTELLIGENCE_RATE_LIMIT_SECRET.trim().length >= 32
  );
}

/** Server-only gate for the production-capable visitor route. */
export function isOracleIntelligenceLiveIntegrationEnabled(
  oracleId: keyof typeof INTELLIGENCE_ORACLE_FLAGS,
  environment: ChamberEnvironment = process.env
) {
  const runtimeAllowed =
    environment.VERCEL_ENV === "production" ||
    environment.VERCEL_ENV === "preview" ||
    environment.NODE_ENV === "development";
  const productionLimiterReady =
    environment.VERCEL_ENV !== "production" ||
    hasProductionIntelligenceRateLimitConfiguration(environment);
  return runtimeAllowed && productionLimiterReady &&
    isOracleIntelligenceEnabledFor(oracleId, environment) &&
    Boolean(environment.OPENAI_API_KEY?.trim());
}

/** Server-only gate for the visitor-facing Jester Preview qualification. */
export function isJesterIntelligencePreviewIntegrationEnabled(
  environment: ChamberEnvironment = process.env
) {
  const previewRuntime =
    environment.VERCEL_ENV === "preview" ||
    environment.NODE_ENV === "development";
  return (
    previewRuntime &&
    isOracleIntelligenceEnabledFor("jester", environment) &&
    Boolean(environment.OPENAI_API_KEY?.trim())
  );
}

/** Server-only gate for the visitor-facing Love Preview qualification. */
export function isLoveIntelligencePreviewIntegrationEnabled(
  environment: ChamberEnvironment = process.env
) {
  const previewRuntime =
    environment.VERCEL_ENV === "preview" ||
    environment.NODE_ENV === "development";
  return (
    previewRuntime &&
    isOracleIntelligenceEnabledFor("love", environment) &&
    Boolean(environment.OPENAI_API_KEY?.trim())
  );
}

/** Server-only gate for the visitor-facing Dungeon Preview qualification. */
export function isDungeonIntelligencePreviewIntegrationEnabled(
  environment: ChamberEnvironment = process.env
) {
  const previewRuntime =
    environment.VERCEL_ENV === "preview" ||
    environment.NODE_ENV === "development";
  return (
    previewRuntime &&
    isOracleIntelligenceEnabledFor("dnd", environment) &&
    Boolean(environment.OPENAI_API_KEY?.trim())
  );
}

/** Server-only gate for the visitor-facing Chaos Preview qualification. */
export function isChaosIntelligencePreviewIntegrationEnabled(
  environment: ChamberEnvironment = process.env
) {
  const previewRuntime =
    environment.VERCEL_ENV === "preview" ||
    environment.NODE_ENV === "development";
  return (
    previewRuntime &&
    isOracleIntelligenceEnabledFor("chaos", environment) &&
    Boolean(environment.OPENAI_API_KEY?.trim())
  );
}

/** Server-only gate for the visitor-facing Eclipse Preview qualification. */
export function isEclipseIntelligencePreviewIntegrationEnabled(
  environment: ChamberEnvironment = process.env
) {
  const previewRuntime = environment.VERCEL_ENV === "preview" || environment.NODE_ENV === "development";
  return previewRuntime && isOracleIntelligenceEnabledFor("eclipse", environment) && Boolean(environment.OPENAI_API_KEY?.trim());
}
