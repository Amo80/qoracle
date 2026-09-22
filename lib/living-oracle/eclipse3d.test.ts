import { describe, expect, it } from "vitest";
import { ECLIPSE_CAMERA_FRAMING, ECLIPSE_PROCEDURAL_BONES, getEclipseCelestialPresentation, getEclipsePose, getEclipseViewportProfile, shouldLoadEclipse3D } from "./eclipse3d";

describe("Eclipse 3D presentation contract", () => {
  it("loads only for the eligible full-motion Eclipse", () => {
    const eligible = { oracleId: "eclipse" as const, livingOracleEnabled: true, eclipse3DEnabled: true, motion: "full" as const, webGLSupported: true };
    expect(shouldLoadEclipse3D(eligible)).toBe(true);
    expect(shouldLoadEclipse3D({ ...eligible, oracleId: "love" })).toBe(false);
    expect(shouldLoadEclipse3D({ ...eligible, eclipse3DEnabled: false })).toBe(false);
    expect(shouldLoadEclipse3D({ ...eligible, motion: "reduced" })).toBe(false);
    expect(shouldLoadEclipse3D({ ...eligible, webGLSupported: false })).toBe(false);
  });

  it("uses exactly the 13 qualified upper-body joints", () => {
    expect(ECLIPSE_PROCEDURAL_BONES).toHaveLength(13);
    expect(ECLIPSE_PROCEDURAL_BONES.join(" ")).not.toMatch(/Hips|Leg|Foot|Toe|headfront|Middle4/);
  });

  it("creates a deterministic dominant camera-space eclipse and exact reset", () => {
    expect(getEclipseCelestialPresentation("speaking", .9)).toEqual(getEclipseCelestialPresentation("speaking", .9));
    const climax = getEclipseCelestialPresentation("speaking", .9);
    expect(climax.sunX).toBeCloseTo(climax.moonX);
    expect(climax.moonZ).toBeGreaterThan(climax.sunZ);
    expect(climax.scale).toBeGreaterThan(1.5);
    expect(getEclipseCelestialPresentation("idle", 0)).toEqual(getEclipseCelestialPresentation("idle", 0));
    expect(getEclipsePose("idle", 0)).toEqual(getEclipsePose("idle", 0));
  });

  it("separates mobile orbit sizing from the dominant total-eclipse scale", () => {
    const idle = getEclipseViewportProfile(400 / 642, "idle");
    const climax = getEclipseViewportProfile(400 / 642, "speaking");
    expect(idle.narrow).toBe(true);
    expect(idle.separateScale).toBeLessThan(0.7);
    expect(idle.separateOrbit).toBeLessThan(0.65);
    expect(climax.climaxScale).toBeGreaterThan(idle.separateScale);
    expect(getEclipseViewportProfile(16 / 9, "idle")).toMatchObject({
      narrow: false,
      separateScale: 1,
      separateOrbit: 1,
    });
  });

  it("pulls the complete scene back while compensating the eclipse climax", () => {
    expect(ECLIPSE_CAMERA_FRAMING.desktop.distance).toBeGreaterThan(7);
    expect(ECLIPSE_CAMERA_FRAMING.narrow.distance).toBeGreaterThan(6);
    expect(ECLIPSE_CAMERA_FRAMING.desktop.targetY).toBeGreaterThan(0);
    expect(ECLIPSE_CAMERA_FRAMING.narrow.targetY).toBeGreaterThan(0.25);
    expect(getEclipseViewportProfile(16 / 9, "speaking").climaxScale).toBeGreaterThan(1.1);
    expect(getEclipseViewportProfile(400 / 642, "speaking").climaxScale).toBeGreaterThan(1);
  });
});
