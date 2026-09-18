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
