import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isJesterIntelligencePreviewIntegrationEnabled } from "../experience/featureFlags";
import { JESTER_PREVIEW_PROVIDER_TIMEOUT_MS, ORACLE_INTELLIGENCE_TIMEOUT_MS } from "./timeout";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Jester intelligence integration boundaries", () => {
  it("keeps Production and invalid configuration ineligible", () => {
    const common = {
      ORACLE_INTELLIGENCE_ENABLED: "true",
      ORACLE_INTELLIGENCE_JESTER_ENABLED: "true",
      ORACLE_INTELLIGENCE_ROLLOUT_PERCENT: "100",
      OPENAI_API_KEY: "configured",
    };
    expect(isJesterIntelligencePreviewIntegrationEnabled({ ...common, VERCEL_ENV: "production", NODE_ENV: "production" })).toBe(false);
    expect(isJesterIntelligencePreviewIntegrationEnabled({ ...common, VERCEL_ENV: "preview", NODE_ENV: "production" })).toBe(true);
    expect(isJesterIntelligencePreviewIntegrationEnabled({ ...common, VERCEL_ENV: "preview", OPENAI_API_KEY: "" })).toBe(false);
  });

  it("keeps the normal route at 1,550 ms and bounds Preview below the client deadline", () => {
    expect(ORACLE_INTELLIGENCE_TIMEOUT_MS).toBe(1550);
    expect(JESTER_PREVIEW_PROVIDER_TIMEOUT_MS).toBe(4250);
    expect(JESTER_PREVIEW_PROVIDER_TIMEOUT_MS).toBeLessThan(4500);
    expect(read("app/api/oracle/intelligence/route.ts")).not.toContain("jesterPreviewMode");
    expect(read("app/api/oracle/intelligence/jester-preview/route.ts")).toContain("jesterPreviewMode: true");
  });

  it("does not accept client timeout, profile, model, or reasoning controls", () => {
    const route = read("app/api/oracle/intelligence/jester-preview/route.ts");
    expect(route).not.toContain("searchParams");
    expect(route).not.toContain("reasoning");
    expect(route).not.toContain("timeoutMs:");
    expect(route).toContain("createOpenAICompactProviderFromEnvironment()");
  });

  it("keeps the remaining unintegrated Oracles and protected systems outside the integration", () => {
    const oracle = read("components/OracleQR.tsx");
    expect(oracle).toContain('activeTheme === "jester" && jesterIntelligenceEnabled');
    for (const stage of ["chaos/Chaos3DStage.tsx", "eclipse/Eclipse3DStage.tsx"]) {
      expect(read(`components/living-oracle/${stage}`)).not.toContain("oracle-intelligence");
    }
  });

  it("preserves busy semantics, one polite status, focus protection, and cancellation", () => {
    const oracle = read("components/OracleQR.tsx");
    expect(oracle).toContain('aria-busy={jesterIntelligenceEnabled && busy ? "true" : undefined}');
    expect(oracle).toContain("The Oracle is considering your question.");
    expect(oracle).toContain('aria-live="polite"');
    expect(oracle).toContain("focusWithoutViewportScroll(answerRegionRef.current)");
    expect(oracle).toContain('abort("jester-cycle-superseded")');
    expect(oracle).toContain('abort("jester-oracle-unmounted")');
  });
});
