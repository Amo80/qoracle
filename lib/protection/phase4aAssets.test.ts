import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function sha256(path: string) {
  return createHash("sha256")
    .update(readFileSync(join(process.cwd(), path)))
    .digest("hex");
}

describe("Phase 4A canonical fallback protection", () => {
  it("does not alter or replace jester-oracle.png", () => {
    expect(sha256("public/themes/jester-oracle.png")).toBe(
      "23fb58dcec49282d03603d59bd4f81d352c7ef393ab2d949e0a218dc3a838659"
    );
  });
});
