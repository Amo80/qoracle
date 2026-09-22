import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ORIGINAL_ORACLE_QR_SHA256 =
  "8b88a2a9c26e32e9c304eb5195da5cb815372831fbd1f1988db1e37b722c1dbb";

describe("Phase 4C approved OracleQR copy-only change", () => {
  it("changes only the approved Dungeon-facing strings", () => {
    const source = readFileSync(join(process.cwd(), "components/OracleQR.tsx"), "utf8");
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
