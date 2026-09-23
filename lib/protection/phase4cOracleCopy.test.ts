import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PHASE_6_JESTER_INTEGRATED_ORACLE_QR_SHA256 =
  "b39c47ef9ce7290288588750b2e6bbe5ed846816bdd76ea12fee0ad79dfc19a8";

function canonicalizeText(source: string) {
  return source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

describe("approved Dungeon copy in the Phase 6 Jester-integrated OracleQR", () => {
  it("retains the approved Dungeon-facing strings in the canonical source", () => {
    const source = canonicalizeText(
      readFileSync(join(process.cwd(), "components/OracleQR.tsx"), "utf8")
    );
    expect(source.match(/The QRystal Balls • DUNGEON/g)).toHaveLength(3);
    expect(source.match(/✦ Theme: Dungeon/g)).toHaveLength(1);
    expect(source.match(/Dungeon Oracle music could not autoplay:/g)).toHaveLength(1);
    expect(source).not.toContain("The QRystal Balls • D&D");
    expect(source).not.toContain("⚙ Theme: D&D");

    const canonical = source
      .split("Dungeon Oracle music could not autoplay:").join("D&D Oracle music could not autoplay:")
      .split("The QRystal Balls • DUNGEON").join("The QRystal Balls • D&D")
      .split("✦ Theme: Dungeon").join("⚙ Theme: D&D");
    expect(createHash("sha256").update(canonical).digest("hex")).toBe(
      PHASE_6_JESTER_INTEGRATED_ORACLE_QR_SHA256
    );
  });
});
