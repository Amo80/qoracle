import type { MotionPreference } from "@/lib/experience/preferences";
import type { CharacterPhase } from "./machine";
import type { OracleId } from "@/lib/oracles/registry";

export const JESTER_3D_MANIFEST = {
  version: 1,
  model: "/characters/jester/v1/jester-base.glb",
  fallback: "/themes/jester-oracle.png",
  crystalBall: "/characters/jester/v1/crystal-ball.glb",
  clips: {
    idle: { path: "/characters/jester/v1/jester-base.glb", name: "Idle_9" },
    speaking: {
      path: "/characters/jester/v1/animations/talk.glb",
      name: "Talk_with_Hands_Open",
    },
    positiveReaction: {
      path: "/characters/jester/v1/animations/heart.glb",
      name: "Big_Heart_Gesture",
    },
  },
  optionalClips: {
    jazz: {
      path: "/characters/jester/v1/animations/jazz.glb",
      name: "jazz_danc",
      approved: false,
    },
  },
  loading: "jester-only",
  facialControls: "reserved-not-supported",
} as const;

export const JESTER_BALL_PRESENTATION = {
  position: { x: 0, y: 0.92, z: 0.42 },
  scale: 0.12,
  floatAmplitude: 0.018,
} as const;

export type JesterAnimationPlan = Readonly<{
  clip: "Idle_9" | "Talk_with_Hands_Open" | "Big_Heart_Gesture" | null;
  loop: boolean;
  crossFadeSeconds: number;
  startAtSeconds: number;
  timeScale: number;
  pause: boolean;
}>;

export function getJesterAnimationPlan(
  phase: CharacterPhase
): JesterAnimationPlan {
  switch (phase) {
    case "speaking":
      return {
        clip: "Talk_with_Hands_Open",
        loop: true,
        crossFadeSeconds: 0.18,
        startAtSeconds: 0,
        timeScale: 1,
        pause: false,
      };
    case "reacting":
      return {
        clip: "Big_Heart_Gesture",
        loop: false,
        crossFadeSeconds: 0.16,
        // The source performance is 6.25s, while Phase 3 intentionally gives
        // reaction 650ms. Enter where the gesture is already readable and
        // advance briskly without allowing clip duration to own lifecycle time.
        startAtSeconds: 0.75,
        timeScale: 3,
        pause: false,
      };
    case "paused":
      return {
        clip: null,
        loop: false,
        crossFadeSeconds: 0,
        startAtSeconds: 0,
        timeScale: 1,
        pause: true,
      };
    case "asset-error":
      return {
        clip: null,
        loop: false,
        crossFadeSeconds: 0,
        startAtSeconds: 0,
        timeScale: 1,
        pause: false,
      };
    default:
      return {
        clip: "Idle_9",
        loop: true,
        crossFadeSeconds: phase === "returning" ? 0.28 : 0.2,
        startAtSeconds: 0,
        timeScale: 1,
        pause: false,
      };
  }
}

export function shouldLoadJester3D({
  oracleId,
  livingOracleEnabled,
  jester3DEnabled,
  motion,
  webGLSupported,
}: {
  oracleId: OracleId | null;
  livingOracleEnabled: boolean;
  jester3DEnabled: boolean;
  motion: MotionPreference;
  webGLSupported: boolean;
}) {
  return (
    oracleId === "jester" &&
    livingOracleEnabled &&
    jester3DEnabled &&
    motion === "full" &&
    webGLSupported
  );
}
