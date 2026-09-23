import type { MotionPreference } from "@/lib/experience/preferences";
import type { OracleId } from "@/lib/oracles/registry";
import type { CharacterPhase } from "./machine";
import type { DungeonPresentation as DungeonIntelligencePresentation } from "@/lib/oracle-intelligence/types";

export const DRAGON_3D_MANIFEST = {
  version: 1,
  model: "/characters/dragon/v1/dragon.glb",
  d20: "/characters/dragon/v1/mystic-d20.glb",
  altar: "/characters/dragon/v1/arcane-altar.glb",
  fallback: "/themes/DND.crystal.png",
  clips: "procedural-only",
  facialControls: "not-supported",
  loadingOrder: ["model", "d20-and-altar"] as const,
} as const;

export const DRAGON_SCENE_PRESENTATION = {
  dragon: { height: 1.75, floorY: 0.03, centerX: 0, centerZ: -0.42 },
  altar: { height: 0.78, floorY: 0.03, centerX: 0, centerZ: 0.72 },
  d20: { width: 0.32, centerX: 0, centerY: 1.02, centerZ: 0.94 },
  camera: {
    fieldOfView: 34,
    desktopFillFraction: 0.76,
    narrowFillFraction: 0.68,
    mobileFillFraction: 0.83,
    mobileMaxWidth: 430,
    narrowAspectThreshold: 0.82,
    minimumClearance: 0.6,
    verticalTargetOffset: -0.08,
  },
} as const;

export const DUNGEON_MAGIC_LIGHTING = {
  d20: { color: 0xc8a5ff, idleScale: 0.22, distance: 2.2, decay: 2 },
  altar: { color: 0xa86cff, idleScale: 0.18, distance: 2.6, decay: 2 },
} as const;

export const DRAGON_PROCEDURAL_BONES = {
  body: ["Bone_003", "Bone_014", "Bone_028"],
  neckHead: ["Bone_040", "Bone_039", "Bone_038", "Bone_037", "Bone_036", "Bone_035"],
  tail: ["Bone_012", "Bone_011", "Bone_010", "Bone_009", "Bone_008", "Bone_007", "Bone_006", "Bone_005", "Bone_004"],
  wingStructural: ["Bone_031", "Bone_030", "Bone_029", "Bone_034", "Bone_033", "Bone_032"],
} as const;

export const DRAGON_PROCEDURAL_ALLOWLIST = Object.freeze(
  Object.values(DRAGON_PROCEDURAL_BONES).flat()
);

export type DragonProceduralBone = (typeof DRAGON_PROCEDURAL_ALLOWLIST)[number];
export type DragonBoneOffset = Readonly<{ x: number; y: number; z: number }>;

export const DUNGEON_D20_PRESENTATION = {
  idleEuler: { x: -0.18, y: -0.62, z: 0.08 },
  revealEuler: { x: -0.16, y: -0.72, z: 0.04 },
  spinAxis: { x: 0.18, y: 0.96, z: 0.22 },
  idleRadiansPerSecond: 0.22,
  listeningRadiansPerSecond: 0.1,
  anticipatingRadiansPerSecond: 1.9,
  speakingRadiansPerSecond: 4.2,
} as const;

export type DragonPresentation = Readonly<{
  bones: ReadonlyMap<DragonProceduralBone, DragonBoneOffset>;
  d20Speed: number;
  d20Lift: number;
  d20Pulse: number;
  d20Glow: number;
  altarGlow: number;
}>;

const RAD = Math.PI / 180;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const enter = (elapsed: number, duration = 0.16) => smoothstep(elapsed / duration);

export function getDragonPresentation(
  phase: CharacterPhase,
  elapsed: number
): DragonPresentation {
  const bones = new Map<DragonProceduralBone, DragonBoneOffset>();
  const set = (name: DragonProceduralBone, x = 0, y = 0, z = 0) =>
    bones.set(name, { x: x * RAD, y: y * RAD, z: z * RAD });
  const breath = Math.sin(elapsed * 1.7);
  const slow = Math.sin(elapsed * 0.85);
  const idle = () => {
    set("Bone_003", breath * 1.3, 0, 0);
    set("Bone_014", breath * 1.8, 0, 0);
    set("Bone_028", breath * 0.9, 0, 0);
    DRAGON_PROCEDURAL_BONES.tail.forEach((bone, index) =>
      set(bone, 0, Math.sin(elapsed * 1.1 - index * 0.28) * (2.3 - index * 0.08), 0)
    );
    set("Bone_040", -0.8, slow * 1.6, slow * 0.6);
    set("Bone_039", 0, slow * 0.8, 0);
    set("Bone_031", 0, 0, (1 + slow) * 0.8);
    set("Bone_034", 0, 0, -(1 + slow) * 0.8);
  };

  idle();
  switch (phase) {
    case "listening": {
      const weight = enter(elapsed);
      set("Bone_040", -2.5 * weight, slow * 3 * weight, 0);
      set("Bone_039", -1.5 * weight, slow * 2 * weight, slow * 1.2 * weight);
      set("Bone_038", 0, slow * 1.2 * weight, 0);
      return { bones, d20Speed: 0.1, d20Lift: 0.012, d20Pulse: 0.012, d20Glow: 0.72, altarGlow: 0.24 };
    }
    case "awakening": {
      const weight = enter(elapsed, 0.12);
      const flex = weight * 4.1;
      set("Bone_003", -2.2 * weight, 0, 0);
      set("Bone_014", -3.2 * weight, 0, 0);
      set("Bone_031", 0, 0, flex);
      set("Bone_034", 0, 0, -flex);
      set("Bone_030", 0, 0, flex * 0.55);
      set("Bone_033", 0, 0, -flex * 0.55);
      return { bones, d20Speed: 0.65, d20Lift: 0.065 * weight, d20Pulse: 0.035, d20Glow: 1.18, altarGlow: 0.62 };
    }
    case "anticipating": {
      const weight = enter(elapsed);
      set("Bone_040", -2.8 * weight, -2.5 * weight, 0);
      set("Bone_039", -1.3 * weight, -1.8 * weight, 0);
      return { bones, d20Speed: 1.9, d20Lift: 0.055, d20Pulse: 0.04, d20Glow: 1.3, altarGlow: 0.72 };
    }
    case "speaking": {
      const gesture = Math.sin(Math.min(elapsed / 0.9, 1) * Math.PI);
      set("Bone_003", -1.5 * gesture, 0, 0);
      set("Bone_014", -2.4 * gesture, 0, 0);
      set("Bone_040", -2.4, gesture * 2.6, gesture * 0.8);
      set("Bone_039", -1.1, gesture * 1.4, 0);
      return { bones, d20Speed: 4.2, d20Lift: 0.07, d20Pulse: 0.065, d20Glow: 1.72, altarGlow: 1.05 };
    }
    case "reacting": {
      const accent = Math.sin(Math.min(elapsed / 0.65, 1) * Math.PI);
      set("Bone_040", -3.5 * accent, 2.4 * accent, 0);
      set("Bone_039", -1.8 * accent, 1.5 * accent, 0);
      set("Bone_031", 0, 0, 4.4 * accent);
      set("Bone_034", 0, 0, -4.4 * accent);
      set("Bone_012", 0, 3.2 * accent, 0);
      set("Bone_011", 0, 2.1 * accent, 0);
      return { bones, d20Speed: 0, d20Lift: 0.08, d20Pulse: 0.1, d20Glow: 2.25, altarGlow: 1.45 };
    }
    case "returning": {
      const settle = 1 - smoothstep(elapsed / 0.45);
      set("Bone_040", -2 * settle, slow * settle, 0);
      set("Bone_031", 0, 0, 2.2 * settle);
      set("Bone_034", 0, 0, -2.2 * settle);
      return { bones, d20Speed: 0.12, d20Lift: 0.035 * settle, d20Pulse: 0.025 * settle, d20Glow: 0.65 + settle * 0.45, altarGlow: 0.25 + settle * 0.35 };
    }
    case "paused":
    case "asset-error":
      return { bones: new Map(), d20Speed: 0, d20Lift: 0, d20Pulse: 0, d20Glow: 0.35, altarGlow: 0.1 };
    default:
      return { bones, d20Speed: 0.22, d20Lift: 0.014, d20Pulse: 0.012, d20Glow: 0.52, altarGlow: 0.16 };
  }
}

const MAX_TRUSTED_DRAGON_ROTATION = 6 * RAD;

/** Scale only the production channels qualified during Phase 4C. */
export function applyDungeonIntelligencePresentation(
  base: DragonPresentation,
  phase: CharacterPhase,
  presentation: DungeonIntelligencePresentation | null
): DragonPresentation {
  if (!presentation) return base;

  const intensityScale = presentation.intensity === 1 ? 0.82 : presentation.intensity === 3 ? 1.12 : 1;
  const deliveryScale = presentation.delivery === "mythic" ? 1.08 : presentation.delivery === "direct" ? 1.04 : 0.96;
  const revealScale = phase === "speaking" || phase === "reacting"
    ? presentation.reveal === "subtle" ? 0.9 : presentation.reveal === "dramatic" ? 1.12 : 1
    : 1;
  const reactionScale = phase === "reacting"
    ? presentation.reaction === "powerful" ? 1.15 : presentation.reaction === "restrained" ? 0.84 : 0.76
    : 1;
  const baseScale = intensityScale * deliveryScale * revealScale * reactionScale;

  const emphasized = presentation.gesture === "guardian_focus" || presentation.gesture === "head_neck_emphasis"
    ? new Set<DragonProceduralBone>(DRAGON_PROCEDURAL_BONES.neckHead)
    : presentation.gesture === "wing_root_emphasis"
      ? new Set<DragonProceduralBone>(DRAGON_PROCEDURAL_BONES.wingStructural)
      : new Set<DragonProceduralBone>(DRAGON_PROCEDURAL_BONES.body);
  const bones = new Map<DragonProceduralBone, DragonBoneOffset>();
  for (const [name, value] of base.bones) {
    const scale = baseScale * (emphasized.has(name) ? 1.12 : 1);
    bones.set(name, {
      x: Math.max(-MAX_TRUSTED_DRAGON_ROTATION, Math.min(MAX_TRUSTED_DRAGON_ROTATION, value.x * scale)),
      y: Math.max(-MAX_TRUSTED_DRAGON_ROTATION, Math.min(MAX_TRUSTED_DRAGON_ROTATION, value.y * scale)),
      z: Math.max(-MAX_TRUSTED_DRAGON_ROTATION, Math.min(MAX_TRUSTED_DRAGON_ROTATION, value.z * scale)),
    });
  }

  const d20Scale = presentation.environment === "d20_low"
    ? 0.78
    : presentation.environment === "d20_high" ? 1.18 : 1;
  const altarScale = presentation.environment === "altar_low"
    ? 0.78
    : presentation.environment === "altar_high" ? 1.18 : 1;
  const magicScale = intensityScale * revealScale;

  return {
    bones,
    d20Speed: Math.min(4.8, base.d20Speed * Math.max(0.72, baseScale)),
    d20Lift: Math.min(0.095, base.d20Lift * magicScale),
    d20Pulse: Math.min(0.115, base.d20Pulse * magicScale),
    d20Glow: Math.min(2.45, base.d20Glow * d20Scale * magicScale),
    altarGlow: Math.min(1.6, base.altarGlow * altarScale * magicScale),
  };
}

export function getDragonPoseMagnitude(presentation: DragonPresentation) {
  return Math.max(
    0,
    ...Array.from(presentation.bones.values()).flatMap(({ x, y, z }) => [
      Math.abs(x), Math.abs(y), Math.abs(z),
    ])
  );
}

export function getDragonCameraFillFraction({ width, aspect }: { width: number; aspect: number }) {
  if (width <= DRAGON_SCENE_PRESENTATION.camera.mobileMaxWidth) {
    return DRAGON_SCENE_PRESENTATION.camera.mobileFillFraction;
  }
  return aspect < DRAGON_SCENE_PRESENTATION.camera.narrowAspectThreshold
    ? DRAGON_SCENE_PRESENTATION.camera.narrowFillFraction
    : DRAGON_SCENE_PRESENTATION.camera.desktopFillFraction;
}

export function getDragonCameraDistance({ width, height, aspect }: { width: number; height: number; aspect: number }) {
  const halfFov = DRAGON_SCENE_PRESENTATION.camera.fieldOfView * Math.PI / 360;
  const tangent = Math.tan(halfFov) * getDragonCameraFillFraction({ width, aspect });
  return Math.max(
    height / 2 / tangent,
    width / 2 / (tangent * Math.max(aspect, 0.1)),
    DRAGON_SCENE_PRESENTATION.camera.minimumClearance
  );
}

export function shouldLoadDragon3D({ oracleId, livingOracleEnabled, dragon3DEnabled, motion, webGLSupported }: {
  oracleId: OracleId | null;
  livingOracleEnabled: boolean;
  dragon3DEnabled: boolean;
  motion: MotionPreference;
  webGLSupported: boolean;
}) {
  return oracleId === "dnd" && livingOracleEnabled && dragon3DEnabled && motion === "full" && webGLSupported;
}
