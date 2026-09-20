import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { JESTER_3D_MANIFEST } from "./jester3d";

function parseGlb(relativePath: string) {
  const data = readFileSync(join(process.cwd(), "public", relativePath));
  expect(data.toString("utf8", 0, 4)).toBe("glTF");
  const jsonLength = data.readUInt32LE(12);
  return JSON.parse(data.toString("utf8", 20, 20 + jsonLength)) as {
    meshes?: unknown[];
    skins?: unknown[];
    textures?: unknown[];
    animations?: Array<{ name?: string }>;
  };
}

function publicPath(assetPath: string) {
  return assetPath.replace(/^\//, "");
}

describe("optimized Phase 4A assets", () => {
  it("keeps the base model within budget with the canonical idle clip", () => {
    const path = publicPath(JESTER_3D_MANIFEST.model);
    expect(statSync(join(process.cwd(), "public", path)).size).toBeLessThanOrEqual(
      8 * 1024 * 1024
    );
    const gltf = parseGlb(path);
    expect(gltf.meshes).toHaveLength(1);
    expect(gltf.skins).toHaveLength(1);
    expect(gltf.animations?.map((animation) => animation.name)).toEqual([
      "Idle_9",
    ]);
  });

  it("ships animation-only approved clips without duplicate meshes or textures", () => {
    const clips = [
      JESTER_3D_MANIFEST.clips.speaking,
      JESTER_3D_MANIFEST.clips.positiveReaction,
      JESTER_3D_MANIFEST.optionalClips.jazz,
    ];
    let total = 0;
    for (const clip of clips) {
      const path = publicPath(clip.path);
      total += statSync(join(process.cwd(), "public", path)).size;
      const gltf = parseGlb(path);
      expect(gltf.meshes || []).toHaveLength(0);
      expect(gltf.textures || []).toHaveLength(0);
      expect(gltf.animations?.map((animation) => animation.name)).toEqual([
        clip.name,
      ]);
    }
    expect(total).toBeLessThanOrEqual(2 * 1024 * 1024);
  });

  it("keeps the independent crystal ball within its own budget", () => {
    const path = publicPath(JESTER_3D_MANIFEST.crystalBall);
    expect(statSync(join(process.cwd(), "public", path)).size).toBeLessThanOrEqual(
      3 * 1024 * 1024
    );
    const gltf = parseGlb(path);
    expect(gltf.meshes).toHaveLength(1);
    expect(gltf.skins || []).toHaveLength(0);
    expect(gltf.animations || []).toHaveLength(0);
  });

  it("keeps initial base plus ball transfer within twelve MiB", () => {
    const bytes = [JESTER_3D_MANIFEST.model, JESTER_3D_MANIFEST.crystalBall]
      .map(publicPath)
      .reduce(
        (total, path) =>
          total + statSync(join(process.cwd(), "public", path)).size,
        0
      );
    expect(bytes).toBeLessThanOrEqual(12 * 1024 * 1024);
  });
});
