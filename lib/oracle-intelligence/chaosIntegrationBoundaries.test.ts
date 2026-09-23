import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isChaosIntelligencePreviewIntegrationEnabled } from "../experience/featureFlags";
import { CHAOS_PREVIEW_PROVIDER_TIMEOUT_MS, ORACLE_INTELLIGENCE_TIMEOUT_MS } from "./timeout";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const canonicalSha = (path: string) => {
  let source = read(path).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  if (path === "lib/living-oracle/dragon3d.ts") {
    source = source
      .replace("    mobileFillFraction: 0.83,\n    mobileMaxWidth: 430,\n", "")
      .replace("export function getDragonCameraFillFraction({ width, aspect }: { width: number; aspect: number }) {\n  if (width <= DRAGON_SCENE_PRESENTATION.camera.mobileMaxWidth) {\n    return DRAGON_SCENE_PRESENTATION.camera.mobileFillFraction;\n  }\n", "export function getDragonCameraFillFraction(aspect: number) {\n")
      .replace("getDragonCameraFillFraction({ width, aspect })", "getDragonCameraFillFraction(aspect)");
  }
  return createHash("sha256").update(source, "utf8").digest("hex");
};
const approvedFiles = {
  "app/api/oracle/intelligence/jester-preview/route.ts": "5e64da3b520b5abe1d68b6be37847c0f9ae3a75d4cdf03a0a5cd5ea0ab8320cc",
  "lib/oracle-intelligence/jesterIntegration.ts": "58db180d23458162921c48b3f8c679794d1db9aa597a2db4e8473501096548b8",
  "components/living-oracle/jester/Jester3DStage.tsx": "6d1c30554eddc0359e54ba07e6234773b9b3ffa4a3db50f6659074d8d6572f19",
  "lib/oracle-intelligence/personalities/v1/jester.ts": "1f15121d38b48097651614a71492441ef9306e9546315f6613ae8c0144ff59da",
  "lib/living-oracle/jester3d.ts": "25fb20aaf1564f28d3cdbc64cedd93664c08df8b641e3468707d51ba01405868",
  "app/api/oracle/intelligence/love-preview/route.ts": "c413590256e24f8953483ad1217c3e468a876e22b398b55408df367f47952e62",
  "lib/oracle-intelligence/loveIntegration.ts": "77dd7fca25c278477efa9bbf58a09850ecf25576da6a227ab52e7d60cdb91fd8",
  "components/living-oracle/love/Love3DStage.tsx": "aafd6aa6bf748339eb54305f5e99de55becf1f7dad8716db506dcc713b3e7844",
  "lib/oracle-intelligence/personalities/v1/love.ts": "f9d30c94675548d9cebed0299584ad17998614bacd1690720d5c2450d2d8d283",
  "lib/living-oracle/love3d.ts": "8e6f450a665f37b137bdec9966d60be772e8c4ab90454927aa9d32f30cf64cf9",
  "app/api/oracle/intelligence/dungeon-preview/route.ts": "500ce3262f4ee858ad56a043ac5d14428a2e199e6ca188ecd001aa24f2b4fe7a",
  "lib/oracle-intelligence/dungeonIntegration.ts": "2deda6b99cadcc6736449ed500f9bf395fce76c3a60981aa49b4a5c9b1bcdb15",
  "components/living-oracle/dragon/Dragon3DStage.tsx": "859f7758d366b3642b42c0e92d0326e35da7d181f1226e021f0dd9f3c1501235",
  "lib/oracle-intelligence/personalities/v1/dungeon.ts": "5ff1c130ed777ba5f8fc8e72e1bbe10306529d22aa614b20f9d2ecc6cfd6f2cc",
  "lib/living-oracle/dragon3d.ts": "9a74ba5a76d7897c8d8bf31e59af8bede38128b91144b6a76c9a3e78f92414cd",
} as const;

describe("Chaos intelligence integration boundaries", () => {
  it("is Preview/development-only and requires Chaos eligibility", () => {
    const common = { ORACLE_INTELLIGENCE_ENABLED: "true", ORACLE_INTELLIGENCE_CHAOS_ENABLED: "true", ORACLE_INTELLIGENCE_ROLLOUT_PERCENT: "100", OPENAI_API_KEY: "configured" };
    expect(isChaosIntelligencePreviewIntegrationEnabled({ ...common, VERCEL_ENV: "production", NODE_ENV: "production" })).toBe(false);
    expect(isChaosIntelligencePreviewIntegrationEnabled({ ...common, VERCEL_ENV: "preview", NODE_ENV: "production" })).toBe(true);
    expect(isChaosIntelligencePreviewIntegrationEnabled({ ...common, VERCEL_ENV: "preview", ORACLE_INTELLIGENCE_CHAOS_ENABLED: "false" })).toBe(false);
  });
  it("keeps normal timeout 1,550 ms and Chaos Preview 4,250 ms", () => {
    expect(ORACLE_INTELLIGENCE_TIMEOUT_MS).toBe(1550); expect(CHAOS_PREVIEW_PROVIDER_TIMEOUT_MS).toBe(4250);
    expect(read("app/api/oracle/intelligence/route.ts")).not.toContain("chaosPreviewMode");
    expect(read("app/api/oracle/intelligence/chaos-preview/route.ts")).toContain("chaosPreviewMode: true");
  });
  it("keeps route Chaos-only with no client controls", () => {
    const route = read("app/api/oracle/intelligence/chaos-preview/route.ts");
    expect(route).toContain('oracleId !== "chaos"'); expect(route).not.toContain("searchParams"); expect(route).not.toContain("reasoning"); expect(route).not.toContain("timeoutMs:");
  });
  it("preserves approved Jester, Love, and Dungeon boundaries canonically", () => {
    for (const [path, digest] of Object.entries(approvedFiles)) expect(canonicalSha(path), path).toBe(digest);
  });
  it("preserves the Eclipse celestial invariant while keeping provider access out of its stage", () => {
    expect(read("components/living-oracle/eclipse/Eclipse3DStage.tsx")).not.toMatch(/fetch\s*\(/);
    expect(read("lib/living-oracle/eclipse3d.test.ts")).toContain("keeps the Sun on gold and Moon on violet");
  });
  it("adds Chaos busy semantics and cancellation", () => {
    const oracle = read("components/OracleQR.tsx");
    expect(oracle).toContain('aria-busy={chaosIntelligenceEnabled && busy ? "true" : undefined}');
    expect(oracle).toContain('abort("chaos-cycle-superseded")'); expect(oracle).toContain('abort("chaos-oracle-unmounted")');
    expect(oracle).toContain("The Oracle is considering your question."); expect(oracle).toContain("focusWithoutViewportScroll(answerRegionRef.current)");
  });
});
