import { describe, expect, it } from "vitest";
import {
  DRAGON_3D_MANIFEST,
  DRAGON_PROCEDURAL_ALLOWLIST,
  DRAGON_SCENE_PRESENTATION,
  DUNGEON_MAGIC_LIGHTING,
  DUNGEON_D20_PRESENTATION,
  getDragonPoseMagnitude,
  getDragonPresentation,
  applyDungeonIntelligencePresentation,
  getDragonCameraFillFraction,
  getDragonCameraDistance,
  shouldLoadDragon3D,
} from "./dragon3d";

describe("Dragon 3D presentation contract", () => {
  it("keeps all scene objects independent and versioned", () => {
    const paths = [DRAGON_3D_MANIFEST.model, DRAGON_3D_MANIFEST.d20, DRAGON_3D_MANIFEST.altar];
    expect(new Set(paths).size).toBe(3);
    expect(paths.every((path) => path.startsWith("/characters/dragon/v1/"))).toBe(true);
    expect(DRAGON_3D_MANIFEST.fallback).toBe("/themes/DND.crystal.png");
    expect(DRAGON_3D_MANIFEST.loadingOrder).toEqual(["model", "d20-and-altar"]);
  });

  it("loads only for eligible full-motion internal dnd sessions", () => {
    const eligible = { oracleId: "dnd" as const, livingOracleEnabled: true, dragon3DEnabled: true, motion: "full" as const, webGLSupported: true };
    expect(shouldLoadDragon3D(eligible)).toBe(true);
    expect(shouldLoadDragon3D({ ...eligible, oracleId: "love" })).toBe(false);
    expect(shouldLoadDragon3D({ ...eligible, dragon3DEnabled: false })).toBe(false);
    expect(shouldLoadDragon3D({ ...eligible, motion: "reduced" })).toBe(false);
    expect(shouldLoadDragon3D({ ...eligible, webGLSupported: false })).toBe(false);
  });

  it("uses exactly the visually qualified 24-joint allowlist", () => {
    expect(DRAGON_PROCEDURAL_ALLOWLIST).toHaveLength(24);
    expect(new Set(DRAGON_PROCEDURAL_ALLOWLIST).size).toBe(24);
    expect(DRAGON_PROCEDURAL_ALLOWLIST).not.toEqual(expect.arrayContaining([
      "Bone_000", "Bone_001", "Bone_015", "Bone_021", "Bone_041", "Bone_047", "Bone_053", "Bone_068",
    ]));
  });

  it("keeps qualified procedural movement conservative and visible", () => {
    for (const phase of ["idle", "listening", "awakening", "anticipating", "speaking", "reacting", "returning"] as const) {
      const presentation = getDragonPresentation(phase, 0.3);
      for (const offset of presentation.bones.values()) {
        expect(Math.max(Math.abs(offset.x), Math.abs(offset.y), Math.abs(offset.z))).toBeLessThanOrEqual(5 * Math.PI / 180);
      }
      expect(getDragonPoseMagnitude(presentation), phase).toBeGreaterThan(0);
    }
  });

  it("defines deterministic D20 idle, spin, and reveal orientations", () => {
    expect(DUNGEON_D20_PRESENTATION.spinAxis).toEqual({ x: 0.18, y: 0.96, z: 0.22 });
    expect(DUNGEON_D20_PRESENTATION.idleEuler).not.toEqual(DUNGEON_D20_PRESENTATION.revealEuler);
    expect(DUNGEON_D20_PRESENTATION.speakingRadiansPerSecond).toBeGreaterThan(
      DUNGEON_D20_PRESENTATION.anticipatingRadiansPerSecond
    );
  });

  it("centers the altar and D20 on the Dungeon chamber axis", () => {
    expect(DRAGON_SCENE_PRESENTATION.altar.centerX).toBe(0);
    expect(DRAGON_SCENE_PRESENTATION.d20.centerX).toBe(
      DRAGON_SCENE_PRESENTATION.altar.centerX
    );
    expect(DRAGON_SCENE_PRESENTATION.dragon.centerX).toBe(0);
    expect(DRAGON_SCENE_PRESENTATION.d20.width).toBeLessThan(
      DRAGON_SCENE_PRESENTATION.dragon.height / 4
    );
    expect(DRAGON_SCENE_PRESENTATION.d20.centerZ).toBeGreaterThan(
      DRAGON_SCENE_PRESENTATION.dragon.centerZ
    );
  });

  it("brings the Dragon closer only across the approved mobile widths", () => {
    for (const width of [375, 390, 400, 430]) {
      expect(getDragonCameraFillFraction({ width, aspect: width / 844 })).toBe(0.83);
    }
    expect(getDragonCameraFillFraction({ width: 431, aspect: 431 / 844 })).toBe(0.68);
    expect(getDragonCameraFillFraction({ width: 1024, aspect: 16 / 9 })).toBe(0.76);

    const mobileDistance = getDragonCameraDistance({ width: 400, height: 642, aspect: 400 / 642 });
    const priorMobileDistance = 642 / 2 / (Math.tan(34 * Math.PI / 360) * 0.68);
    expect(priorMobileDistance / mobileDistance).toBeCloseTo(0.83 / 0.68, 5);
  });

  it("uses restrained external magic lighting", () => {
    expect(DUNGEON_MAGIC_LIGHTING.d20.idleScale).toBeLessThanOrEqual(0.25);
    expect(DUNGEON_MAGIC_LIGHTING.altar.idleScale).toBeLessThanOrEqual(0.2);
  });

  it("maps trusted Dungeon cues only through bounded qualified channels", () => {
    const base = getDragonPresentation("speaking", 0.3);
    const directed = applyDungeonIntelligencePresentation(base, "speaking", {
      oracleId: "dnd",
      emotion: "triumphant",
      intensity: 3,
      delivery: "mythic",
      gesture: "wing_root_emphasis",
      reveal: "dramatic",
      reaction: "powerful",
      environment: "d20_high",
    });
    expect([...directed.bones.keys()].every((bone) => DRAGON_PROCEDURAL_ALLOWLIST.includes(bone))).toBe(true);
    expect(getDragonPoseMagnitude(directed)).toBeGreaterThan(getDragonPoseMagnitude(base));
    expect(getDragonPoseMagnitude(directed)).toBeLessThanOrEqual(6 * Math.PI / 180);
    expect(directed.d20Glow).toBeGreaterThan(base.d20Glow);
    expect(directed.d20Speed).toBeLessThanOrEqual(4.8);
  });

  it("keeps sensitive guardian presentation restrained and deterministic", () => {
    const base = getDragonPresentation("reacting", 0.3);
    const cue = {
      oracleId: "dnd" as const,
      emotion: "watchful" as const,
      intensity: 1 as const,
      delivery: "measured" as const,
      gesture: "guardian_focus" as const,
      reveal: "subtle" as const,
      reaction: "restrained" as const,
      environment: "altar_low" as const,
    };
    const first = applyDungeonIntelligencePresentation(base, "reacting", cue);
    const second = applyDungeonIntelligencePresentation(base, "reacting", cue);
    expect(first).toEqual(second);
    expect(getDragonPoseMagnitude(first)).toBeLessThan(getDragonPoseMagnitude(base));
    expect(first.altarGlow).toBeLessThan(base.altarGlow);
  });

  it("returns the exact production presentation when intelligence is absent", () => {
    const base = getDragonPresentation("anticipating", 0.3);
    expect(applyDungeonIntelligencePresentation(base, "anticipating", null)).toBe(base);
  });
});
