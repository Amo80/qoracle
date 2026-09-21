import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const layer = read("components/living-oracle/LivingOracleLayer.tsx");
const stage = read("components/living-oracle/love/Love3DStage.tsx");
const oracleEngine = read("components/OracleQR.tsx");

describe("Love 3D integration boundaries", () => {
  it("stays lazy, client-only, and outside the protected Oracle engine", () => {
    expect(read("app/layout.tsx")).not.toMatch(/from ["']three/);
    expect(oracleEngine).not.toMatch(/Love3D|WebGLRenderer|from ["']three/);
    expect(layer).toContain('import("./love/Love3DStage")');
  });

  it("preserves the canonical poster for loading, reduced motion, and failure", () => {
    expect(oracleEngine).toContain('src="/themes/love-crystal-ball.png"');
    expect(read("lib/living-oracle/love3d.ts")).toContain('fallback: "/themes/love-crystal-ball.png"');
    expect(layer).toContain('motion === "reduced"');
    expect(layer).toContain('setLove3DStatus("error")');
    expect(read("app/styles/living-oracle.css")).toContain('.theme-love[data-love3d-status="ready"] .love-crystal-ball-image');
  });

  it("adapts only the ready 3D path into a continuous Love chamber", () => {
    const styles = read("app/styles/living-oracle.css");
    expect(styles).toContain('.theme-love[data-love3d-status="ready"] .love-stage');
    expect(styles).toContain('height: 100dvh');
    expect(styles).toMatch(/\.theme-love\[data-love3d-status="ready"\] \.love-3d-stage \{[\s\S]*?position: fixed;[\s\S]*?height: 100dvh;/);
    expect(styles).toMatch(/\.theme-love\[data-love3d-status="ready"\] \.love-stage \{[\s\S]*?position: absolute;[\s\S]*?inset: 0;/);
    expect(styles).toMatch(/\.theme-love\[data-love3d-status="ready"\] \{[\s\S]*?overflow: hidden;/);
    expect(styles).toContain(".love-stage-one");
    expect(styles).toContain(".love-stage-three");
    expect(styles).not.toContain('.theme-love[data-love3d-status="loading"] .love-stage');
    expect(styles).not.toContain('.theme-love[data-love3d-status="error"] .love-stage');
    expect(oracleEngine).toContain("love-stage-one");
    expect(oracleEngine).toContain("love-stage-two");
    expect(oracleEngine).toContain("love-stage-three");
  });

  it("keeps lifecycle and answer timing outside the renderer", () => {
    expect(stage).not.toContain("ORACLE_ANSWERS");
    expect(stage).not.toMatch(/setAnswer|Math\.random|setTimeout|REACTION_COMPLETE|RETURN_COMPLETE/);
    expect(stage).toContain("setPhase(next)");
    expect(stage).toContain("mixer.clipAction(idle");
  });

  it("keeps character, heart, and podium independent and disposes all", () => {
    expect(stage).toContain("const characterGroup = new Group()");
    expect(stage).toContain("const heartGroup = new Group()");
    expect(stage).toContain("const podiumGroup = new Group()");
    expect(stage).toContain("disposeObject(heart.scene)");
    expect(stage).toContain("disposeObject(podium.scene)");
  });

  it("sizes projection from the fixed stage rather than the page portal", () => {
    expect(stage).toContain("container.getBoundingClientRect()");
    expect(stage).toContain("container: stage");
    expect(stage).not.toContain("container: target");
  });

  it("applies procedural offsets temporarily without root, hips, legs, face, or fingers", () => {
    expect(stage.indexOf("mixer.update(delta)")).toBeLessThan(stage.indexOf("getLoveProceduralPose(phase, phaseElapsed)"));
    expect(stage.indexOf("getLoveProceduralPose(phase, phaseElapsed)")).toBeLessThan(stage.indexOf("renderer.render(scene, camera)"));
    expect(stage.indexOf("renderer.render(scene, camera)")).toBeLessThan(stage.indexOf("bones.get(name)!.quaternion.copy(quaternion)"));
    expect(stage).toContain("saved.get(name)!.copy(bone.quaternion)");
    expect(stage).toContain("bones.get(name)!.quaternion.copy(quaternion)");
    expect(stage).toContain("canvas.dataset.lovePoseMagnitude");
    const approvedBones = stage.slice(
      stage.indexOf("const boneChannels"),
      stage.indexOf("async function createController")
    );
    expect(approvedBones).not.toMatch(/Hips|UpperLeg|Foot|Finger|Eye|Mouth/);
  });
});
