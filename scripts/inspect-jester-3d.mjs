import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const assetRoot = join(root, "public/characters/jester/v1");
const paths = [
  "jester-base.glb",
  "animations/talk.glb",
  "animations/heart.glb",
  "animations/jazz.glb",
  "crystal-ball.glb",
];

function parseGlb(data) {
  if (data.toString("utf8", 0, 4) !== "glTF") throw new Error("Not a GLB file.");
  const jsonLength = data.readUInt32LE(12);
  return JSON.parse(data.toString("utf8", 20, 20 + jsonLength));
}

for (const relativePath of paths) {
  const path = join(assetRoot, relativePath);
  const data = await readFile(path);
  const gltf = parseGlb(data);
  const animations = (gltf.animations || []).map((animation) => ({
    name: animation.name,
    channels: animation.channels?.length || 0,
  }));
  console.log(
    JSON.stringify({
      path: relativePath,
      bytes: (await stat(path)).size,
      meshes: gltf.meshes?.length || 0,
      skins: gltf.skins?.length || 0,
      textures: gltf.textures?.length || 0,
      animations,
      extensionsUsed: gltf.extensionsUsed || [],
    })
  );
}
