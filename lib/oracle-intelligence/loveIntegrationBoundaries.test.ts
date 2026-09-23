import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isLoveIntelligencePreviewIntegrationEnabled } from "../experience/featureFlags";
import { LOVE_PREVIEW_PROVIDER_TIMEOUT_MS, ORACLE_INTELLIGENCE_TIMEOUT_MS } from "./timeout";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const canonicalSource = (path: string) =>
  read(path).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
const canonicalSha = (path: string) =>
  createHash("sha256").update(canonicalSource(path), "utf8").digest("hex");

describe("Love intelligence integration boundaries", () => {
  it("is Preview/development-only and requires Love-specific eligibility", () => {
    const common = { ORACLE_INTELLIGENCE_ENABLED: "true", ORACLE_INTELLIGENCE_LOVE_ENABLED: "true", ORACLE_INTELLIGENCE_ROLLOUT_PERCENT: "100", OPENAI_API_KEY: "configured" };
    expect(isLoveIntelligencePreviewIntegrationEnabled({ ...common, VERCEL_ENV: "production", NODE_ENV: "production" })).toBe(false);
    expect(isLoveIntelligencePreviewIntegrationEnabled({ ...common, VERCEL_ENV: "preview", NODE_ENV: "production" })).toBe(true);
    expect(isLoveIntelligencePreviewIntegrationEnabled({ ...common, VERCEL_ENV: "preview", ORACLE_INTELLIGENCE_LOVE_ENABLED: "false" })).toBe(false);
  });

  it("keeps normal timeout at 1,550 ms and Love Preview at 4,250 ms", () => {
    expect(ORACLE_INTELLIGENCE_TIMEOUT_MS).toBe(1550);
    expect(LOVE_PREVIEW_PROVIDER_TIMEOUT_MS).toBe(4250);
    expect(read("app/api/oracle/intelligence/route.ts")).not.toContain("lovePreviewMode");
    expect(read("app/api/oracle/intelligence/love-preview/route.ts")).toContain("lovePreviewMode: true");
  });

  it("keeps the Love route Love-only with no client timeout/model/reasoning controls", () => {
    const route = read("app/api/oracle/intelligence/love-preview/route.ts");
    expect(route).toContain('oracleId !== "love"');
    expect(route).not.toContain("searchParams");
    expect(route).not.toContain("reasoning");
    expect(route).not.toContain("timeoutMs:");
  });

  it("preserves the tested Jester route, coordinator, stage, personality, and rig mapping canonically", () => {
    expect(canonicalSha("app/api/oracle/intelligence/jester-preview/route.ts")).toBe("5e64da3b520b5abe1d68b6be37847c0f9ae3a75d4cdf03a0a5cd5ea0ab8320cc");
    expect(canonicalSha("lib/oracle-intelligence/jesterIntegration.ts")).toBe("58db180d23458162921c48b3f8c679794d1db9aa597a2db4e8473501096548b8");
    expect(canonicalSha("components/living-oracle/jester/Jester3DStage.tsx")).toBe("6d1c30554eddc0359e54ba07e6234773b9b3ffa4a3db50f6659074d8d6572f19");
    expect(canonicalSha("lib/oracle-intelligence/personalities/v1/jester.ts")).toBe("1f15121d38b48097651614a71492441ef9306e9546315f6613ae8c0144ff59da");
    expect(canonicalSha("lib/living-oracle/jester3d.ts")).toBe("25fb20aaf1564f28d3cdbc64cedd93664c08df8b641e3468707d51ba01405868");
  });

  it("keeps provider access out of the Eclipse stage", () => {
    for (const stage of ["eclipse/Eclipse3DStage.tsx"]) {
      expect(read(`components/living-oracle/${stage}`)).not.toMatch(/fetch\s*\(/);
    }
  });

  it("adds Love busy semantics, one polite announcement, and cancellation", () => {
    const oracle = read("components/OracleQR.tsx");
    expect(oracle).toContain('aria-busy={loveIntelligenceEnabled && busy ? "true" : undefined}');
    expect(oracle).toContain('abort("love-cycle-superseded")');
    expect(oracle).toContain('abort("love-oracle-unmounted")');
    expect(oracle).toContain("The Oracle is considering your question.");
  });
});
