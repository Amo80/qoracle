import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const layer = read("components/living-oracle/LivingOracleLayer.tsx");
const stage = read("components/living-oracle/dragon/Dragon3DStage.tsx");
const styles = read("app/styles/living-oracle.css");
const oracleEngine = read("components/OracleQR.tsx");

describe("Dragon 3D integration boundaries", () => {
  it("stays lazy, presentation-only, and outside OracleQR logic", () => {
    expect(layer).toContain('import("./dragon/Dragon3DStage")');
    expect(read("app/layout.tsx")).not.toMatch(/from ["']three/);
    expect(oracleEngine).not.toMatch(/Dragon3D|WebGLRenderer|from ["']three/);
    expect(stage).not.toMatch(/setAnswer|Math\.random|setTimeout|ORACLE_ANSWERS/);
  });

  it("keeps the static Dungeon presentation as every non-ready fallback", () => {
    expect(oracleEngine).toContain('src="/themes/DND.crystal.png"');
    expect(read("lib/living-oracle/dragon3d.ts")).toContain('fallback: "/themes/DND.crystal.png"');
    expect(layer).toContain('motion === "reduced"');
    expect(layer).toContain('setDragon3DStatus("error")');
    expect(styles).not.toContain('.theme-dnd[data-dragon3d-status="loading"] .dnd-stage');
  });

  it("adapts only the ready path into one fixed continuous chamber", () => {
    expect(styles).toMatch(/\.theme-dnd\[data-dragon3d-status="ready"\] \.dragon-3d-stage \{[\s\S]*?opacity: 1;/);
    expect(styles).toMatch(/\.theme-dnd\[data-dragon3d-status="ready"\] \.dnd-stage \{[\s\S]*?position: absolute !important;[\s\S]*?height: 100dvh !important;[\s\S]*?min-height: 0 !important;/);
    expect(styles).toMatch(/\.theme-dnd\[data-dragon3d-status="ready"\] \{[\s\S]*?position: fixed !important;[\s\S]*?height: 100dvh !important;[\s\S]*?overflow: hidden !important;/);
    expect(styles).toContain('html:has(.theme-dnd[data-dragon3d-status="ready"]) body');
    expect(styles).toContain(".dnd-question-box");
    expect(styles).toContain(".dnd-answer-card");
    expect(styles).toContain(".dnd-again-button");
  });

  it("keeps the fixed Dragon stage mounted behind question and answer states", () => {
    expect(layer).toContain("target={dragonTarget}");
    expect(stage).toContain("return createPortal(");
    expect(stage).toContain('className="dragon-3d-stage"');
    expect(styles).toMatch(/\.theme-dnd\[data-dragon3d-status="ready"\][\s\S]*?:is\(\.dnd-question-box, \.dnd-reveal-message, \.dnd-answer-card, \.dnd-again-button\)/);
    expect(styles).not.toMatch(/data-dragon3d-status="ready"[^}]*\.dnd-answer-card[^}]*display:\s*none/);
  });

  it("keeps Dragon, D20, and altar independent and loads the guardian first", () => {
    expect(stage).toContain("const dragonGroup = new Group()");
    expect(stage).toContain("const d20Group = new Group()");
    expect(stage).toContain("const altarGroup = new Group()");
    expect(stage.indexOf("await loader.loadAsync(DRAGON_3D_MANIFEST.model)")).toBeLessThan(
      stage.indexOf("loader.loadAsync(DRAGON_3D_MANIFEST.d20)")
    );
    expect(stage).toContain("disposeObject(dragon.scene)");
    expect(stage).toContain("disposeObject(d20.scene)");
    expect(stage).toContain("disposeObject(altar.scene)");
  });

  it("prevents superseded async mounts from publishing stale handoff state", () => {
    expect(stage).toContain("window.requestAnimationFrame");
    expect(stage).toContain("window.cancelAnimationFrame(frame)");
    expect(stage).toContain("isActive: () => active");
    expect(stage).toContain("if (disposed || !isActive())");
    expect(stage).toContain("onReady: () => { if (active) onReady(); }");
    expect(stage).toContain("onError: () => { if (active) onError(); }");
  });

  it("propagates the flag and preserves the production ready-state handoff", () => {
    expect(read("app/layout.tsx")).toContain("dragon3DEnabled={dragon3DEnabled}");
    expect(layer).toContain('setDragon3DStatus("ready")');
    expect(layer).toContain("onReady={handleDragonReady}");
    expect(stage).toContain("onReady();");
    expect(styles).toContain('.theme-dnd[data-dragon3d-status="ready"]');
  });

  it("uses only the ungated production manifests in the normal Dragon stage", () => {
    const manifest = read("lib/living-oracle/dragon3d.ts");
    expect(manifest).toContain('model: "/characters/dragon/v1/dragon.glb"');
    expect(manifest).toContain('d20: "/characters/dragon/v1/mystic-d20.glb"');
    expect(manifest).toContain('altar: "/characters/dragon/v1/arcane-altar.glb"');
    expect(stage).not.toMatch(/\/dev\/|method: "HEAD"/);
  });

  it("uses fixed-stage viewport bounds and runtime object bounds", () => {
    expect(stage).toContain("container.getBoundingClientRect()");
    expect(stage).toContain("new Box3().setFromObject(root)");
    expect(stage).toContain("container: stage");
    expect(stage).not.toContain("container: target");
    expect(stage).toContain("DRAGON_SCENE_PRESENTATION.camera.verticalTargetOffset");
  });

  it("preserves the qualified opaque D20 material and layers magic externally", () => {
    expect(stage).not.toMatch(/d20\.scene[\s\S]{0,500}emissive\.set/);
    expect(stage).not.toMatch(/transparent\s*=|opacity\s*=|AdditiveBlending|depthWrite\s*=/);
    expect(stage).toContain("const d20MagicLight = new PointLight(");
    expect(stage).toContain("d20MagicLight.intensity");
  });

  it("applies qualified offsets for one rendered frame and then restores them", () => {
    expect(stage.indexOf("getDragonPresentation(phase, phaseElapsed)")).toBeLessThan(
      stage.indexOf("renderer.render(scene, camera)")
    );
    expect(stage.indexOf("renderer.render(scene, camera)")).toBeLessThan(
      stage.indexOf("bones.get(name)!.quaternion.copy(quaternion)")
    );
    expect(stage).toContain("canvas.dataset.dragonPoseMagnitude");
  });
});
