type ChamberEnvironment = Readonly<Record<string, string | undefined>>;

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
