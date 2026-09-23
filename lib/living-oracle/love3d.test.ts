import { describe, expect, it } from "vitest";
import {
  LOVE_3D_MANIFEST,
  LOVE_SCENE_PRESENTATION,
  getApprovedLoveBoneName,
  getLoveProceduralPose,
  getLovePoseMagnitude,
  getLoveCameraFillFraction,
  getLoveCameraDistance,
  getLoveViewportSize,
  scaleToSpan,
  shouldLoadLove3D,
  applyLovePresentationToPose,
} from "./love3d";

describe("Love 3D presentation contract", () => {
  it("keeps scene objects independent and optional clips unapproved", () => {
    expect(new Set([LOVE_3D_MANIFEST.model, LOVE_3D_MANIFEST.heart, LOVE_3D_MANIFEST.podium]).size).toBe(3);
    expect(LOVE_3D_MANIFEST.fallback).toBe("/themes/love-crystal-ball.png");
    expect(LOVE_3D_MANIFEST.baseClip).toBe("Idle_7");
    expect(LOVE_3D_MANIFEST.optionalClips.shrug.approved).toBe(false);
    expect(LOVE_3D_MANIFEST.optionalClips.bubbleDance.approved).toBe(false);
    expect(JSON.stringify(LOVE_3D_MANIFEST)).not.toMatch(/walking|running|restpose/i);
  });

  it("loads only for eligible full-motion Love sessions", () => {
    const eligible = { oracleId: "love" as const, livingOracleEnabled: true, love3DEnabled: true, motion: "full" as const, webGLSupported: true };
    expect(shouldLoadLove3D(eligible)).toBe(true);
    expect(shouldLoadLove3D({ ...eligible, oracleId: "jester" })).toBe(false);
    expect(shouldLoadLove3D({ ...eligible, love3DEnabled: false })).toBe(false);
    expect(shouldLoadLove3D({ ...eligible, motion: "reduced" })).toBe(false);
    expect(shouldLoadLove3D({ ...eligible, webGLSupported: false })).toBe(false);
  });

  it("uses bounded procedural rotations and a readable heart reaction", () => {
    for (const phase of ["idle", "listening", "awakening", "anticipating", "speaking", "reacting", "returning"] as const) {
      const pose = getLoveProceduralPose(phase, 0.3);
      for (const [key, value] of Object.entries(pose)) {
        if (!key.startsWith("heart")) expect(Math.abs(value)).toBeLessThanOrEqual(18 * Math.PI / 180);
      }
    }
    const reaction = getLoveProceduralPose("reacting", 0.325);
    expect(reaction.heartIntensity).toBeGreaterThan(1);
    expect(reaction.heartPulse).toBeGreaterThan(0.05);
  });

  it("applies only bounded Love semantic variation and preserves the exact base pose without intent", () => {
    const base = getLoveProceduralPose("reacting", 0.325);
    expect(applyLovePresentationToPose(base, "reacting", null)).toBe(base);
    const directed = applyLovePresentationToPose(base, "reacting", {
      oracleId: "love",
      emotion: "warm",
      intensity: 3,
      delivery: "tender",
      gesture: "heart_inward_outward",
      reveal: "dramatic",
      reaction: "warm",
      environment: "heart_strong",
    });
    expect(directed.heartIntensity).toBeGreaterThan(base.heartIntensity);
    expect(directed.heartPulse).toBeGreaterThan(base.heartPulse);
    expect(getLovePoseMagnitude(directed)).toBeLessThanOrEqual(18 * Math.PI / 180);
  });

  it("keeps sensitive Love direction visibly restrained", () => {
    const base = getLoveProceduralPose("speaking", 0.45);
    const restrained = applyLovePresentationToPose(base, "speaking", {
      oracleId: "love",
      emotion: "compassionate",
      intensity: 1,
      delivery: "tender",
      gesture: "attentive",
      reveal: "subtle",
      reaction: "reassure",
      environment: "heart_low",
    });
    expect(getLovePoseMagnitude(restrained)).toBeLessThan(getLovePoseMagnitude(base));
    expect(restrained.heartIntensity).toBeLessThan(base.heartIntensity);
  });

  it("produces a visible non-idle pose inside every authoritative lifecycle window", () => {
    const samples = {
      listening: 0.3,
      awakening: 0.225,
      anticipating: 0.3,
      speaking: 0.45,
      reacting: 0.325,
      returning: 0.225,
    } as const;
    for (const [phase, elapsed] of Object.entries(samples)) {
      expect(
        getLovePoseMagnitude(
          getLoveProceduralPose(phase as keyof typeof samples, elapsed)
        ),
        phase
      ).toBeGreaterThanOrEqual(2 * Math.PI / 180);
    }
  });

  it("resolves Three.js-sanitized Mixamo bones without broadening the allowlist", () => {
    expect(getApprovedLoveBoneName("mixamorigSpine2")).toBe("Spine2");
    expect(getApprovedLoveBoneName("mixamorigLeftArm")).toBe("LeftArm");
    expect(getApprovedLoveBoneName("mixamorig:RightForeArm")).toBe(
      "RightForeArm"
    );
    expect(getApprovedLoveBoneName("Head")).toBe("Head");
    expect(getApprovedLoveBoneName("mixamorigHips")).toBeNull();
    expect(getApprovedLoveBoneName("mixamorigLeftHand")).toBeNull();
    expect(getApprovedLoveBoneName("NotActuallyLeftArm")).toBeNull();
  });

  it("normalizes measured scene bounds and keeps the camera clear", () => {
    expect(scaleToSpan({ min: 0, max: 1.64 }, 1.78)).toBeCloseTo(1.085, 3);
    expect(scaleToSpan({ min: -0.9525, max: 0.95122 }, 0.9)).toBeCloseTo(
      0.473,
      3
    );
    expect(scaleToSpan({ min: -0.95074, max: 0.95046 }, 0.28)).toBeCloseTo(
      0.147,
      3
    );
    const desktopDistance = getLoveCameraDistance({
      width: 1.16,
      height: 1.78,
      aspect: 16 / 9,
    });
    const mobileDistance = getLoveCameraDistance({
      width: 1.16,
      height: 1.78,
      aspect: 9 / 16,
    });
    expect(desktopDistance).toBeGreaterThan(3.5);
    expect(mobileDistance).toBeGreaterThan(desktopDistance);
    expect(desktopDistance).toBeGreaterThan(
      LOVE_SCENE_PRESENTATION.camera.minimumClearance
    );
    expect(getLoveCameraFillFraction(16 / 9)).toBeCloseTo(0.76);
    expect(getLoveCameraFillFraction(9 / 16)).toBeCloseTo(0.68);
    expect(getLoveCameraFillFraction(16 / 9) / 0.68).toBeCloseTo(1.118, 3);
    expect(mobileDistance).toBeGreaterThan(desktopDistance);
  });

  it("enlarges desktop framing without sacrificing narrow mobile clearance", () => {
    expect(getLoveCameraFillFraction(1)).toBe(
      LOVE_SCENE_PRESENTATION.camera.desktopFillFraction
    );
    expect(getLoveCameraFillFraction(0.79)).toBe(
      LOVE_SCENE_PRESENTATION.camera.narrowFillFraction
    );
  });

  it("fits the camera to the fixed canvas display viewport, not its portal host", () => {
    expect(
      getLoveViewportSize({
        displayWidth: 1920,
        displayHeight: 900,
        fallbackWidth: 1920,
        fallbackHeight: 2400,
      })
    ).toEqual({ width: 1920, height: 900 });
    expect(
      getLoveViewportSize({
        displayWidth: 0,
        displayHeight: 0,
        fallbackWidth: 390,
        fallbackHeight: 844,
      })
    ).toEqual({ width: 390, height: 844 });
  });
});
