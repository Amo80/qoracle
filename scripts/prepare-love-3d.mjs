import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { NodeIO } from "@gltf-transform/core";
import { resample } from "@gltf-transform/functions";

const root = process.cwd();
const sourceDirectory = resolve(
  process.env.LOVE_SOURCE_DIR || join(root, "asset-sources/love/v1")
);
const outputDirectory = join(root, "public/characters/love/v1");
const workDirectory = join(root, ".asset-work/love-v1");
const gltfTransform = join(
  root,
  "node_modules/.bin",
  process.platform === "win32" ? "gltf-transform.cmd" : "gltf-transform"
);

const sources = {
  character: "love-source.glb",
  heart: "heart-source.glb",
  podium: "podium-source.glb",
};

function runTransform(args) {
  const result = spawnSync(gltfTransform, args, {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.status !== 0) {
    throw new Error(
      [`gltf-transform ${args.join(" ")} failed.`, result.stdout, result.stderr]
        .filter(Boolean)
        .join("\n")
    );
  }
}

async function sha256(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

function retainAnimation(document, expectedName) {
  const animations = document.getRoot().listAnimations();
  const primary = animations.find((animation) => animation.getName() === expectedName);
  if (!primary) throw new Error(`Missing expected Love animation ${expectedName}.`);
  for (const animation of animations) {
    if (animation !== primary) animation.dispose();
  }
  return primary;
}

function removeInvalidTangents(document) {
  for (const mesh of document.getRoot().listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      primitive.setAttribute("TANGENT", null);
    }
  }
}

async function prepareBase(io, input, output) {
  const sanitized = join(workDirectory, "love-base-sanitized.glb");
  const resized = join(workDirectory, "love-base-2048.glb");
  const webp = join(workDirectory, "love-base-webp.glb");
  const pruned = join(workDirectory, "love-base-pruned.glb");
  const document = await io.read(input);
  retainAnimation(document, "Idle_7");
  removeInvalidTangents(document);
  await document.transform(resample());
  await io.write(sanitized, document);
  runTransform(["resize", sanitized, resized, "--width", "2048", "--height", "2048"]);
  runTransform(["webp", resized, webp, "--quality", "88", "--effort", "6"]);
  runTransform([
    "prune",
    webp,
    pruned,
    "--keep-attributes",
    "true",
    "--keep-indices",
    "true",
    "--keep-leaves",
    "true",
  ]);
  runTransform(["quantize", pruned, output]);
}

async function prepareAnimation(io, input, expectedName, output) {
  const unpruned = join(workDirectory, `${expectedName}-unpruned.glb`);
  const document = await io.read(input);
  retainAnimation(document, expectedName);
  for (const node of document.getRoot().listNodes()) {
    node.setMesh(null);
    node.setSkin(null);
  }
  for (const mesh of document.getRoot().listMeshes()) mesh.dispose();
  for (const skin of document.getRoot().listSkins()) skin.dispose();
  for (const material of document.getRoot().listMaterials()) material.dispose();
  for (const texture of document.getRoot().listTextures()) texture.dispose();
  await document.transform(resample());
  await io.write(unpruned, document);
  runTransform([
    "prune",
    unpruned,
    output,
    "--keep-attributes",
    "false",
    "--keep-indices",
    "false",
    "--keep-leaves",
    "true",
  ]);
}

async function prepareProp(input, output, { ratio }) {
  const name = basename(output, ".glb");
  const optimized = join(workDirectory, `${name}-optimized.glb`);
  runTransform([
    "optimize",
    input,
    optimized,
    "--compress",
    "false",
    "--flatten",
    "false",
    "--join",
    "false",
    "--instance",
    "false",
    "--palette",
    "false",
    "--simplify",
    "true",
    "--simplify-ratio",
    String(ratio),
    "--simplify-error",
    "0.001",
    "--texture-compress",
    "webp",
    "--texture-size",
    "2048",
    "--prune",
    "true",
  ]);
  runTransform(["quantize", optimized, output]);
}

async function describe(path, displayPath) {
  return {
    path: (displayPath || path.slice(root.length + 1)).replaceAll("\\", "/"),
    bytes: (await stat(path)).size,
    sha256: await sha256(path),
  };
}

for (const filename of Object.values(sources)) {
  const path = join(sourceDirectory, filename);
  if (!existsSync(path)) throw new Error(`Missing Love source: ${path}`);
}

await rm(workDirectory, { recursive: true, force: true });
await mkdir(workDirectory, { recursive: true });
await mkdir(join(outputDirectory, "animations"), { recursive: true });

const io = new NodeIO();
const outputs = {
  base: join(outputDirectory, "love-base.glb"),
  shrug: join(outputDirectory, "animations/shrug.glb"),
  bubbleDance: join(outputDirectory, "animations/bubble-dance.glb"),
  heart: join(outputDirectory, "heart-crystal.glb"),
  podium: join(outputDirectory, "podium.glb"),
};

const characterSource = join(sourceDirectory, sources.character);
await prepareBase(io, characterSource, outputs.base);
await prepareAnimation(io, characterSource, "Shrug", outputs.shrug);
await prepareAnimation(io, characterSource, "Bubble_Dance", outputs.bubbleDance);
await prepareProp(join(sourceDirectory, sources.heart), outputs.heart, { ratio: 0.03 });
await prepareProp(join(sourceDirectory, sources.podium), outputs.podium, { ratio: 0.025 });

const manifest = {
  version: 1,
  sourceFiles: await Promise.all(
    Object.values(sources).map((filename) =>
      describe(join(sourceDirectory, filename), `source/${filename}`)
    )
  ),
  outputs: await Promise.all(Object.values(outputs).map((path) => describe(path))),
  optimization: {
    characterGeometry: "preserved",
    characterQuantization: "KHR_mesh_quantization",
    textureMaximum: 2048,
    textureFormat: "webp",
    textureQuality: 88,
    heartSimplifyRatio: 0.03,
    podiumSimplifyRatio: 0.025,
    simplifyError: 0.001,
    propQuantization: "KHR_mesh_quantization",
    defaultAnimation: "Idle_7",
    optionalAnimations: ["Shrug", "Bubble_Dance"],
    excludedAnimations: ["Walking", "Running", "restpose"],
  },
};

await writeFile(
  join(outputDirectory, "asset-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`
);

for (const output of manifest.outputs) {
  console.log(`${basename(output.path)}: ${output.bytes} bytes`);
}
