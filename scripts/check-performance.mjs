import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const publicRoot = join(root, "public");
const budgets = {
  publicBytes: 195 * 1024 * 1024,
  largestAssetBytes: 11 * 1024 * 1024,
  globalCssBytes: 500 * 1024,
  livingOracleCssBytes: 32 * 1024,
  selectedCharacterAssetBytes: 3.5 * 1024 * 1024,
  jester3DBaseBytes: 8 * 1024 * 1024,
  jester3DAnimationBytes: 2 * 1024 * 1024,
  jester3DBallBytes: 3 * 1024 * 1024,
  jester3DInitialTransferBytes: 12 * 1024 * 1024,
  love3DBaseBytes: 7 * 1024 * 1024,
  love3DHeartBytes: 4 * 1024 * 1024,
  love3DPodiumBytes: 4.5 * 1024 * 1024,
  love3DInitialTransferBytes: 12 * 1024 * 1024,
  love3DReviewCeilingBytes: 14 * 1024 * 1024,
  dragon3DBaseBytes: 8 * 1024 * 1024,
  dragon3DD20Bytes: 4.5 * 1024 * 1024,
  dragon3DAltarBytes: 4.5 * 1024 * 1024,
  dragon3DReviewCeilingBytes: 16 * 1024 * 1024,
  chaos3DPedestalBytes: 4.75 * 1024 * 1024,
  chaos3DRiftBytes: 2.75 * 1024 * 1024,
  chaos3DVortexBytes: 0.5 * 1024 * 1024,
  chaos3DInitialTransferBytes: 8 * 1024 * 1024,
  chaos3DReviewCeilingBytes: 9 * 1024 * 1024,
  eclipse3DEmpressBytes: 10 * 1024 * 1024,
  eclipse3DAltarBytes: 7 * 1024 * 1024,
  eclipse3DInitialTransferBytes: 16 * 1024 * 1024,
  eclipse3DReviewCeilingBytes: 18 * 1024 * 1024,
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
const love3DBase = "public/characters/love/v1/love-base.glb";
const love3DHeart = "public/characters/love/v1/heart-crystal.glb";
const love3DPodium = "public/characters/love/v1/podium.glb";
const dragon3DBase = "public/characters/dragon/v1/dragon.glb";
const dragon3DD20 = "public/characters/dragon/v1/mystic-d20.glb";
const dragon3DAltar = "public/characters/dragon/v1/arcane-altar.glb";
const chaos3DPedestal = "public/characters/chaos/v1/pedestal.glb";
const chaos3DRift = "public/characters/chaos/v1/rift-crystal.glb";
const chaos3DVortex = "public/characters/chaos/v1/vortex.webp";
const eclipse3DEmpress = "public/characters/eclipse/v1/empress.glb";
const eclipse3DAltar = "public/characters/eclipse/v1/celestial-altar.glb";

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
const love3DBaseBytes = (await stat(join(root, love3DBase))).size;
const love3DHeartBytes = (await stat(join(root, love3DHeart))).size;
const love3DPodiumBytes = (await stat(join(root, love3DPodium))).size;
const love3DInitialTransferBytes = love3DBaseBytes + love3DHeartBytes + love3DPodiumBytes;
const dragon3DBaseBytes = (await stat(join(root, dragon3DBase))).size;
const dragon3DD20Bytes = (await stat(join(root, dragon3DD20))).size;
const dragon3DAltarBytes = (await stat(join(root, dragon3DAltar))).size;
const dragon3DInitialTransferBytes = dragon3DBaseBytes + dragon3DD20Bytes + dragon3DAltarBytes;
const chaos3DPedestalBytes = (await stat(join(root, chaos3DPedestal))).size;
const chaos3DRiftBytes = (await stat(join(root, chaos3DRift))).size;
const chaos3DVortexBytes = (await stat(join(root, chaos3DVortex))).size;
const chaos3DInitialTransferBytes = chaos3DPedestalBytes + chaos3DRiftBytes + chaos3DVortexBytes;
const eclipse3DEmpressBytes = (await stat(join(root, eclipse3DEmpress))).size;
const eclipse3DAltarBytes = (await stat(join(root, eclipse3DAltar))).size;
const eclipse3DInitialTransferBytes = eclipse3DEmpressBytes + eclipse3DAltarBytes;

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
  { name: "Love 3D base", actual: love3DBaseBytes, limit: budgets.love3DBaseBytes, detail: formatMiB(love3DBaseBytes) },
  { name: "Love 3D heart", actual: love3DHeartBytes, limit: budgets.love3DHeartBytes, detail: formatMiB(love3DHeartBytes) },
  { name: "Love 3D podium", actual: love3DPodiumBytes, limit: budgets.love3DPodiumBytes, detail: formatMiB(love3DPodiumBytes) },
  { name: "Love 3D initial transfer target", actual: love3DInitialTransferBytes, limit: budgets.love3DInitialTransferBytes, detail: formatMiB(love3DInitialTransferBytes) },
  { name: "Love 3D review ceiling", actual: love3DInitialTransferBytes, limit: budgets.love3DReviewCeilingBytes, detail: formatMiB(love3DInitialTransferBytes) },
  { name: "Dragon 3D guardian", actual: dragon3DBaseBytes, limit: budgets.dragon3DBaseBytes, detail: formatMiB(dragon3DBaseBytes) },
  { name: "Dragon 3D Mystic D20", actual: dragon3DD20Bytes, limit: budgets.dragon3DD20Bytes, detail: formatMiB(dragon3DD20Bytes) },
  { name: "Dragon 3D Arcane Altar", actual: dragon3DAltarBytes, limit: budgets.dragon3DAltarBytes, detail: formatMiB(dragon3DAltarBytes) },
  { name: "Dungeon 3D review ceiling", actual: dragon3DInitialTransferBytes, limit: budgets.dragon3DReviewCeilingBytes, detail: formatMiB(dragon3DInitialTransferBytes) },
  { name: "Chaos 3D pedestal", actual: chaos3DPedestalBytes, limit: budgets.chaos3DPedestalBytes, detail: formatMiB(chaos3DPedestalBytes) },
  { name: "Chaos 3D shared Rift", actual: chaos3DRiftBytes, limit: budgets.chaos3DRiftBytes, detail: formatMiB(chaos3DRiftBytes) },
  { name: "Chaos 3D vortex", actual: chaos3DVortexBytes, limit: budgets.chaos3DVortexBytes, detail: formatMiB(chaos3DVortexBytes) },
  { name: "Chaos 3D initial transfer target", actual: chaos3DInitialTransferBytes, limit: budgets.chaos3DInitialTransferBytes, detail: formatMiB(chaos3DInitialTransferBytes) },
  { name: "Chaos 3D review ceiling", actual: chaos3DInitialTransferBytes, limit: budgets.chaos3DReviewCeilingBytes, detail: formatMiB(chaos3DInitialTransferBytes) },
  { name: "Eclipse 3D Empress", actual: eclipse3DEmpressBytes, limit: budgets.eclipse3DEmpressBytes, detail: formatMiB(eclipse3DEmpressBytes) },
  { name: "Eclipse 3D altar", actual: eclipse3DAltarBytes, limit: budgets.eclipse3DAltarBytes, detail: formatMiB(eclipse3DAltarBytes) },
  { name: "Eclipse 3D initial transfer target", actual: eclipse3DInitialTransferBytes, limit: budgets.eclipse3DInitialTransferBytes, detail: formatMiB(eclipse3DInitialTransferBytes) },
  { name: "Eclipse 3D review ceiling", actual: eclipse3DInitialTransferBytes, limit: budgets.eclipse3DReviewCeilingBytes, detail: formatMiB(eclipse3DInitialTransferBytes) },
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
