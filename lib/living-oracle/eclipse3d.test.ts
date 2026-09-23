import { describe, expect, it } from "vitest";
import { ECLIPSE_CAMERA_FRAMING, ECLIPSE_CELESTIAL_SIDES, ECLIPSE_PROCEDURAL_BONES, applyEclipseIntelligencePose, applyEclipseIntelligencePresentation, getEclipseCelestialPresentation, getEclipsePose, getEclipseViewportProfile, shouldLoadEclipse3D } from "./eclipse3d";
import { ORACLE_PERFORMANCE_VOCABULARIES } from "../oracle-intelligence/vocabularies";
import type { EclipsePresentation } from "../oracle-intelligence/types";

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

  it.each([
    ["desktop", 16 / 9],
    ["mobile", 400 / 642],
  ] as const)("keeps the Sun on gold and Moon on violet in %s idle", (_name, aspect) => {
    const profile = getEclipseViewportProfile(aspect, "idle");
    const idle = getEclipseCelestialPresentation("idle", 0);
    expect(ECLIPSE_CELESTIAL_SIDES).toEqual({
      sun: "right-hand-gold",
      moon: "left-hand-violet",
    });
    expect(idle.sunX).toBeGreaterThan(0);
    expect(idle.moonX).toBeLessThan(0);
    expect(profile.separateOrbit).toBeGreaterThan(0);
  });

  it("returns exactly to corrected sides without accumulating across cycles", () => {
    const idle = getEclipseCelestialPresentation("idle", 0);
    const returned = getEclipseCelestialPresentation("returning", 0.45);
    expect(returned).toMatchObject({
      sunX: idle.sunX,
      moonX: idle.moonX,
      sunY: idle.sunY,
      moonY: idle.moonY,
      sunZ: idle.sunZ,
      moonZ: idle.moonZ,
      scale: idle.scale,
    });
    expect(getEclipseCelestialPresentation("idle", 0)).toEqual(idle);
    expect(getEclipseCelestialPresentation("returning", 0.45)).toEqual(returned);
  });

  it("converges deterministically with the Moon still in front of the Sun", () => {
    const first = getEclipseCelestialPresentation("speaking", 0.9);
    const repeated = getEclipseCelestialPresentation("speaking", 0.9);
    expect(first).toEqual(repeated);
    expect(first.sunX).toBeCloseTo(0);
    expect(first.moonX).toBeCloseTo(0);
    expect(first.moonZ).toBeGreaterThan(first.sunZ);
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

  it("keeps celestial sides, convergence geometry, scale, and camera ordering invariant for every trusted cue", () => {
    const vocabulary = ORACLE_PERFORMANCE_VOCABULARIES.eclipse;
    for (const phase of ["idle", "speaking", "reacting", "returning"] as const) {
      const elapsed = phase === "returning" ? .45 : .9;
      const base = getEclipseCelestialPresentation(phase, elapsed);
      for (const emotion of vocabulary.emotions) for (const delivery of vocabulary.deliveries) for (const gesture of vocabulary.gestures) for (const reaction of vocabulary.reactions) for (const environment of vocabulary.environments) for (const intensity of [1, 2, 3] as const) for (const reveal of ["subtle", "standard", "dramatic"] as const) {
        const semantic: EclipsePresentation = { oracleId: "eclipse", emotion, delivery, gesture, reaction, environment, intensity, reveal };
        const directed = applyEclipseIntelligencePresentation(base, phase, semantic);
        expect({ sunX: directed.sunX, moonX: directed.moonX, sunY: directed.sunY, moonY: directed.moonY, sunZ: directed.sunZ, moonZ: directed.moonZ, scale: directed.scale, orbit: directed.orbit }).toEqual({ sunX: base.sunX, moonX: base.moonX, sunY: base.sunY, moonY: base.moonY, sunZ: base.sunZ, moonZ: base.moonZ, scale: base.scale, orbit: base.orbit });
        if (phase === "idle" || phase === "returning") { expect(directed.sunX).toBeGreaterThan(0); expect(directed.moonX).toBeLessThan(0); }
        if (phase === "speaking" || phase === "reacting") expect(directed.moonZ).toBeGreaterThan(directed.sunZ);
      }
    }
  });

  it("keeps semantic pose changes deterministic and within the qualified 13-bone ceiling", () => {
    const semantic: EclipsePresentation = { oracleId: "eclipse", emotion: "resolute", intensity: 3, delivery: "dual", gesture: "eclipse_presentation", reveal: "dramatic", reaction: "strong", environment: "corona_strong" };
    const base = getEclipsePose("speaking", .4); const first = applyEclipseIntelligencePose(base, semantic);
    expect(first).toEqual(applyEclipseIntelligencePose(base, semantic));
    expect(Object.keys(first).every((bone) => (ECLIPSE_PROCEDURAL_BONES as readonly string[]).includes(bone))).toBe(true);
    for (const offset of Object.values(first)) for (const rotation of [offset.x, offset.y, offset.z]) expect(Math.abs(rotation)).toBeLessThanOrEqual(11.5 * Math.PI / 180 + 1e-10);
  });
});
