import type { OracleId } from "../oracles/registry";
import type { CharacterPhase } from "./machine";

export type CharacterCapability =
  | "ambient-idle"
  | "listening"
  | "awakening"
  | "anticipation"
  | "apparent-speaking"
  | "reaction";

export type CharacterManifest = Readonly<{
  oracleId: OracleId;
  version: 1;
  primaryAsset: string;
  fallbackAsset: string;
  loading: "selected-only";
  capabilities: readonly CharacterCapability[];
  supportedPhases: readonly CharacterPhase[];
  assetLimitBytes: number;
}>;

const LIGHTWEIGHT_PHASES = [
  "idle",
  "listening",
  "awakening",
  "anticipating",
  "speaking",
  "reacting",
  "returning",
  "paused",
  "asset-error",
] as const satisfies readonly CharacterPhase[];

export const CHARACTER_MANIFESTS: Readonly<Record<OracleId, CharacterManifest>> = {
  jester: {
    oracleId: "jester",
    version: 1,
    primaryAsset: "/themes/jester-oracle.png",
    fallbackAsset: "/themes/jester-oracle.png",
    loading: "selected-only",
    capabilities: [
      "ambient-idle",
      "listening",
      "awakening",
      "anticipation",
      "apparent-speaking",
      "reaction",
    ],
    supportedPhases: LIGHTWEIGHT_PHASES,
    assetLimitBytes: 3 * 1024 * 1024,
  },
  chaos: {
    oracleId: "chaos",
    version: 1,
    primaryAsset: "/themes/chaos-crystal-ball.png",
    fallbackAsset: "/themes/chaos-crystal-ball.png",
    loading: "selected-only",
    capabilities: ["ambient-idle", "awakening", "reaction"],
    supportedPhases: LIGHTWEIGHT_PHASES,
    assetLimitBytes: 3 * 1024 * 1024,
  },
  love: {
    oracleId: "love",
    version: 1,
    primaryAsset: "/themes/love-crystal-ball.png",
    fallbackAsset: "/themes/love-crystal-ball.png",
    loading: "selected-only",
    capabilities: ["ambient-idle", "awakening", "reaction"],
    supportedPhases: LIGHTWEIGHT_PHASES,
    assetLimitBytes: 3 * 1024 * 1024,
  },
  eclipse: {
    oracleId: "eclipse",
    version: 1,
    primaryAsset: "/themes/eclipse-crystal.png",
    fallbackAsset: "/themes/eclipse-crystal.png",
    loading: "selected-only",
    capabilities: ["ambient-idle", "awakening", "reaction"],
    supportedPhases: LIGHTWEIGHT_PHASES,
    assetLimitBytes: 3 * 1024 * 1024,
  },
  dnd: {
    oracleId: "dnd",
    version: 1,
    primaryAsset: "/themes/DND.crystal.png",
    fallbackAsset: "/themes/DND.crystal.png",
    loading: "selected-only",
    capabilities: ["ambient-idle", "awakening", "reaction"],
    supportedPhases: LIGHTWEIGHT_PHASES,
    assetLimitBytes: 3.5 * 1024 * 1024,
  },
};

export function getCharacterManifest(oracleId: OracleId) {
  return CHARACTER_MANIFESTS[oracleId];
}

export function getSelectedCharacterAssets(oracleId: OracleId) {
  const manifest = getCharacterManifest(oracleId);
  return Array.from(new Set([manifest.primaryAsset, manifest.fallbackAsset]));
}
