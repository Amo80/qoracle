import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isDungeonIntelligencePreviewIntegrationEnabled } from "../experience/featureFlags";
import { DUNGEON_PREVIEW_PROVIDER_TIMEOUT_MS, ORACLE_INTELLIGENCE_TIMEOUT_MS } from "./timeout";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const canonicalSha = (path: string) => createHash("sha256")
  .update(read(path).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n"), "utf8")
  .digest("hex");

const approvedFiles = {
  "app/api/oracle/intelligence/jester-preview/route.ts": "5e64da3b520b5abe1d68b6be37847c0f9ae3a75d4cdf03a0a5cd5ea0ab8320cc",
  "lib/oracle-intelligence/jesterIntegration.ts": "4a5d775c9aea1a4d49c93f94cdfca4ba68162a5fce34d0a4a67073ed9bc1a010",
  "components/living-oracle/jester/Jester3DStage.tsx": "6d1c30554eddc0359e54ba07e6234773b9b3ffa4a3db50f6659074d8d6572f19",
  "lib/oracle-intelligence/personalities/v1/jester.ts": "1f15121d38b48097651614a71492441ef9306e9546315f6613ae8c0144ff59da",
  "lib/living-oracle/jester3d.ts": "25fb20aaf1564f28d3cdbc64cedd93664c08df8b641e3468707d51ba01405868",
  "app/api/oracle/intelligence/love-preview/route.ts": "c413590256e24f8953483ad1217c3e468a876e22b398b55408df367f47952e62",
  "lib/oracle-intelligence/loveIntegration.ts": "a45615f1580f378490835997ed5ac68a515f45324c1bbbb6e93ff59215ab2c9a",
  "components/living-oracle/love/Love3DStage.tsx": "aafd6aa6bf748339eb54305f5e99de55becf1f7dad8716db506dcc713b3e7844",
  "lib/oracle-intelligence/personalities/v1/love.ts": "f9d30c94675548d9cebed0299584ad17998614bacd1690720d5c2450d2d8d283",
  "lib/living-oracle/love3d.ts": "8e6f450a665f37b137bdec9966d60be772e8c4ab90454927aa9d32f30cf64cf9",
} as const;

describe("Dungeon intelligence integration boundaries", () => {
  it("is Preview/development-only and requires Dungeon-specific eligibility", () => {
    const common = { ORACLE_INTELLIGENCE_ENABLED: "true", ORACLE_INTELLIGENCE_DUNGEON_ENABLED: "true", ORACLE_INTELLIGENCE_ROLLOUT_PERCENT: "100", OPENAI_API_KEY: "configured" };
    expect(isDungeonIntelligencePreviewIntegrationEnabled({ ...common, VERCEL_ENV: "production", NODE_ENV: "production" })).toBe(false);
    expect(isDungeonIntelligencePreviewIntegrationEnabled({ ...common, VERCEL_ENV: "preview", NODE_ENV: "production" })).toBe(true);
    expect(isDungeonIntelligencePreviewIntegrationEnabled({ ...common, VERCEL_ENV: "preview", ORACLE_INTELLIGENCE_DUNGEON_ENABLED: "false" })).toBe(false);
  });

  it("keeps normal timeout at 1,550 ms and Dungeon Preview at 4,250 ms", () => {
    expect(ORACLE_INTELLIGENCE_TIMEOUT_MS).toBe(1550);
    expect(DUNGEON_PREVIEW_PROVIDER_TIMEOUT_MS).toBe(4250);
    expect(read("app/api/oracle/intelligence/route.ts")).not.toContain("dungeonPreviewMode");
    expect(read("app/api/oracle/intelligence/dungeon-preview/route.ts")).toContain("dungeonPreviewMode: true");
  });

  it("keeps the Dungeon route dnd-only with no client timeout/model/reasoning controls", () => {
    const route = read("app/api/oracle/intelligence/dungeon-preview/route.ts");
    expect(route).toContain('oracleId !== "dnd"');
    expect(route).not.toContain("searchParams");
    expect(route).not.toContain("reasoning");
    expect(route).not.toContain("timeoutMs:");
  });

  it("preserves approved Jester and Love routes, coordinators, stages, personalities, and mappings canonically", () => {
    for (const [path, digest] of Object.entries(approvedFiles)) {
      expect(canonicalSha(path), path).toBe(digest);
    }
  });

  it("keeps provider access out of the Eclipse stage", () => {
    for (const stage of ["eclipse/Eclipse3DStage.tsx"]) {
      expect(read(`components/living-oracle/${stage}`)).not.toMatch(/fetch\s*\(/);
    }
  });

  it("adds Dungeon busy semantics, one polite announcement, and cancellation", () => {
    const oracle = read("components/OracleQR.tsx");
    expect(oracle).toContain('aria-busy={dungeonIntelligenceEnabled && busy ? "true" : undefined}');
    expect(oracle).toContain('abort("dungeon-cycle-superseded")');
    expect(oracle).toContain('abort("dungeon-oracle-unmounted")');
    expect(oracle).toContain("The Oracle is considering your question.");
  });
});
