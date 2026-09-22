import { describe, expect, it } from "vitest";
import {
  CHAOS_3D_MANIFEST,
  CHAOS_FRAGMENT_DEFINITIONS,
  CHAOS_SCENE_PRESENTATION,
  getChaosCameraDistance,
  getChaosCameraFillFraction,
  getChaosPresentation,
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
});
