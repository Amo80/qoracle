import type { OracleId } from "@/lib/oracles/registry";

export const ORACLE_EMOTIONS = [
  "playful",
  "warm",
  "solemn",
  "mysterious",
  "ominous",
  "triumphant",
  "uncertain",
  "neutral",
] as const;

export const ORACLE_DELIVERIES = [
  "teasing",
  "tender",
  "measured",
  "dramatic",
  "direct",
] as const;

export const ORACLE_REACTIONS = [
  "flourish",
  "reassure",
  "consider",
  "warn",
  "celebrate",
  "settle",
] as const;

export type OracleEmotion = (typeof ORACLE_EMOTIONS)[number];
export type OracleDelivery = (typeof ORACLE_DELIVERIES)[number];
export type OracleReaction = (typeof ORACLE_REACTIONS)[number];

export type OraclePresentation = Readonly<{
  emotion: OracleEmotion;
  delivery: OracleDelivery;
  intensity: 1 | 2 | 3;
  reaction: OracleReaction;
  pace: "slow" | "measured" | "quick";
}>;

export type OracleResponse = Readonly<{
  text: string;
  source: "protected-library" | "oracle-ai";
  oracleId: OracleId;
  presentation: OraclePresentation;
  safety: Readonly<{
    status: "approved" | "fallback";
    reason?: string;
  }>;
}>;

export const NEUTRAL_PRESENTATION: OraclePresentation = {
  emotion: "neutral",
  delivery: "measured",
  intensity: 1,
  reaction: "settle",
  pace: "measured",
};

export function isOraclePresentation(value: unknown): value is OraclePresentation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;

  return (
    ORACLE_EMOTIONS.includes(candidate.emotion as OracleEmotion) &&
    ORACLE_DELIVERIES.includes(candidate.delivery as OracleDelivery) &&
    ORACLE_REACTIONS.includes(candidate.reaction as OracleReaction) &&
    (candidate.intensity === 1 ||
      candidate.intensity === 2 ||
      candidate.intensity === 3) &&
    (candidate.pace === "slow" ||
      candidate.pace === "measured" ||
      candidate.pace === "quick")
  );
}

export function createProtectedOracleResponse({
  oracleId,
  text,
  presentation = NEUTRAL_PRESENTATION,
}: {
  oracleId: OracleId;
  text: string;
  presentation?: OraclePresentation;
}): OracleResponse {
  return {
    text,
    source: "protected-library",
    oracleId,
    presentation,
    safety: { status: "approved" },
  };
}
