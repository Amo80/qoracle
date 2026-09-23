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
