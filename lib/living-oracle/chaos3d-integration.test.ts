import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const layer = read("components/living-oracle/LivingOracleLayer.tsx");
const stage = read("components/living-oracle/chaos/Chaos3DStage.tsx");
const styles = read("app/styles/living-oracle.css");
const oracleEngine = read("components/OracleQR.tsx");

describe("Chaos 3D integration boundaries", () => {
  it("stays lazy and presentation-only outside the protected Oracle engine", () => {
    expect(layer).toContain('import("./chaos/Chaos3DStage")');
    expect(read("app/layout.tsx")).not.toMatch(/from ["']three/);
    expect(oracleEngine).not.toMatch(/Chaos3D|WebGLRenderer|from ["']three/);
    expect(stage).not.toMatch(/setAnswer|ORACLE_ANSWERS|setTimeout|Math\.random/);
  });

  it("loads one Rift GLB into one shared InstancedMesh", () => {
    expect(stage.match(/loadAsync\(CHAOS_3D_MANIFEST\.rift\)/g)).toHaveLength(1);
    expect(stage).toContain("new InstancedMesh(");
    expect(stage).toContain("CHAOS_FRAGMENT_DEFINITIONS.length");
    expect(stage).toMatch(/fragmentInstances!?\.setMatrixAt/);
  });

  it("uses runtime bounds and fixed-stage dimensions for camera fitting", () => {
    expect(stage).toContain("container.getBoundingClientRect()");
    expect(stage).toContain("new Box3().setFromObject(root)");
    expect(stage).toContain("container: stage");
    expect(stage).not.toContain("container: target");
    expect(stage).toContain("getChaosCameraDistance");
  });

  it("resets accumulated presentation state on authoritative Idle", () => {
    expect(stage).toContain('if (next === "idle")');
    expect(stage).toContain("coreSpin = 0");
    expect(stage).toContain("fragmentAngles[index] = definition.phase");
    expect(stage).toContain("phaseElapsed = 0");
  });

  it("keeps the static Chaos experience for every non-ready path", () => {
    expect(oracleEngine).toContain('src="/themes/chaos-crystal-ball.png"');
    expect(read("lib/living-oracle/chaos3d.ts")).toContain(
      'fallback: "/themes/chaos-crystal-ball.png"'
    );
    expect(layer).toContain('motion === "reduced"');
    expect(layer).toContain('setChaos3DStatus("error")');
    expect(styles).not.toContain(
      '.theme-chaos[data-chaos3d-status="loading"] > .chaos-crystal'
    );
  });

  it("adapts only ready Chaos into one persistent viewport chamber", () => {
    expect(styles).toMatch(/\.theme-chaos\[data-chaos3d-status="ready"\] \{[\s\S]*?position: fixed !important;[\s\S]*?height: 100dvh !important;[\s\S]*?overflow: hidden !important;/);
    expect(styles).toContain(
      'html:has(.theme-chaos[data-chaos3d-status="ready"]) body'
    );
    expect(styles).toContain(
      '.theme-chaos[data-chaos3d-status="ready"] > .chaos-crystal'
    );
    expect(styles).toContain(
      '.theme-chaos[data-chaos3d-status="ready"] > .result'
    );
    expect(styles).toContain(
      '.theme-chaos[data-chaos3d-status="ready"]:has(> .result) > .question'
    );
  });

  it("keeps the Canvas mounted through question and answer states", () => {
    expect(layer).toContain("target={chaosTarget}");
    expect(stage).toContain("return createPortal(");
    expect(stage).toContain('className="chaos-3d-stage"');
    expect(styles).toMatch(/\.theme-chaos\[data-chaos3d-status="ready"\] \.chaos-3d-stage \{[\s\S]*?opacity: 1;/);
  });

  it("prevents superseded async mounts from publishing readiness", () => {
    expect(stage).toContain("window.requestAnimationFrame");
    expect(stage).toContain("window.cancelAnimationFrame(frame)");
    expect(stage).toContain("isActive: () => active");
    expect(stage).toContain("if (disposed || !isActive()");
    expect(stage).toContain("if (active) onReady()");
    expect(stage).toContain("if (active) onError()");
  });
});
