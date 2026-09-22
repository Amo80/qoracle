import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CHAOS_3D_MANIFEST } from "./chaos3d";

const publicPath = (path: string) =>
  join(process.cwd(), "public", path.replace(/^\//, ""));

function sha256(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function triangleCount(path: string) {
  const bytes = readFileSync(path);
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8"));
  return json.meshes.reduce(
    (
      total: number,
      mesh: {
        primitives: Array<{
          indices?: number;
          attributes: { POSITION: number };
        }>;
      }
    ) =>
      total +
      mesh.primitives.reduce((sum, primitive) => {
        const accessor =
          json.accessors[primitive.indices ?? primitive.attributes.POSITION];
        return sum + accessor.count / 3;
      }, 0),
    0
  );
}

describe("Chaos 3D production assets", () => {
  it("ships exact approved candidates under one versioned runtime path", () => {
    const paths = [
      CHAOS_3D_MANIFEST.pedestal,
      CHAOS_3D_MANIFEST.rift,
      CHAOS_3D_MANIFEST.vortex,
    ];
    expect(paths.every((path) => path.startsWith("/characters/chaos/v1/"))).toBe(true);
    const sizes = paths.map((path) => statSync(publicPath(path)).size);
    expect(sizes).toEqual([4_656_236, 2_774_648, 404_230]);
    expect(sizes.reduce((sum, size) => sum + size, 0)).toBeLessThanOrEqual(
      8 * 1024 * 1024
    );
  });

  it("protects approved geometry and asset hashes", () => {
    expect(triangleCount(publicPath(CHAOS_3D_MANIFEST.pedestal))).toBe(113_108);
    expect(triangleCount(publicPath(CHAOS_3D_MANIFEST.rift))).toBe(44_872);
    expect(sha256(publicPath(CHAOS_3D_MANIFEST.pedestal))).toBe(
      "f059bb7c7c5b6fb330ec2ff25ab3239e82f077f36b0300731edb680c233c8548"
    );
    expect(sha256(publicPath(CHAOS_3D_MANIFEST.rift))).toBe(
      "6d02326d933af02b8321a22f959136667a904a4dd8517328a47ccf5daf6803ef"
    );
    expect(sha256(publicPath(CHAOS_3D_MANIFEST.vortex))).toBe(
      "965323df5e6b41f2d4756b2782eb9eeb04b7f9f879ca11b3412af66810d748d5"
    );
  });
});
