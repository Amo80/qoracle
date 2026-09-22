import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Eclipse 3D integration boundaries", () => {
  const layer = read("components/living-oracle/LivingOracleLayer.tsx");
  const stage = read("components/living-oracle/eclipse/Eclipse3DStage.tsx");
  const styles = read("app/styles/living-oracle.css");
  const oracle = read("components/OracleQR.tsx");

  it("is lazy and presentation-only", () => {
    expect(layer).toContain('import("./eclipse/Eclipse3DStage")');
    expect(stage).not.toMatch(/setAnswer|ORACLE_ANSWERS|setTimeout|Math\.random/);
    expect(oracle).not.toMatch(/Eclipse3D|WebGLRenderer|from ["']three/);
  });
  it("keeps every non-ready path on the static Eclipse", () => {
    expect(oracle).toContain('src="/themes/eclipse-crystal.png"');
    expect(layer).toContain('setEclipse3DStatus("error")');
    expect(styles).not.toContain('.theme-eclipse[data-eclipse3d-status="loading"] .eclipse-stage');
  });
  it("uses one persistent ready-only viewport chamber", () => {
    expect(styles).toMatch(/\.theme-eclipse\[data-eclipse3d-status="ready"\] \{[\s\S]*?position: fixed !important;[\s\S]*?height: 100dvh !important;[\s\S]*?overflow: hidden !important;/);
    expect(styles).toContain('html:has(.theme-eclipse[data-eclipse3d-status="ready"]) body');
    expect(styles).toMatch(/\.theme-eclipse\[data-eclipse3d-status="ready"\] \.eclipse-stage \{[\s\S]*?position: absolute !important;[\s\S]*?height: 100dvh !important;/);
    expect(styles).toContain('.theme-eclipse[data-eclipse3d-status="ready"] .eclipse-answer-card');
  });
  it("uses the active skin, restpose, fixed-stage dimensions, and post-render restoration", () => {
    expect(stage).toContain("activeMesh.skeleton.bones.length !== 28");
    expect(stage).toContain("container.getBoundingClientRect()");
    expect(stage).toContain("renderer.render(scene,camera)");
    expect(stage).toMatch(/renderer\.render\(scene,camera\);bones\.forEach/);
    expect(stage).toContain("ECLIPSE_3D_MANIFEST.neutralClip");
  });
  it("anchors separate bodies to qualified hands and structures the climax corona", () => {
    expect(stage).toContain('bones.get("mixamorig:LeftHand")!.getWorldPosition');
    expect(stage).toContain('bones.get("mixamorig:RightHand")!.getWorldPosition');
    expect(stage).toContain("content.worldToLocal");
    expect(stage).toContain("getEclipseViewportProfile(stageAspect,phase)");
    expect(stage).toContain("ECLIPSE_CAMERA_FRAMING.narrow");
    expect(stage).toContain("ECLIPSE_CAMERA_FRAMING.desktop");
    expect(stage).toContain("const sharpCorona = new Group()");
    expect(stage).toContain("const prominences = new Group()");
    expect(stage).toContain("new RingGeometry(.37,.405,128)");
    expect(stage).toContain("const sunAnchor=rightHandAnchor.clone().lerp(celestialCenter,convergence)");
    expect(stage).toContain("const moonAnchor=leftHandAnchor.clone().lerp(celestialCenter,convergence)");
  });
  it("disposes partial and superseded initialization without leaking GPU or observer state", () => {
    expect(stage).toContain("Promise.allSettled");
    expect(stage).toContain("const cleanup = () =>");
    expect(stage).toContain("if (cleaned) return");
    expect(stage).toContain("mixer?.stopAllAction()");
    expect(stage).toContain("observer?.disconnect()");
    expect(stage).toContain('canvas.removeEventListener("webglcontextlost", contextLost)');
    expect(stage).toContain("loadedRoots.forEach");
    expect(stage).toContain("registerCleanup(cleanup)");
    expect(stage).toContain("pendingCleanup?.()");
    expect(stage).toContain("if (cleaned) disposeObject(result.value.scene)");
    expect(stage).toMatch(/if \(disposed \|\| !isActive\(\)\) throw new Error\("Eclipse initialization superseded\."\)/);
    expect(stage).toMatch(/catch \(error\) \{\s*cleanup\(\);\s*throw error;/);
  });
});
