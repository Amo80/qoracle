import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DRAGON_3D_MANIFEST } from "./dragon3d";

const publicPath = (path: string) => join(process.cwd(), "public", path.replace(/^\//, ""));

function triangleCount(path: string) {
  const bytes = readFileSync(path);
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8"));
  return json.meshes.reduce((total: number, mesh: { primitives: Array<{ indices?: number; attributes: { POSITION: number } }> }) =>
    total + mesh.primitives.reduce((sum, primitive) => {
      const accessor = json.accessors[primitive.indices ?? primitive.attributes.POSITION];
      return sum + (primitive.indices === undefined ? accessor.count / 3 : accessor.count / 3);
    }, 0), 0);
}

describe("Dragon 3D production assets", () => {
  it("ships the approved candidates under the versioned production path", () => {
    const paths = [DRAGON_3D_MANIFEST.model, DRAGON_3D_MANIFEST.d20, DRAGON_3D_MANIFEST.altar];
    const sizes = paths.map((path) => statSync(publicPath(path)).size);
    expect(sizes).toEqual([7_837_888, 4_401_664, 4_245_056]);
    expect(sizes.reduce((sum, size) => sum + size, 0)).toBeLessThanOrEqual(16 * 1024 * 1024);
  });

  it("protects the visually approved geometry counts", () => {
    expect(triangleCount(publicPath(DRAGON_3D_MANIFEST.model))).toBe(103_828);
    expect(triangleCount(publicPath(DRAGON_3D_MANIFEST.d20))).toBe(85_788);
    expect(triangleCount(publicPath(DRAGON_3D_MANIFEST.altar))).toBe(92_716);
  });
});
