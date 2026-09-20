import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const publicRoot = join(root, "public");
const budgets = {
  publicBytes: 145 * 1024 * 1024,
  largestAssetBytes: 11 * 1024 * 1024,
  globalCssBytes: 500 * 1024,
  livingOracleCssBytes: 24 * 1024,
  selectedCharacterAssetBytes: 3.5 * 1024 * 1024,
  jester3DBaseBytes: 8 * 1024 * 1024,
  jester3DAnimationBytes: 2 * 1024 * 1024,
  jester3DBallBytes: 3 * 1024 * 1024,
  jester3DInitialTransferBytes: 12 * 1024 * 1024,
};

const characterAssets = [
  "public/themes/jester-oracle.png",
  "public/themes/chaos-crystal-ball.png",
  "public/themes/love-crystal-ball.png",
  "public/themes/eclipse-crystal.png",
  "public/themes/DND.crystal.png",
];
const jester3DBase = "public/characters/jester/v1/jester-base.glb";
const jester3DBall = "public/characters/jester/v1/crystal-ball.glb";
const jester3DAnimations = [
  "public/characters/jester/v1/animations/talk.glb",
  "public/characters/jester/v1/animations/heart.glb",
  "public/characters/jester/v1/animations/jazz.glb",
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? walk(path) : path;
    })
  );
  return nested.flat();
}

function formatMiB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

const assets = await walk(publicRoot);
const assetStats = await Promise.all(
  assets.map(async (path) => ({ path, bytes: (await stat(path)).size }))
);
const publicBytes = assetStats.reduce((total, asset) => total + asset.bytes, 0);
const largestAsset = assetStats.sort((a, b) => b.bytes - a.bytes)[0];
const globalCssBytes = (await stat(join(root, "app/globals.css"))).size;
const livingOracleCssBytes = (
  await stat(join(root, "app/styles/living-oracle.css"))
).size;
const selectedCharacterAssets = await Promise.all(
  characterAssets.map(async (path) => ({
    path,
    bytes: (await stat(join(root, path))).size,
  }))
);
const largestSelectedCharacterAsset = selectedCharacterAssets.sort(
  (left, right) => right.bytes - left.bytes
)[0];
const jester3DBaseBytes = (await stat(join(root, jester3DBase))).size;
const jester3DBallBytes = (await stat(join(root, jester3DBall))).size;
const jester3DAnimationBytes = (
  await Promise.all(
    jester3DAnimations.map(async (path) => (await stat(join(root, path))).size)
  )
).reduce((total, bytes) => total + bytes, 0);
const jester3DInitialTransferBytes = jester3DBaseBytes + jester3DBallBytes;

const checks = [
  {
    name: "public assets",
    actual: publicBytes,
    limit: budgets.publicBytes,
    detail: formatMiB(publicBytes),
  },
  {
    name: `largest asset (${relative(root, largestAsset.path)})`,
    actual: largestAsset.bytes,
    limit: budgets.largestAssetBytes,
    detail: formatMiB(largestAsset.bytes),
  },
  {
    name: "legacy global CSS",
    actual: globalCssBytes,
    limit: budgets.globalCssBytes,
    detail: `${(globalCssBytes / 1024).toFixed(1)} KiB`,
  },
  {
    name: "Living Oracle CSS",
    actual: livingOracleCssBytes,
    limit: budgets.livingOracleCssBytes,
    detail: `${(livingOracleCssBytes / 1024).toFixed(1)} KiB`,
  },
  {
    name: `selected character entry asset (${largestSelectedCharacterAsset.path})`,
    actual: largestSelectedCharacterAsset.bytes,
    limit: budgets.selectedCharacterAssetBytes,
    detail: formatMiB(largestSelectedCharacterAsset.bytes),
  },
  {
    name: "Jester 3D base",
    actual: jester3DBaseBytes,
    limit: budgets.jester3DBaseBytes,
    detail: formatMiB(jester3DBaseBytes),
  },
  {
    name: "Jester 3D animation clips",
    actual: jester3DAnimationBytes,
    limit: budgets.jester3DAnimationBytes,
    detail: formatMiB(jester3DAnimationBytes),
  },
  {
    name: "Jester 3D crystal ball",
    actual: jester3DBallBytes,
    limit: budgets.jester3DBallBytes,
    detail: formatMiB(jester3DBallBytes),
  },
  {
    name: "Jester 3D initial model transfer",
    actual: jester3DInitialTransferBytes,
    limit: budgets.jester3DInitialTransferBytes,
    detail: formatMiB(jester3DInitialTransferBytes),
  },
];

let failed = false;
for (const check of checks) {
  const status = check.actual <= check.limit ? "PASS" : "FAIL";
  console.log(`${status} ${check.name}: ${check.detail}`);
  failed ||= status === "FAIL";
}

if (failed) {
  console.error("Performance budget exceeded. Optimize or explicitly review the budget.");
  process.exitCode = 1;
}
