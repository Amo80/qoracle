import type { MotionPreference } from "@/lib/experience/preferences";
import type { OracleId } from "@/lib/oracles/registry";
import type { CharacterPhase } from "./machine";
import type { ChaosPresentation as ChaosIntelligencePresentation } from "@/lib/oracle-intelligence/types";

export const CHAOS_3D_MANIFEST = {
  version: 1,
  pedestal: "/characters/chaos/v1/pedestal.glb",
  rift: "/characters/chaos/v1/rift-crystal.glb",
  vortex: "/characters/chaos/v1/vortex.webp",
  fallback: "/themes/chaos-crystal-ball.png",
  fragmentInstancesDesktop: 6,
  fragmentInstancesNarrow: 5,
  loading: "selected-only",
} as const;

export const CHAOS_SCENE_PRESENTATION = {
  core: { centerX: 0, centerY: 0.3, centerZ: 0.18, radius: 1 },
  pedestal: { height: 1.18, floorY: -1.42, centerX: 0, centerZ: 0.04 },
  camera: {
    fieldOfView: 38,
    desktopFillFraction: 0.72,
    narrowFillFraction: 0.59,
    narrowAspectThreshold: 0.72,
    minimumClearance: 1.25,
    verticalTargetOffset: -0.05,
  },
} as const;

export type ChaosFragmentDefinition = Readonly<{
  phase: number;
  radius: number;
  elevation: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  wobble: number;
  spin: number;
}>;

export const CHAOS_FRAGMENT_DEFINITIONS = Object.freeze([
  { phase: 0.18, radius: 1.34, elevation: 0.38, speed: 0.23, direction: 1, scale: 0.31, wobble: 0.12, spin: 0.42 },
  { phase: 1.22, radius: 1.48, elevation: 0.02, speed: 0.18, direction: -1, scale: 0.24, wobble: 0.16, spin: -0.31 },
  { phase: 2.31, radius: 1.39, elevation: -0.34, speed: 0.27, direction: 1, scale: 0.28, wobble: 0.1, spin: 0.36 },
  { phase: 3.37, radius: 1.52, elevation: 0.28, speed: 0.16, direction: -1, scale: 0.22, wobble: 0.18, spin: -0.27 },
  { phase: 4.49, radius: 1.31, elevation: -0.16, speed: 0.25, direction: 1, scale: 0.27, wobble: 0.13, spin: 0.33 },
  { phase: 5.51, radius: 1.45, elevation: 0.51, speed: 0.2, direction: -1, scale: 0.2, wobble: 0.15, spin: -0.38 },
] as const satisfies readonly ChaosFragmentDefinition[]);

export type ChaosPresentation = Readonly<{
  coreSpeed: number;
  counterSpeed: number;
  coreScale: number;
  coreLift: number;
  wobbleX: number;
  wobbleY: number;
  singularity: number;
  shell: number;
  fragmentRadius: number;
  fragmentSpeed: number;
  fragmentElevation: number;
  reverseOdd: boolean;
  returnProgress: number;
  pedestalGlow: number;
}>;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const enter = (elapsed: number, duration = 0.16) => smoothstep(elapsed / duration);

export function getChaosPresentation(
  phase: CharacterPhase,
  elapsed: number
): ChaosPresentation {
  const time = Math.max(0, elapsed);
  const slow = Math.sin(time * 0.72);
  const base: ChaosPresentation = {
    coreSpeed: 0.22,
    counterSpeed: -0.1364,
    coreScale: 1 + Math.sin(time * 1.15) * 0.018,
    coreLift: slow * 0.025,
    wobbleX: Math.sin(time * 0.63) * 0.025,
    wobbleY: Math.cos(time * 0.51) * 0.035,
    singularity: 0.78,
    shell: 0.62,
    fragmentRadius: 1,
    fragmentSpeed: 1,
    fragmentElevation: 1,
    reverseOdd: false,
    returnProgress: 0,
    pedestalGlow: 0.18,
  };

  switch (phase) {
    case "listening": {
      const weight = enter(time);
      return {
        ...base,
        coreSpeed: 0.22 + (0.08 - 0.22) * weight,
        counterSpeed: -0.05,
        coreScale: 1.005,
        coreLift: 0.01,
        singularity: 0.78 + 0.3 * weight,
        shell: 0.7,
        fragmentRadius: 1 - 0.16 * weight,
        fragmentSpeed: 1 - 0.66 * weight,
        pedestalGlow: 0.28,
      };
    }
    case "awakening": {
      const weight = enter(time, 0.12);
      return {
        ...base,
        coreSpeed: 0.22 + 0.36 * weight,
        counterSpeed: -0.32,
        coreScale: 1 + 0.035 * weight,
        coreLift: 0.08 * weight,
        singularity: 0.78 + 0.56 * weight,
        shell: 0.62 + 0.26 * weight,
        fragmentRadius: 1 + 0.12 * weight,
        fragmentSpeed: 1 + 1.4 * weight,
        fragmentElevation: 1 + 0.14 * weight,
        pedestalGlow: 0.62,
      };
    }
    case "anticipating": {
      const weight = enter(time);
      return {
        ...base,
        coreSpeed: 0.72,
        counterSpeed: -0.46,
        coreScale: 1 + Math.sin(time * 3.2) * 0.025,
        coreLift: 0.065,
        wobbleX: Math.sin(time * 1.7) * 0.035,
        wobbleY: Math.cos(time * 1.35) * 0.05,
        singularity: 1.32,
        shell: 0.9,
        fragmentRadius: 1.06,
        fragmentSpeed: 2.9,
        fragmentElevation: 1 + Math.sin(time * 2.1) * 0.12 * weight,
        pedestalGlow: 0.78,
      };
    }
    case "speaking": {
      const weight = enter(time, 0.1);
      return {
        ...base,
        coreSpeed: 1.14,
        counterSpeed: -0.72,
        coreScale: 1 + Math.sin(time * 5.4) * 0.035,
        coreLift: 0.075,
        wobbleX: Math.sin(time * 2.4) * 0.035,
        wobbleY: Math.cos(time * 2) * 0.055,
        singularity: 1.3 + 0.42 * weight,
        shell: 1,
        fragmentRadius: 1.08,
        fragmentSpeed: 5.2,
        fragmentElevation: 1.12,
        reverseOdd: true,
        pedestalGlow: 1,
      };
    }
    case "reacting": {
      const accent = Math.sin(Math.min(time / 0.65, 1) * Math.PI);
      return {
        ...base,
        coreSpeed: 0.82,
        counterSpeed: -0.52,
        coreScale: 1 + accent * 0.09,
        coreLift: 0.07,
        singularity: 1.3 + accent * 0.9,
        shell: 0.9 + accent * 0.1,
        fragmentRadius: 1 + accent * 0.34,
        fragmentSpeed: 2.8,
        fragmentElevation: 1 + accent * 0.2,
        pedestalGlow: 1 + accent * 0.36,
      };
    }
    case "returning": {
      const settle = smoothstep(time / 0.45);
      return {
        ...base,
        coreSpeed: 0.48 + (0.22 - 0.48) * settle,
        counterSpeed: -0.3 + (-0.1364 + 0.3) * settle,
        coreScale: 1 + (1 - settle) * 0.045,
        coreLift: (1 - settle) * 0.055,
        singularity: 1.25 + (0.78 - 1.25) * settle,
        shell: 0.88 + (0.62 - 0.88) * settle,
        fragmentRadius: 1.24 + (1 - 1.24) * settle,
        fragmentSpeed: 1.8 + (1 - 1.8) * settle,
        fragmentElevation: 1 + (1 - settle) * 0.12,
        returnProgress: settle,
        pedestalGlow: 0.72 + (0.18 - 0.72) * settle,
      };
    }
    case "paused":
    case "asset-error":
      return {
        ...base,
        coreSpeed: 0,
        counterSpeed: 0,
        coreScale: 1,
        coreLift: 0,
        wobbleX: 0,
        wobbleY: 0,
        fragmentSpeed: 0,
        pedestalGlow: 0.08,
      };
    default:
      return base;
  }
}

/** Applies trusted semantic cues only to existing Phase 4D-qualified channels. */
export function applyChaosIntelligencePresentation(
  base: ChaosPresentation,
  phase: CharacterPhase,
  semantic: ChaosIntelligencePresentation | null
): ChaosPresentation {
  if (!semantic) return base;
  const intensity = semantic.intensity === 1 ? 0.82 : semantic.intensity === 3 ? 1.14 : 1;
  const delivery = semantic.delivery === "dramatic" ? 1.1 : semantic.delivery === "lateral" ? 1.04 : 0.96;
  const reveal = phase === "speaking" || phase === "reacting"
    ? semantic.reveal === "dramatic" ? 1.12 : semantic.reveal === "subtle" ? 0.88 : 1
    : 1;
  const reaction = phase === "reacting"
    ? semantic.reaction === "strong_burst" ? 1.14 : semantic.reaction === "restrained_burst" ? 0.82 : 0.76
    : 1;
  const scale = intensity * delivery * reveal * reaction;
  const coreScale = semantic.gesture === "core_focus" ? 1.06 : 1;
  const radiusScale = semantic.gesture === "fragments_contract" ? 0.88 : semantic.gesture === "fragments_spread" ? 1.12 : 1;
  const instabilityScale = semantic.gesture === "controlled_instability" ? 1.1 : 1;
  const orbitScale = semantic.environment === "orbit_slow" ? 0.76 : semantic.environment === "orbit_fast" ? 1.16 : 1;
  const pedestalScale = semantic.environment === "pedestal_low" ? 0.76 : semantic.environment === "pedestal_high" ? 1.16 : 1;
  return {
    ...base,
    coreSpeed: Math.min(1.34, Math.max(0, base.coreSpeed * scale)),
    counterSpeed: Math.max(-0.86, Math.min(0, base.counterSpeed * scale)),
    coreScale: Math.min(1.13, base.coreScale * coreScale * Math.min(scale, 1.06)),
    coreLift: Math.min(0.1, base.coreLift * Math.min(scale, 1.15)),
    wobbleX: Math.max(-0.065, Math.min(0.065, base.wobbleX * instabilityScale * scale)),
    wobbleY: Math.max(-0.075, Math.min(0.075, base.wobbleY * instabilityScale * scale)),
    singularity: Math.min(2.25, base.singularity * scale),
    shell: Math.min(1, base.shell * Math.min(scale, 1.08)),
    fragmentRadius: Math.min(1.42, Math.max(0.78, base.fragmentRadius * radiusScale)),
    fragmentSpeed: Math.min(5.8, Math.max(0, base.fragmentSpeed * scale * orbitScale)),
    fragmentElevation: Math.min(1.3, base.fragmentElevation * instabilityScale),
    reverseOdd: base.reverseOdd || semantic.environment === "reverse_approved",
    pedestalGlow: Math.min(1.48, base.pedestalGlow * scale * pedestalScale),
  };
}

export function getChaosCameraFillFraction(aspect: number) {
  return aspect < CHAOS_SCENE_PRESENTATION.camera.narrowAspectThreshold
    ? CHAOS_SCENE_PRESENTATION.camera.narrowFillFraction
    : CHAOS_SCENE_PRESENTATION.camera.desktopFillFraction;
}

export function getChaosCameraDistance({
  width,
  height,
  aspect,
}: {
  width: number;
  height: number;
  aspect: number;
}) {
  const halfFov =
    (CHAOS_SCENE_PRESENTATION.camera.fieldOfView * Math.PI) / 360;
  const tangent = Math.tan(halfFov) * getChaosCameraFillFraction(aspect);
  return Math.max(
    height / 2 / tangent,
    width / 2 / (tangent * Math.max(aspect, 0.1)),
    CHAOS_SCENE_PRESENTATION.camera.minimumClearance
  );
}

export function shouldLoadChaos3D({
  oracleId,
  livingOracleEnabled,
  chaos3DEnabled,
  motion,
  webGLSupported,
}: {
  oracleId: OracleId | null;
  livingOracleEnabled: boolean;
  chaos3DEnabled: boolean;
  motion: MotionPreference;
  webGLSupported: boolean;
}) {
  return (
    oracleId === "chaos" &&
    livingOracleEnabled &&
    chaos3DEnabled &&
    motion === "full" &&
    webGLSupported
  );
}
