import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const oracle = read("components/OracleQR.tsx");
const styles = read("app/styles/living-oracle.css");

describe("Phase 6 Oracle visual polish", () => {
  it("removes answer-only chrome from Love, Dungeon, Chaos, and Eclipse", () => {
    for (const selector of [
      ".theme-love .love-answer-card",
      '.theme-love[data-love3d-status="ready"] .love-answer-card',
      ".theme-dnd .dnd-answer-card",
      '.theme-dnd[data-dragon3d-status="ready"] .dnd-answer-card',
      ".theme-eclipse .eclipse-answer-card",
      '.theme-eclipse[data-eclipse3d-status="ready"] .eclipse-answer-card',
      ".theme-chaos > .result",
      '.theme-chaos[data-chaos3d-status="ready"] > .result',
    ]) expect(styles).toContain(selector);
    const polish = styles.slice(styles.indexOf("/* Phase 6 visual polish:"));
    for (const declaration of [
      "background: transparent !important",
      "background-image: none !important",
      "border: 0 !important",
      "outline: 0 !important",
      "border-radius: 0 !important",
      "box-shadow: none !important",
      "backdrop-filter: none !important",
      "-webkit-backdrop-filter: none !important",
    ]) expect(polish).toContain(declaration);
    expect(styles).toContain(".theme-eclipse .eclipse-answer-card::before");
    expect(styles).toContain("overflow-wrap: anywhere");
  });

  it("does not include question panels or Jester in the answer-chrome override", () => {
    const polish = styles.slice(styles.indexOf("/* Phase 6 visual polish:"));
    expect(polish).not.toMatch(/question-box|> \.question|jester/i);
  });

  it("targets the actual semantic answer wrappers while preserving their controls", () => {
    expect(oracle).toMatch(/ref=\{answerRegionRef\} className="love-answer-card" role="status"/);
    expect(oracle).toMatch(/ref=\{answerRegionRef\} className="dnd-answer-card" role="status"/);
    expect(oracle).toMatch(/ref=\{answerRegionRef\} className="eclipse-answer-card" role="status"/);
    expect(oracle).toMatch(/ref=\{answerRegionRef\} className="result" role="status"/);
    expect(styles).toContain('.theme-chaos[data-chaos3d-status="ready"] > .result .secondary');
    expect(styles).toContain('.theme-love[data-love3d-status="ready"] .love-again-button');
    expect(styles).toContain('.theme-dnd[data-dragon3d-status="ready"] .dnd-again-button');
    expect(styles).toContain('.theme-eclipse[data-eclipse3d-status="ready"] .eclipse-again-button');
  });

  it("uses the approved Dungeon and Chaos action copy", () => {
    expect(oracle).toContain('{busy ? "ROLLING THE DICE..." : "CONSULT THE ORACLE"}');
    expect(oracle).toContain('{busy ? "CONSULTING..." : "ASK CHAOS"}');
    expect(oracle).not.toContain('"SHAKE THE ORACLE"');
  });

  it("retains semantic, focusable answer regions for all five Oracles", () => {
    expect(oracle.match(/ref=\{answerRegionRef\}/g)).toHaveLength(5);
    expect(oracle.match(/role="status"/g)?.length).toBeGreaterThanOrEqual(5);
    expect(oracle.match(/aria-live="polite"/g)?.length).toBeGreaterThanOrEqual(5);
    expect(oracle).toContain("focusWithoutViewportScroll(answerRegionRef.current)");
  });
});
