import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { describe, expect, it } from "vitest";
import { ECLIPSE_3D_MANIFEST, ECLIPSE_PROCEDURAL_BONES } from "./eclipse3d";

describe("Eclipse 3D production assets", () => {
  it("ships exact versioned approved derivatives below the transfer ceiling", () => {
    const files = [
      { path: ECLIPSE_3D_MANIFEST.empress, bytes: 9_789_876, sha: "fbf8cb88b0d7fe7b8fbf2dc2291b2f39a8a063287d849ad0e27e99a07ad25b16" },
      { path: ECLIPSE_3D_MANIFEST.altar, bytes: 6_524_216, sha: "1be90cf262dc7500031a0af87cd453bb77f6f2ddc761e08ae527da376f0fb5f9" },
    ];
    let total = 0;
    for (const file of files) { expect(file.path).toContain("/characters/eclipse/v1/"); const local = join(process.cwd(), "public", file.path); expect(statSync(local).size).toBe(file.bytes); expect(createHash("sha256").update(readFileSync(local)).digest("hex")).toBe(file.sha); total += file.bytes; }
    expect(total).toBeLessThanOrEqual(16 * 1024 * 1024);
  });

  it("preserves the approved active skin and excludes locomotion", async () => {
    const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
    const document = await io.read(join(process.cwd(), "public/characters/eclipse/v1/empress.glb"));
    const root = document.getRoot(); const skin = root.listSkins()[0];
    expect(skin.listJoints()).toHaveLength(28);
    const names = skin.listJoints().map((joint) => joint.getName());
    ECLIPSE_PROCEDURAL_BONES.forEach((name) => expect(names).toContain(name));
    expect(root.listAnimations().map((animation) => animation.getName())).toEqual(["restpose"]);
  });
});
