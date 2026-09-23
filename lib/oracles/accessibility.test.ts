import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const oracle = readFileSync(join(process.cwd(), "components/OracleQR.tsx"), "utf8");

describe("Oracle question and answer accessibility", () => {
  it.each(["Love", "Dungeon", "Eclipse", "Jester", "Chaos"])(
    "gives the %s question field a persistent accessible name",
    (name) => expect(oracle).toContain(`aria-label="Ask the ${name} Oracle a question"`)
  );

  it("announces and focuses each authoritative answer card", () => {
    expect(oracle.match(/ref=\{answerRegionRef\}/g)).toHaveLength(5);
    expect(oracle.match(/role="status"/g)?.length).toBeGreaterThanOrEqual(5);
    expect(oracle.match(/aria-live="polite"/g)?.length).toBeGreaterThanOrEqual(5);
    expect(oracle.match(/aria-atomic="true"/g)?.length).toBeGreaterThanOrEqual(5);
    expect(oracle.match(/tabIndex=\{-1\}/g)?.length).toBeGreaterThanOrEqual(5);
    expect(oracle).toContain("focusWithoutViewportScroll(answerRegionRef.current)");
    expect(oracle).not.toContain("answerRegionRef.current?.focus()");
  });

  it("announces Jester intelligence once without replacing answer semantics", () => {
    expect(oracle).toContain("The Oracle is considering your question.");
    expect(oracle).toContain('aria-busy={jesterIntelligenceEnabled && busy ? "true" : undefined}');
  });

  it("announces Love intelligence once without replacing answer semantics", () => {
    expect(oracle).toContain('aria-busy={loveIntelligenceEnabled && busy ? "true" : undefined}');
    expect(oracle).toContain('data-love-intelligence={loveIntelligenceEnabled && busy ? "pending" : "idle"}');
  });

  it("captures mounted audio nodes and tears them down on theme change or unmount", () => {
    expect(oracle).toContain("const activeAudio = [loveMusicRef.current, dndMusicRef.current, chaosMusicRef.current, jesterLaughRef.current]");
    expect(oracle).toContain("return () => stopOracleAudio(activeAudio)");
    expect(oracle).toContain("ref={jesterLaughRef}");
  });
});
