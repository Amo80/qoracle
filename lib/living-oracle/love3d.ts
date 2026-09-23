import type { MotionPreference } from "@/lib/experience/preferences";
import type { OracleId } from "@/lib/oracles/registry";
import type { CharacterPhase } from "./machine";
import type { LovePresentation } from "@/lib/oracle-intelligence/types";

export const LOVE_3D_MANIFEST = {
  version: 1,
  model: "/characters/love/v1/love-base.glb",
  fallback: "/themes/love-crystal-ball.png",
  heart: "/characters/love/v1/heart-crystal.glb",
  podium: "/characters/love/v1/podium.glb",
  baseClip: "Idle_7",
  optionalClips: {
    shrug: { path: "/characters/love/v1/animations/shrug.glb", name: "Shrug", approved: false },
    bubbleDance: { path: "/characters/love/v1/animations/bubble-dance.glb", name: "Bubble_Dance", approved: false },
  },
  facialControls: "not-supported",
} as const;

export const LOVE_SCENE_PRESENTATION = {
  character: { height: 1.78, floorY: 0.05, centerZ: 0 },
  podium: { height: 0.9, floorY: 0.05, centerZ: 0.7 },
  heart: {
    width: 0.28,
    centerY: 1.08,
    centerZ: 0.96,
    floatAmplitude: 0.018,
  },
  camera: {
    fieldOfView: 32,
    desktopFillFraction: 0.76,
    narrowFillFraction: 0.68,
    narrowAspectThreshold: 0.8,
    minimumClearance: 0.5,
  },
} as const;

export function getLoveCameraFillFraction(aspect: number) {
  return aspect < LOVE_SCENE_PRESENTATION.camera.narrowAspectThreshold
    ? LOVE_SCENE_PRESENTATION.camera.narrowFillFraction
    : LOVE_SCENE_PRESENTATION.camera.desktopFillFraction;
}

export function getLoveViewportSize({
  displayWidth,
  displayHeight,
  fallbackWidth,
  fallbackHeight,
}: {
  displayWidth: number;
  displayHeight: number;
  fallbackWidth: number;
  fallbackHeight: number;
}) {
  return {
    width: displayWidth > 1 ? displayWidth : Math.max(1, fallbackWidth),
    height: displayHeight > 1 ? displayHeight : Math.max(1, fallbackHeight),
  };
}

export type AxisBounds = Readonly<{ min: number; max: number }>;

export function scaleToSpan(bounds: AxisBounds, targetSpan: number) {
  const span = bounds.max - bounds.min;
  if (!Number.isFinite(span) || span <= 0 || targetSpan <= 0) {
    throw new Error("Love scene bounds must have a positive finite span.");
  }
  return targetSpan / span;
}

export function getLoveCameraDistance({
  width,
  height,
  aspect,
}: {
  width: number;
  height: number;
  aspect: number;
}) {
  const halfFov = (LOVE_SCENE_PRESENTATION.camera.fieldOfView * Math.PI) / 360;
  const fillFraction = getLoveCameraFillFraction(aspect);
  const usableTangent =
    Math.tan(halfFov) * fillFraction;
  const verticalDistance = height / 2 / usableTangent;
  const horizontalDistance = width / 2 / (usableTangent * Math.max(aspect, 0.1));
  return Math.max(
    verticalDistance,
    horizontalDistance,
    LOVE_SCENE_PRESENTATION.camera.minimumClearance
  );
}

export const LOVE_PROCEDURAL_BONES = [
  "Spine2",
  "Neck",
  "Head",
  "LeftArm",
  "RightArm",
  "LeftForeArm",
  "RightForeArm",
] as const;

export type LoveProceduralBone = (typeof LOVE_PROCEDURAL_BONES)[number];

/**
 * GLTFLoader removes animation-reserved punctuation such as the colon in
 * Mixamo node names. Accept the source and Three.js runtime spellings while
 * keeping the allowlist exact and bounded.
 */
export function getApprovedLoveBoneName(
  runtimeName: string
): LoveProceduralBone | null {
  return (
    LOVE_PROCEDURAL_BONES.find(
      (name) =>
        runtimeName === name ||
        runtimeName === `mixamorig:${name}` ||
        runtimeName === `mixamorig${name}`
    ) || null
  );
}

export type LovePose = Readonly<{
  spineX: number; spineY: number; spineZ: number;
  neckX: number; neckY: number; neckZ: number;
  headX: number; headY: number; headZ: number;
  leftArmX: number; leftArmY: number; leftArmZ: number;
  rightArmX: number; rightArmY: number; rightArmZ: number;
  leftForearmX: number; leftForearmY: number; leftForearmZ: number;
  rightForearmX: number; rightForearmY: number; rightForearmZ: number;
  heartIntensity: number; heartPulse: number;
}>;

const RAD = Math.PI / 180;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const enter = (elapsed: number, seconds = 0.18) =>
  smoothstep(elapsed / seconds);
const pose = (values: Partial<LovePose> = {}): LovePose => ({
  spineX: 0, spineY: 0, spineZ: 0, neckX: 0, neckY: 0, neckZ: 0,
  headX: 0, headY: 0, headZ: 0,
  leftArmX: 0, leftArmY: 0, leftArmZ: 0,
  rightArmX: 0, rightArmY: 0, rightArmZ: 0,
  leftForearmX: 0, leftForearmY: 0, leftForearmZ: 0,
  rightForearmX: 0, rightForearmY: 0, rightForearmZ: 0,
  heartIntensity: 0.45, heartPulse: 0,
  ...values,
});

/** Conservative additive rotations. Hips/root, legs, hands/fingers and face are never addressed. */
export function getLoveProceduralPose(phase: CharacterPhase, elapsed: number): LovePose {
  const breath = Math.sin(elapsed * 1.35);
  switch (phase) {
    case "listening": {
      const weight = enter(elapsed, 0.16);
      return pose({ spineX: 4 * RAD * weight, spineZ: -2 * RAD * weight, neckY: 5 * RAD * weight, headX: -3 * RAD * weight, headZ: 3 * RAD * weight, heartIntensity: 0.7, heartPulse: 0.03 * weight });
    }
    case "awakening": {
      const weight = enter(elapsed, 0.14);
      return pose({ spineX: -4 * RAD * weight, spineY: 3 * RAD * weight, leftArmX: -5 * RAD * weight, rightArmX: -5 * RAD * weight, leftArmZ: -15 * RAD * weight, rightArmZ: 15 * RAD * weight, leftForearmY: -8 * RAD * weight, rightForearmY: 8 * RAD * weight, leftForearmZ: -6 * RAD * weight, rightForearmZ: 6 * RAD * weight, heartIntensity: 1.12, heartPulse: 0.065 * weight });
    }
    case "anticipating": {
      const weight = enter(elapsed, 0.16);
      return pose({ spineX: 4 * RAD * weight, headX: -4 * RAD * weight, leftArmZ: -8 * RAD * weight, rightArmZ: 8 * RAD * weight, leftForearmY: -5 * RAD * weight, rightForearmY: 5 * RAD * weight, heartIntensity: 0.9, heartPulse: 0.045 * weight });
    }
    case "speaking": {
      const weight = enter(elapsed, 0.12);
      const gesture = Math.sin(Math.min(elapsed / 0.9, 1) * Math.PI);
      return pose({ spineX: -3 * RAD * weight, spineY: gesture * 3 * RAD, neckY: -gesture * 4 * RAD, headZ: gesture * 2.5 * RAD, leftArmX: -6 * RAD * weight, rightArmX: -6 * RAD * weight, leftArmZ: (-12 - gesture * 5) * RAD * weight, rightArmZ: (12 + gesture * 5) * RAD * weight, leftForearmY: (-8 - gesture * 5) * RAD * weight, rightForearmY: (8 + gesture * 5) * RAD * weight, leftForearmZ: -7 * RAD * weight, rightForearmZ: 7 * RAD * weight, heartIntensity: 0.82, heartPulse: 0.04 * weight });
    }
    case "reacting": {
      const t = Math.min(1, elapsed / 0.65);
      const inward = Math.sin(t * Math.PI);
      const readable = enter(elapsed, 0.08);
      return pose({ spineX: 5 * RAD * inward, headX: -4 * RAD * inward, leftArmX: 6 * RAD * inward, rightArmX: 6 * RAD * inward, leftArmZ: (-10 + 18 * inward) * RAD * readable, rightArmZ: (10 - 18 * inward) * RAD * readable, leftForearmY: -16 * RAD * inward, rightForearmY: 16 * RAD * inward, leftForearmZ: 10 * RAD * inward, rightForearmZ: -10 * RAD * inward, heartIntensity: 1.65, heartPulse: 0.1 * readable });
    }
    case "returning": {
      const settle = 1 - smoothstep(elapsed / 0.45);
      return pose({ spineX: -2 * RAD * settle + breath * 0.25 * RAD, leftArmZ: -7 * RAD * settle, rightArmZ: 7 * RAD * settle, leftForearmY: -4 * RAD * settle, rightForearmY: 4 * RAD * settle, heartIntensity: 0.55 + settle * 0.2, heartPulse: 0.018 * settle });
    }
    case "paused":
    case "asset-error":
      return pose();
    default:
      return pose({ spineX: breath * 0.35 * RAD, headY: Math.sin(elapsed * 0.45) * 0.5 * RAD });
  }
}

export function getLovePoseMagnitude(value: LovePose) {
  return Math.max(
    ...Object.entries(value)
      .filter(([key]) => !key.startsWith("heart"))
      .map(([, channel]) => Math.abs(channel))
  );
}

const ROTATION_CHANNELS = [
  "spineX", "spineY", "spineZ", "neckX", "neckY", "neckZ",
  "headX", "headY", "headZ", "leftArmX", "leftArmY", "leftArmZ",
  "rightArmX", "rightArmY", "rightArmZ", "leftForearmX",
  "leftForearmY", "leftForearmZ", "rightForearmX", "rightForearmY",
  "rightForearmZ",
] as const satisfies readonly (keyof LovePose)[];

/**
 * Applies trusted semantic direction only to Love's already-qualified pose and
 * heart channels. No new bones, transforms, clips, or lifecycle timing exist
 * in this layer. A null direction returns the exact protected base pose.
 */
export function applyLovePresentationToPose(
  base: LovePose,
  phase: CharacterPhase,
  presentation: LovePresentation | null
): LovePose {
  if (!presentation) return base;

  const intensityScale = presentation.intensity === 1 ? 0.82 : presentation.intensity === 3 ? 1.12 : 1;
  const deliveryScale = presentation.delivery === "tender" ? 0.92 : presentation.delivery === "direct" ? 1.06 : 1;
  const gestureScale =
    presentation.gesture === "restrained_open" ? 0.88 :
    presentation.gesture === "gentle_present" && phase === "speaking" ? 1.06 :
    presentation.gesture === "heart_inward_outward" && phase === "reacting" ? 1.12 :
    presentation.gesture === "attentive" && phase === "listening" ? 1.05 : 1;
  const reactionScale = phase !== "reacting"
    ? 1
    : presentation.reaction === "reflective" ? 0.88
    : presentation.reaction === "reassure" ? 0.94
    : 1.04;
  const rotationScale = Math.min(1.18, intensityScale * deliveryScale * gestureScale * reactionScale);
  const result = { ...base } as Record<keyof LovePose, number>;
  const maximumQualifiedRotation = 18 * RAD;
  for (const channel of ROTATION_CHANNELS) {
    result[channel] = Math.max(
      -maximumQualifiedRotation,
      Math.min(maximumQualifiedRotation, base[channel] * rotationScale)
    );
  }

  const environmentScale = presentation.environment === "heart_low"
    ? 0.78
    : presentation.environment === "heart_strong" ? 1.18 : 1;
  result.heartIntensity = Math.min(1.8, base.heartIntensity * environmentScale);
  result.heartPulse = Math.min(0.12, base.heartPulse * environmentScale);
  return result as LovePose;
}

export function shouldLoadLove3D({ oracleId, livingOracleEnabled, love3DEnabled, motion, webGLSupported }: {
  oracleId: OracleId | null; livingOracleEnabled: boolean; love3DEnabled: boolean;
  motion: MotionPreference; webGLSupported: boolean;
}) {
  return oracleId === "love" && livingOracleEnabled && love3DEnabled && motion === "full" && webGLSupported;
}
