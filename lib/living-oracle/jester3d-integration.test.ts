import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const layer = read("components/living-oracle/LivingOracleLayer.tsx");
const stage = read("components/living-oracle/jester/Jester3DStage.tsx");
const oracleEngine = read("components/OracleQR.tsx");

describe("Jester 3D integration boundaries", () => {
  it("does not enter the global layout or protected Oracle engine", () => {
    expect(read("app/layout.tsx")).not.toMatch(/from ["']three/);
    expect(oracleEngine).not.toMatch(/Jester3D|WebGLRenderer|from ["']three/);
    expect(layer).toContain('import("./jester/Jester3DStage")');
  });

  it("keeps the canonical poster through loading, reduced motion, and failure", () => {
    expect(oracleEngine).toContain('src="/themes/jester-oracle.png"');
    expect(read("lib/living-oracle/jester3d.ts")).toContain(
      'fallback: "/themes/jester-oracle.png"'
    );
    expect(layer).toContain('motion === "reduced"');
    expect(layer).toContain('setJester3DStatus("error")');
    expect(read("app/styles/living-oracle.css")).toContain(
      '[data-jester3d-status="ready"] .jester-character'
    );
  });

  it("keeps answer timing authoritative outside the renderer", () => {
    expect(stage).not.toContain("ORACLE_ANSWERS");
    expect(stage).not.toMatch(/setAnswer|Math\.random|setTimeout/);
    expect(stage).toContain("currentAction.crossFadeTo");
    expect(stage).toContain("setPhase");
  });

  it("keeps the ball independent and tears down rendering", () => {
    expect(stage).toContain("const ballGroup = new Group()");
    expect(stage).toContain("ballGroup.add(ball.scene)");
    expect(stage).toContain("renderer.setAnimationLoop(null)");
    expect(stage).toContain("renderer.dispose()");
  });

  it("suppresses legacy shake only after the Jester 3D handoff", () => {
    const styles = read("app/styles/living-oracle.css");
    expect(styles).toContain(
      '.jester-crystal[data-jester3d-status="ready"].shaking'
    );
    expect(styles).not.toContain(
      '.jester-crystal[data-jester3d-status="loading"].shaking'
    );
  });

  it("prefetches Heart during speaking without controlling lifecycle time", () => {
    expect(stage).toContain('phase === "speaking"');
    expect(stage).toContain("positiveReaction.name");
    expect(stage).not.toMatch(/setTimeout|REACTION_COMPLETE|RETURN_COMPLETE/);
  });

  it("suppresses deferred clip rejection callbacks after disposal", () => {
    expect(stage).toContain("const reportActiveError = () =>");
    expect(stage).toContain("if (!disposed) onError()");
    expect(stage).toContain(".catch(reportActiveError)");
    expect(stage).not.toContain("void playPhase(phase).catch(onError)");
  });
});
