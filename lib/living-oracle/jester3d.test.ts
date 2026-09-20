import { describe, expect, it } from "vitest";
import type { CharacterPhase } from "./machine";
import {
  JESTER_BALL_PRESENTATION,
  JESTER_3D_MANIFEST,
  getJesterAnimationPlan,
  shouldLoadJester3D,
} from "./jester3d";

describe("Phase 4A Jester 3D presentation contract", () => {
  it("maps lifecycle phases without controlling lifecycle timing", () => {
    expect(getJesterAnimationPlan("idle").clip).toBe("Idle_9");
    expect(getJesterAnimationPlan("speaking").clip).toBe(
      "Talk_with_Hands_Open"
    );
    expect(getJesterAnimationPlan("reacting").clip).toBe(
      "Big_Heart_Gesture"
    );
    expect(getJesterAnimationPlan("paused")).toMatchObject({
      clip: null,
      pause: true,
    });
    expect(getJesterAnimationPlan("asset-error").clip).toBeNull();
  });

  it("keeps jazz unapproved and walking/running out of the runtime manifest", () => {
    expect(JESTER_3D_MANIFEST.optionalClips.jazz.approved).toBe(false);
    expect(JSON.stringify(JESTER_3D_MANIFEST)).not.toMatch(/walking|running/i);
  });

  it("uses independent character and crystal-ball assets", () => {
    expect(JESTER_3D_MANIFEST.model).not.toBe(JESTER_3D_MANIFEST.crystalBall);
    expect(JESTER_3D_MANIFEST.fallback).toBe("/themes/jester-oracle.png");
  });

  it("keeps the independent ball small and near the Jester waist", () => {
    expect(JESTER_BALL_PRESENTATION.scale).toBeLessThanOrEqual(0.12);
    expect(JESTER_BALL_PRESENTATION.position.y).toBeGreaterThanOrEqual(0.85);
    expect(JESTER_BALL_PRESENTATION.floatAmplitude).toBeGreaterThan(0);
  });

  it("makes the real Heart gesture readable inside the bounded reaction", () => {
    expect(getJesterAnimationPlan("reacting")).toMatchObject({
      clip: "Big_Heart_Gesture",
      startAtSeconds: 0.75,
      timeScale: 3,
    });
  });

  it("loads only for Jester with both flags, full motion, and WebGL", () => {
    const eligible = {
      oracleId: "jester" as const,
      livingOracleEnabled: true,
      jester3DEnabled: true,
      motion: "full" as const,
      webGLSupported: true,
    };
    expect(shouldLoadJester3D(eligible)).toBe(true);
    expect(shouldLoadJester3D({ ...eligible, oracleId: "chaos" })).toBe(false);
    expect(shouldLoadJester3D({ ...eligible, motion: "reduced" })).toBe(false);
    expect(shouldLoadJester3D({ ...eligible, jester3DEnabled: false })).toBe(false);
    expect(shouldLoadJester3D({ ...eligible, webGLSupported: false })).toBe(false);
  });

  it("has a bounded plan for every Phase 3 lifecycle state", () => {
    const phases: CharacterPhase[] = [
      "idle",
      "listening",
      "awakening",
      "anticipating",
      "speaking",
      "reacting",
      "returning",
      "paused",
      "asset-error",
    ];
    for (const phase of phases) {
      expect(getJesterAnimationPlan(phase)).toBeDefined();
    }
  });
});
