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

  it("does not wire intelligence into any Living Oracle stage", () => {
    for (const file of ["jester/Jester3DStage.tsx", "love/Love3DStage.tsx", "dragon/Dragon3DStage.tsx", "chaos/Chaos3DStage.tsx", "eclipse/Eclipse3DStage.tsx"]) {
      const source = readFileSync(join(process.cwd(), "components/living-oracle", file), "utf8");
      expect(source).not.toContain("oracle-intelligence");
      expect(source).not.toContain("resolvePerformanceDirection");
    }
  });
});
