import type { MotionPreference } from "@/lib/experience/preferences";
import type { OracleId } from "@/lib/oracles/registry";
import type { CharacterPhase } from "./machine";

export const ECLIPSE_3D_MANIFEST = {
  version: 1,
  empress: "/characters/eclipse/v1/empress.glb",
  altar: "/characters/eclipse/v1/celestial-altar.glb",
  fallback: "/themes/eclipse-crystal.png",
  neutralClip: "restpose",
  excludedClips: ["Running", "Walking"],
  loading: "selected-only",
} as const;

export const ECLIPSE_PROCEDURAL_BONES = Object.freeze([
  "mixamorig:Spine", "mixamorig:Spine1", "mixamorig:Spine2",
  "mixamorig:Neck", "mixamorig:Head",
  "mixamorig:LeftShoulder", "mixamorig:RightShoulder",
  "mixamorig:LeftArm", "mixamorig:RightArm",
  "mixamorig:LeftForeArm", "mixamorig:RightForeArm",
  "mixamorig:LeftHand", "mixamorig:RightHand",
] as const);

export const ECLIPSE_CAMERA_FRAMING = {
  desktop: { distance: 7.2, positionY: 0.08, targetY: 0.14 },
  narrow: { distance: 6.05, positionY: 0.24, targetY: 0.32 },
} as const;

export type EclipseBoneOffset = Readonly<{ x: number; y: number; z: number }>;
export type EclipsePose = Readonly<Record<string, EclipseBoneOffset>>;
export type EclipseCelestialPresentation = Readonly<{
  sunX: number; moonX: number; sunY: number; moonY: number;
  sunZ: number; moonZ: number; scale: number; orbit: number;
  corona: number; rays: number; altarGlow: number;
}>;

export type EclipseViewportProfile = Readonly<{
  narrow: boolean;
  separateScale: number;
  separateOrbit: number;
  climaxScale: number;
}>;

export function getEclipseViewportProfile(
  aspect: number,
  phase: CharacterPhase
): EclipseViewportProfile {
  const narrow = aspect < 0.72;
  void phase;
  return {
    narrow,
    separateScale: narrow ? 0.62 : 1,
    separateOrbit: narrow ? 0.58 : 1,
    // Compensates for the approved whole-stage camera pullback so the
    // converged eclipse retains its Preview-approved apparent size.
    climaxScale: narrow ? 1.06 : 1.15,
  };
}

const DEG = Math.PI / 180;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const t = clamp01(value); return t * t * (3 - 2 * t); };
const d = (x = 0, y = 0, z = 0): EclipseBoneOffset => ({ x: x * DEG, y: y * DEG, z: z * DEG });

export function getEclipsePose(phase: CharacterPhase, elapsed: number): EclipsePose {
  const t = Math.max(0, elapsed);
  const enter = smooth(t / 0.16);
  const pose: Record<string, EclipseBoneOffset> = {};
  const set = (name: string, x = 0, y = 0, z = 0) => { pose[name] = d(x, y, z); };
  const breath = Math.sin(t * 1.45);
  set("mixamorig:Spine", breath * 0.55);
  set("mixamorig:Spine1", breath * 0.4);
  set("mixamorig:Spine2", breath * 0.3);

  if (phase === "listening") {
    set("mixamorig:Neck", -1.8 * enter, 1.5 * enter);
    set("mixamorig:Head", 1.2 * enter, -1 * enter);
    set("mixamorig:LeftForeArm", 0, -3.5 * enter, 2 * enter);
    set("mixamorig:RightForeArm", 0, 3.5 * enter, -2 * enter);
  } else if (phase === "awakening" || phase === "anticipating") {
    const w = phase === "awakening" ? enter : 1;
    set("mixamorig:Spine2", -2.2 * w);
    set("mixamorig:LeftShoulder", 0, 0, -4 * w);
    set("mixamorig:RightShoulder", 0, 0, 4 * w);
    set("mixamorig:LeftArm", 1, 3 * w, -9 * w);
    set("mixamorig:RightArm", 1, -3 * w, 9 * w);
    set("mixamorig:LeftForeArm", 0, -6 * w, 3 * w);
    set("mixamorig:RightForeArm", 0, 6 * w, -3 * w);
  } else if (phase === "speaking" || phase === "reacting") {
    const accent = phase === "reacting" ? Math.sin(clamp01(t / 0.65) * Math.PI) : enter;
    set("mixamorig:Spine2", -2.4 * accent);
    set("mixamorig:Neck", 1.2 * accent);
    set("mixamorig:LeftShoulder", 0, 0, -5 * accent);
    set("mixamorig:RightShoulder", 0, 0, 5 * accent);
    set("mixamorig:LeftArm", 1, -3 * accent, -10 * accent);
    set("mixamorig:RightArm", 1, 3 * accent, 10 * accent);
    set("mixamorig:LeftForeArm", 0, -9 * accent, 5 * accent);
    set("mixamorig:RightForeArm", 0, 9 * accent, -5 * accent);
    set("mixamorig:LeftHand", 0, -4 * accent, 2 * accent);
    set("mixamorig:RightHand", 0, 4 * accent, -2 * accent);
  } else if (phase === "returning") {
    const w = 1 - smooth(t / 0.45);
    set("mixamorig:Spine2", -2 * w);
    set("mixamorig:LeftArm", 0, -2 * w, -8 * w);
    set("mixamorig:RightArm", 0, 2 * w, 8 * w);
    set("mixamorig:LeftForeArm", 0, -7 * w, 4 * w);
    set("mixamorig:RightForeArm", 0, 7 * w, -4 * w);
  }
  return pose;
}

export function getEclipseCelestialPresentation(phase: CharacterPhase, elapsed: number): EclipseCelestialPresentation {
  const t = Math.max(0, elapsed);
  const baseOrbit = t * 0.24;
  const base = { sunX: -0.78, moonX: 0.78, sunY: 0.35, moonY: 0.28, sunZ: 0.12, moonZ: 0.34, scale: 1, orbit: baseOrbit, corona: 0.18, rays: 0.1, altarGlow: 0.22 };
  if (phase === "listening") return { ...base, orbit: t * 0.08, sunX: -0.68, moonX: 0.68, corona: 0.24, altarGlow: 0.34 };
  if (phase === "awakening") { const w = smooth(t / 0.35); return { ...base, sunX: -0.78 + 0.28 * w, moonX: 0.78 - 0.28 * w, sunY: 0.35 + 0.08 * w, moonY: 0.28 + 0.15 * w, scale: 1 + 0.1 * w, orbit: t * 0.38, corona: 0.35 + 0.2 * w, rays: 0.25, altarGlow: 0.62 }; }
  if (phase === "anticipating") return { ...base, sunX: -0.31, moonX: 0.31, sunY: 0.42, moonY: 0.42, sunZ: 0.12, moonZ: 0.46, scale: 1.18, orbit: t * 0.62, corona: 0.72, rays: 0.48, altarGlow: 0.82 };
  if (phase === "speaking") { const w = smooth(t / 0.22); return { ...base, sunX: -0.31 * (1 - w), moonX: 0.31 * (1 - w), sunY: 0.42, moonY: 0.42, sunZ: 0.08, moonZ: 0.58, scale: 1.18 + 0.48 * w, orbit: t * 0.78, corona: 0.72 + 0.78 * w, rays: 0.55 + 0.75 * w, altarGlow: 1 }; }
  if (phase === "reacting") { const pulse = Math.sin(clamp01(t / 0.65) * Math.PI); return { ...base, sunX: 0, moonX: 0, sunY: 0.42, moonY: 0.42, sunZ: 0.08, moonZ: 0.58, scale: 1.66 + pulse * 0.16, orbit: t * 0.5, corona: 1.5 + pulse * 0.38, rays: 1.3 + pulse * 0.25, altarGlow: 1 + pulse * 0.25 }; }
  if (phase === "returning") { const w = smooth(t / 0.45); return { ...base, sunX: -0.78 * w, moonX: 0.78 * w, sunY: 0.42 - 0.07 * w, moonY: 0.42 - 0.14 * w, sunZ: 0.08 + 0.04 * w, moonZ: 0.58 - 0.24 * w, scale: 1.66 - 0.66 * w, orbit: t * 0.3, corona: 1.5 - 1.32 * w, rays: 1.3 - 1.2 * w, altarGlow: 1 - 0.78 * w }; }
  return base;
}

export function shouldLoadEclipse3D({ oracleId, livingOracleEnabled, eclipse3DEnabled, motion, webGLSupported }: { oracleId: OracleId | null; livingOracleEnabled: boolean; eclipse3DEnabled: boolean; motion: MotionPreference; webGLSupported: boolean }) {
  return oracleId === "eclipse" && livingOracleEnabled && eclipse3DEnabled && motion === "full" && webGLSupported;
}
