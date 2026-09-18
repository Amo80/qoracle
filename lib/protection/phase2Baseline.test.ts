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

const PHASE_2_PROTECTED_BASELINE =
  "415442226cab55acbbdcbd946c1ee2c2445d47852fdcdf13f141f14cdc72cc52";

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
      .sort((left, right) =>
        left.relative < right.relative ? -1 : left.relative > right.relative ? 1 : 0
      );
    const digest = createHash("sha256");

    for (const file of files) {
      digest.update(file.relative);
      digest.update("\0");
      digest.update(readFileSync(file.absolute));
      digest.update("\0");
    }

    expect(files).toHaveLength(43);
    expect(digest.digest("hex")).toBe(PHASE_2_PROTECTED_BASELINE);
  });
});
