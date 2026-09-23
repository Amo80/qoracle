import { describe, expect, it } from "vitest";
import {
  CHAOS_3D_MANIFEST,
  CHAOS_FRAGMENT_DEFINITIONS,
  CHAOS_SCENE_PRESENTATION,
  getChaosCameraDistance,
  getChaosCameraFillFraction,
  getChaosPresentation,
  applyChaosIntelligencePresentation,
  shouldLoadChaos3D,
} from "./chaos3d";

describe("Chaos 3D production contract", () => {
  it("loads only for eligible full-motion Chaos sessions", () => {
    const eligible = {
      oracleId: "chaos" as const,
      livingOracleEnabled: true,
      chaos3DEnabled: true,
      motion: "full" as const,
      webGLSupported: true,
    };
    expect(shouldLoadChaos3D(eligible)).toBe(true);
    expect(shouldLoadChaos3D({ ...eligible, oracleId: "jester" })).toBe(false);
    expect(shouldLoadChaos3D({ ...eligible, chaos3DEnabled: false })).toBe(false);
    expect(shouldLoadChaos3D({ ...eligible, motion: "reduced" })).toBe(false);
    expect(shouldLoadChaos3D({ ...eligible, webGLSupported: false })).toBe(false);
  });

  it("keeps one shared Rift source and stable fragment parameters", () => {
    expect(CHAOS_FRAGMENT_DEFINITIONS).toHaveLength(6);
    expect(CHAOS_3D_MANIFEST.fragmentInstancesDesktop).toBe(6);
    expect(CHAOS_3D_MANIFEST.fragmentInstancesNarrow).toBe(5);
    expect(new Set(CHAOS_FRAGMENT_DEFINITIONS.map((item) => item.phase)).size).toBe(6);
    expect(JSON.stringify(CHAOS_FRAGMENT_DEFINITIONS)).toBe(
      JSON.stringify(CHAOS_FRAGMENT_DEFINITIONS)
    );
  });

  it("maps every lifecycle phase without changing authoritative timing", () => {
    const idle = getChaosPresentation("idle", 0.3);
    const listening = getChaosPresentation("listening", 0.3);
    const awakening = getChaosPresentation("awakening", 0.225);
    const anticipating = getChaosPresentation("anticipating", 0.3);
    const speaking = getChaosPresentation("speaking", 0.45);
    const reacting = getChaosPresentation("reacting", 0.325);
    const returning = getChaosPresentation("returning", 0.225);
    expect(listening.fragmentRadius).toBeLessThan(idle.fragmentRadius);
    expect(awakening.fragmentRadius).toBeGreaterThan(idle.fragmentRadius);
    expect(anticipating.fragmentSpeed).toBeGreaterThan(awakening.fragmentSpeed);
    expect(speaking.reverseOdd).toBe(true);
    expect(reacting.fragmentRadius).toBeGreaterThan(speaking.fragmentRadius);
    expect(returning.returnProgress).toBeGreaterThan(0);
    expect(returning.returnProgress).toBeLessThan(1);
  });

  it("uses measured-scene framing with additional narrow clearance", () => {
    const desktop = getChaosCameraDistance({ width: 3.5, height: 3, aspect: 16 / 9 });
    const mobile = getChaosCameraDistance({ width: 3.5, height: 3, aspect: 390 / 844 });
    expect(getChaosCameraFillFraction(16 / 9)).toBe(
      CHAOS_SCENE_PRESENTATION.camera.desktopFillFraction
    );
    expect(getChaosCameraFillFraction(390 / 844)).toBe(
      CHAOS_SCENE_PRESENTATION.camera.narrowFillFraction
    );
    expect(mobile).toBeGreaterThan(desktop);
  });

  it("maps trusted Chaos cues only through bounded existing channels", () => {
    const base = getChaosPresentation("speaking", 0.3);
    const directed = applyChaosIntelligencePresentation(base, "speaking", {
      oracleId: "chaos", emotion: "energetic", intensity: 3, delivery: "dramatic",
      gesture: "controlled_instability", reveal: "dramatic", reaction: "strong_burst", environment: "reverse_approved",
    });
    expect(directed.coreSpeed).toBeLessThanOrEqual(1.34);
    expect(directed.fragmentSpeed).toBeLessThanOrEqual(5.8);
    expect(Math.abs(directed.wobbleX)).toBeLessThanOrEqual(0.065);
    expect(Math.abs(directed.wobbleY)).toBeLessThanOrEqual(0.075);
    expect(directed.reverseOdd).toBe(true);
    expect(directed.singularity).toBeGreaterThan(base.singularity);
  });

  it("keeps sensitive Chaos direction restrained, deterministic, and optional", () => {
    const base = getChaosPresentation("reacting", 0.3);
    const cue = { oracleId: "chaos" as const, emotion: "clear" as const, intensity: 1 as const, delivery: "direct" as const, gesture: "core_focus" as const, reveal: "subtle" as const, reaction: "settle" as const, environment: "orbit_slow" as const };
    const first = applyChaosIntelligencePresentation(base, "reacting", cue);
    expect(first).toEqual(applyChaosIntelligencePresentation(base, "reacting", cue));
    expect(first.fragmentSpeed).toBeLessThan(base.fragmentSpeed);
    expect(first.singularity).toBeLessThan(base.singularity);
    expect(applyChaosIntelligencePresentation(base, "reacting", null)).toBe(base);
  });
});
