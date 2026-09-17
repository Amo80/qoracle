export const ORACLE_IDS = [
  "jester",
  "chaos",
  "love",
  "eclipse",
  "dnd",
] as const;

export type OracleId = (typeof ORACLE_IDS)[number];

export type OracleDefinition = Readonly<{
  id: OracleId;
  name: "JESTER" | "CHAOS" | "LOVE" | "ECLIPSE" | "DRAGON";
  description: string;
  image: string;
  oraclePath: `/oracle?theme=${OracleId}`;
  themeClass: `theme-${OracleId}`;
}>;

const definitions: Record<OracleId, OracleDefinition> = {
  jester: {
    id: "jester",
    name: "JESTER",
    description: "Mischief & Mayhem",
    image: "/themes/jester-oracle.png",
    oraclePath: "/oracle?theme=jester",
    themeClass: "theme-jester",
  },
  chaos: {
    id: "chaos",
    name: "CHAOS",
    description: "Unpredictable Fate",
    image: "/themes/chaos-crystal-ball.png",
    oraclePath: "/oracle?theme=chaos",
    themeClass: "theme-chaos",
  },
  love: {
    id: "love",
    name: "LOVE",
    description: "Romance & Desire",
    image: "/themes/love-crystal-ball.png",
    oraclePath: "/oracle?theme=love",
    themeClass: "theme-love",
  },
  eclipse: {
    id: "eclipse",
    name: "ECLIPSE",
    description: "Mystery & Secrets",
    image: "/themes/eclipse-crystal.png",
    oraclePath: "/oracle?theme=eclipse",
    themeClass: "theme-eclipse",
  },
  dnd: {
    id: "dnd",
    name: "DRAGON",
    description: "Adventure Awaits",
    image: "/themes/DND.crystal.png",
    oraclePath: "/oracle?theme=dnd",
    themeClass: "theme-dnd",
  },
};

export const ORACLES = ORACLE_IDS.map((id) => definitions[id]);

const aliases: Readonly<Record<string, OracleId>> = {
  classic: "jester",
  dragon: "dnd",
};

export function isOracleId(value: string): value is OracleId {
  return ORACLE_IDS.includes(value as OracleId);
}

export function normalizeOracleId(value?: string | null): OracleId {
  const normalized = value?.trim().toLowerCase() || "jester";

  if (isOracleId(normalized)) return normalized;

  return aliases[normalized] || "jester";
}

export function getOracle(value?: string | null): OracleDefinition {
  return definitions[normalizeOracleId(value)];
}

export function inferOracleId(value?: string | null): OracleId {
  const normalized = value?.toLowerCase() || "";

  return ORACLE_IDS.find((id) => normalized.includes(id)) ||
    (normalized.includes("dragon") ? "dnd" : "jester");
}
