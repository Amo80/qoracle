import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ORACLE_IDS } from "../oracles/registry";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const layerSource = read("components/living-oracle/LivingOracleLayer.tsx");
const layoutSource = read("app/layout.tsx");
const livingCss = read("app/styles/living-oracle.css");

describe("Living Oracle integration contracts", () => {
  it("keeps Phase 3 behind its disabled-by-default server flag", () => {
    expect(layoutSource).toContain("isLivingOracleEnabled()");
    expect(layoutSource).toContain("<LivingOracleLayer");
    expect(read(".env.example")).toContain("LIVING_ORACLE_V3_ENABLED=false");
  });

  it("keeps Phase 4A client-only, Jester-only, and independently gated", () => {
    expect(layoutSource).toContain("isJester3DEnabled()");
    expect(layoutSource).not.toMatch(/from ["']three/);
    expect(layerSource).toContain('lazy(() =>');
    expect(layerSource).toContain('import("./jester/Jester3DStage")');
    expect(layerSource).toContain('detected === "jester"');
    expect(read(".env.example")).toContain("JESTER_3D_V4A_ENABLED=false");
  });

  it("keeps Phase 4C client-only, internal-dnd-only, and independently gated", () => {
    expect(layoutSource).toContain("isDragon3DEnabled()");
    expect(layoutSource).not.toMatch(/from ["']three/);
    expect(layerSource).toContain('import("./dragon/Dragon3DStage")');
    expect(layerSource).toContain('detected === "dnd"');
    expect(read(".env.example")).toContain("DRAGON_3D_V4C_ENABLED=false");
  });

  it("provides one shared Return to Homepage control for every detected Oracle", () => {
    expect(layerSource).toContain('href="/"');
    expect(layerSource).toContain("Return to Homepage");
    for (const oracleId of ORACLE_IDS) {
      expect(layerSource).toContain("ORACLE_IDS.find");
      expect(read("lib/living-oracle/manifests.ts")).toContain(`${oracleId}: {`);
    }
  });

  it("observes the protected experience without importing answers or AI services", () => {
    expect(layerSource).not.toContain("ORACLE_ANSWERS");
    expect(layerSource).not.toMatch(/fetch\s*\(/);
    expect(layerSource).not.toMatch(/openai|anthropic|gemini/i);
    expect(layerSource).toContain("MutationObserver");
  });

  it("exposes an accessible status and decorative-only atmosphere", () => {
    expect(layerSource).toContain('aria-live="polite"');
    expect(layerSource).toContain('aria-atomic="true"');
    expect(layerSource).toContain('aria-hidden="true"');
    expect(livingCss).toContain("min-height: 44px");
  });

  it("provides both system and stored reduced-motion fallbacks", () => {
    expect(livingCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(livingCss).toContain('html[data-motion="reduced"]');
    expect(livingCss).toContain("animation: none !important");
  });
});
