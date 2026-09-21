import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LOVE_3D_MANIFEST } from "./love3d";

const root = process.cwd();
const publicPath = (path: string) => join(root, "public", path.replace(/^\//, ""));

describe("Love 3D runtime assets", () => {
  it("ships versioned independent runtime objects below the transfer ceiling", () => {
    const runtimePaths = [
      LOVE_3D_MANIFEST.model,
      LOVE_3D_MANIFEST.heart,
      LOVE_3D_MANIFEST.podium,
    ];
    expect(
      runtimePaths.every((path) => path.startsWith("/characters/love/v1/"))
    ).toBe(true);

    const paths = runtimePaths.map(publicPath);
    const total = paths.reduce((sum, path) => sum + statSync(path).size, 0);
    expect(total).toBeLessThanOrEqual(14 * 1024 * 1024);
    expect(total).toBeLessThanOrEqual(12 * 1024 * 1024);
  });

  it("retains only Idle_7 in the base and excludes runtime travel clips", () => {
    const bytes = readFileSync(publicPath(LOVE_3D_MANIFEST.model));
    const text = bytes.toString("latin1");
    expect(text).toContain("Idle_7");
    expect(text).not.toMatch(/Walking|Running|restpose/);
  });

  it("keeps optional Preview candidates separate", () => {
    for (const clip of Object.values(LOVE_3D_MANIFEST.optionalClips)) {
      expect(statSync(publicPath(clip.path)).size).toBeGreaterThan(0);
      expect(clip.approved).toBe(false);
    }
  });
});
