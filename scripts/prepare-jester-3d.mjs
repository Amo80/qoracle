import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { NodeIO } from "@gltf-transform/core";
import { resample } from "@gltf-transform/functions";

const root = process.cwd();
const sourceDirectory = resolve(
  process.env.JESTER_SOURCE_DIR || join(root, "asset-sources/jester/v1")
);
const ballSource = resolve(
  process.env.JESTER_BALL_SOURCE || join(sourceDirectory, "crystal-ball.glb")
);
const outputDirectory = join(root, "public/characters/jester/v1");
const workDirectory = join(root, ".asset-work/jester-v1");
const gltfTransform = join(
  root,
  "node_modules/.bin",
  process.platform === "win32" ? "gltf-transform.cmd" : "gltf-transform"
);

const sources = {
  base: "Meshy_AI_Jester_Character_biped_Animation_Idle_9_withSkin.glb",
  talk: "Meshy_AI_Jester_Character_biped_Animation_Talk_with_Hands_Open_withSkin.glb",
  heart: "Meshy_AI_Jester_Character_biped_Animation_Big_Heart_Gesture_withSkin.glb",
  jazz: "Meshy_AI_Jester_Character_biped_Animation_jazz_danc_withSkin.glb",
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

function retainPrimaryAnimation(document, expectedName) {
  const animations = document.getRoot().listAnimations();
  const primary = animations.find((animation) => animation.getName() === expectedName);
  if (!primary) {
    throw new Error(`Missing expected animation ${expectedName}.`);
  }
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
  const sanitized = join(workDirectory, "jester-base-sanitized.glb");
  const resized = join(workDirectory, "jester-base-2048.glb");
  const webp = join(workDirectory, "jester-base-webp.glb");
  const document = await io.read(input);
  retainPrimaryAnimation(document, "Idle_9");
  removeInvalidTangents(document);
  await document.transform(resample());
  await io.write(sanitized, document);
  runTransform(["resize", sanitized, resized, "--width", "2048", "--height", "2048"]);
  runTransform(["webp", resized, webp, "--quality", "88", "--effort", "6"]);
  runTransform([
    "prune",
    webp,
    output,
    "--keep-attributes",
    "true",
    "--keep-indices",
    "true",
    "--keep-leaves",
    "true",
  ]);
}

async function prepareAnimation(io, input, expectedName, output) {
  const unpruned = join(workDirectory, `${expectedName}-unpruned.glb`);
  const document = await io.read(input);
  retainPrimaryAnimation(document, expectedName);

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

async function prepareBall(input, output) {
  const webp = join(workDirectory, "crystal-ball-webp.glb");
  runTransform(["webp", input, webp, "--quality", "88", "--effort", "6"]);
  runTransform(["copy", webp, output]);
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
  if (!existsSync(path)) throw new Error(`Missing Jester source: ${path}`);
}
if (!existsSync(ballSource)) throw new Error(`Missing crystal-ball source: ${ballSource}`);

await rm(workDirectory, { recursive: true, force: true });
await mkdir(workDirectory, { recursive: true });
await mkdir(join(outputDirectory, "animations"), { recursive: true });

const io = new NodeIO();
const outputs = {
  base: join(outputDirectory, "jester-base.glb"),
  talk: join(outputDirectory, "animations/talk.glb"),
  heart: join(outputDirectory, "animations/heart.glb"),
  jazz: join(outputDirectory, "animations/jazz.glb"),
  ball: join(outputDirectory, "crystal-ball.glb"),
};

await prepareBase(io, join(sourceDirectory, sources.base), outputs.base);
await prepareAnimation(
  io,
  join(sourceDirectory, sources.talk),
  "Talk_with_Hands_Open",
  outputs.talk
);
await prepareAnimation(
  io,
  join(sourceDirectory, sources.heart),
  "Big_Heart_Gesture",
  outputs.heart
);
await prepareAnimation(
  io,
  join(sourceDirectory, sources.jazz),
  "jazz_danc",
  outputs.jazz
);
await prepareBall(ballSource, outputs.ball);

const manifest = {
  version: 1,
  sourceFiles: await Promise.all([
    ...Object.values(sources).map((filename) =>
      describe(join(sourceDirectory, filename), `source/${filename}`)
    ),
    describe(ballSource, `source/${basename(ballSource)}`),
  ]),
  outputs: await Promise.all(Object.values(outputs).map((path) => describe(path))),
};

await writeFile(
  join(outputDirectory, "asset-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`
);

for (const output of manifest.outputs) {
  console.log(`${basename(output.path)}: ${output.bytes} bytes`);
}
