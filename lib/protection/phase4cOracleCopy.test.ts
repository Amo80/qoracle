import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ORIGINAL_ORACLE_QR_SHA256 =
  "bce2250c84736d02b2030365aa6e904aca182f4997bbb2c62e9c3b15635b04ab";

function canonicalizeText(source: string) {
  return source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

describe("Phase 4C approved OracleQR copy-only change", () => {
  it("changes only the approved Dungeon-facing strings", () => {
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
      ORIGINAL_ORACLE_QR_SHA256
    );
  });
});
