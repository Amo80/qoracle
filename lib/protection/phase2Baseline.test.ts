import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const PROTECTED_ROOTS = [
  "app/api",
  "app/q/[code]",
  "app/admin",
  "app/checkout",
  "app/success",
  "app/merch",
  "app/oracle",
  "app/shop",
  "app/tarot",
  "components/OracleQR.tsx",
  "lib/auth",
  "lib/commerce",
  "lib/email",
  "lib/supabase",
  "proxy.ts",
  "supabase",
] as const;

const APPROVED_ADDITIVE_ROUTES = new Set([
  "app/api/oracle/intelligence/route.ts",
  "app/api/oracle/intelligence/qualification/[profile]/route.ts",
  "app/api/oracle/intelligence/jester-preview/route.ts",
  "app/api/oracle/intelligence/love-preview/route.ts",
  "app/api/oracle/intelligence/dungeon-preview/route.ts",
  "app/api/oracle/intelligence/chaos-preview/route.ts",
  "app/api/oracle/intelligence/eclipse-preview/route.ts",
  "app/api/oracle/intelligence/live/route.ts",
  "supabase/migrations/20260923180000_oracle_intelligence_rate_limits.sql",
]);

const PHASE_2_PROTECTED_BASELINE =
  "edd5dff11996cdb5ad81235fed8c28bdc065625d094fa3942a4959208d12af90";

function canonicalizeText(bytes: Buffer) {
  return bytes
    .toString("utf8")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n");
}

function walk(path: string): string[] {
  if (statSync(path).isFile()) return [path];

  return readdirSync(path).flatMap((name) => walk(join(path, name)));
}

describe("Phase 2 protected production baseline", () => {
  it("keeps backend, commerce, QR, admin, Tarot, Shop/Merch, and Oracle behavior unchanged", () => {
    const projectRoot = process.cwd();
    const files = PROTECTED_ROOTS.flatMap((root) => walk(join(projectRoot, root)))
      .map((path) => ({
        absolute: path,
        relative: relative(projectRoot, path).replace(/\\/g, "/"),
      }))
      .filter((file) => !APPROVED_ADDITIVE_ROUTES.has(file.relative))
      .sort((left, right) =>
        left.relative < right.relative ? -1 : left.relative > right.relative ? 1 : 0
      );
    const digest = createHash("sha256");

    for (const file of files) {
      digest.update(file.relative);
      digest.update("\0");
      const source = canonicalizeText(readFileSync(file.absolute));
      // Phase 4C permits only these presentation-copy substitutions in
      // OracleQR. Phase 6 then permits the reviewed Jester, Love, Dungeon, Chaos, and Eclipse intelligence
      // coordinators while retaining the exact answer library separately.
      // Canonicalize the copy back to the protected Phase 2 wording. UTF-8 BOMs
      // are removed and CRLF/lone CR are normalized to LF before hashing so
      // checkout settings cannot change the protected digest.
      const protectedSource = file.relative === "components/OracleQR.tsx"
        ? source
              .split("Dungeon Oracle music could not autoplay:").join("D&D Oracle music could not autoplay:")
              .split("The QRystal Balls • DUNGEON").join("The QRystal Balls • D&D")
              .split("✦ Theme: Dungeon").join("⚙ Theme: D&D")
        : source;
      digest.update(protectedSource, "utf8");
      digest.update("\0");
    }

    expect(files).toHaveLength(43);
    expect(digest.digest("hex")).toBe(PHASE_2_PROTECTED_BASELINE);
  });
});
