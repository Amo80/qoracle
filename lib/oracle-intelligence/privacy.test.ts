import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Oracle Intelligence privacy and production isolation", () => {
  it("keeps provider secrets server-only and OracleQR disconnected", () => {
    const env = readFileSync(join(process.cwd(), ".env.example"), "utf8");
    const oracle = readFileSync(join(process.cwd(), "components/OracleQR.tsx"), "utf8");
    expect(env).toContain("OPENAI_API_KEY=");
    expect(env).not.toContain("NEXT_PUBLIC_OPENAI");
    expect(oracle).not.toContain("/api/oracle/intelligence");
    expect(oracle).not.toContain("OPENAI_API_KEY");
  });

  it("keeps provider access out of integrated stages and intelligence out of remaining stages", () => {
    const jester = readFileSync(join(process.cwd(), "components/living-oracle/jester/Jester3DStage.tsx"), "utf8");
    expect(jester).not.toContain("/api/oracle/intelligence");
    expect(jester).not.toContain("OPENAI_API_KEY");
    expect(jester).not.toContain("fetch(");
    const love = readFileSync(join(process.cwd(), "components/living-oracle/love/Love3DStage.tsx"), "utf8");
    expect(love).not.toContain("/api/oracle/intelligence");
    expect(love).not.toContain("OPENAI_API_KEY");
    expect(love).not.toContain("fetch(");
    const dungeon = readFileSync(join(process.cwd(), "components/living-oracle/dragon/Dragon3DStage.tsx"), "utf8");
    expect(dungeon).not.toContain("/api/oracle/intelligence");
    expect(dungeon).not.toContain("OPENAI_API_KEY");
    expect(dungeon).not.toContain("fetch(");
    for (const file of ["chaos/Chaos3DStage.tsx", "eclipse/Eclipse3DStage.tsx"]) {
      const source = readFileSync(join(process.cwd(), "components/living-oracle", file), "utf8");
      expect(source).not.toContain("oracle-intelligence");
      expect(source).not.toContain("resolvePerformanceDirection");
    }
  });
});
