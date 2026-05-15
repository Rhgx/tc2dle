import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scrapeCosmeticsFromWiki } from "./cosmetics.mjs";
import { scrapeLoadingScreensFromWiki } from "./loadingScreens.mjs";
import { scrapeMapsFromWiki } from "./maps.mjs";
import { downloadAssets, formatBytes, summarizeAssetDirectory } from "./shared/assets.mjs";
import { renderCosmeticsGeneratedFile, renderLoadingScreensGeneratedFile, renderManifestGeneratedFile, renderMapsGeneratedFile, renderWeaponsGeneratedFile } from "./shared/render.mjs";
import { scrapeWeaponsFromWiki } from "./weapons.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const generatedDataPath = path.join(projectRoot, "src", "data", "generated");
const weaponsOutputPath = path.join(generatedDataPath, "weapons.generated.ts");
const mapsOutputPath = path.join(generatedDataPath, "maps.generated.ts");
const cosmeticsOutputPath = path.join(generatedDataPath, "cosmetics.generated.ts");
const loadingScreensOutputPath = path.join(generatedDataPath, "loadingScreens.generated.ts");
const manifestOutputPath = path.join(generatedDataPath, "manifest.generated.ts");
const weaponAssetsPath = path.join(projectRoot, "public", "tc2-assets", "weapons");
const mapAssetsPath = path.join(projectRoot, "public", "tc2-assets", "maps");
const cosmeticAssetsPath = path.join(projectRoot, "public", "tc2-assets", "cosmetics");
const loadingScreenAssetsPath = path.join(projectRoot, "public", "tc2-assets", "loading-screens");

const target = process.argv[2] || "all";
const validTargets = new Set(["all", "weapons", "maps", "cosmetics", "loading-screens"]);

if (!validTargets.has(target)) {
  console.error(`Unknown scrape target "${target}". Use one of: all, weapons, maps, cosmetics, loading-screens.`);
  process.exit(1);
}

await mkdir(path.dirname(weaponsOutputPath), { recursive: true });

if (target === "weapons") {
  await scrapeWeapons();
}

if (target === "maps") {
  await scrapeMaps();
}

if (target === "cosmetics") {
  await scrapeCosmetics();
}

if (target === "loading-screens") {
  await scrapeLoadingScreens();
}

if (target === "all") {
  const [weapons, maps, cosmetics, loadingScreenUrls] = await Promise.all([
    scrapeWeaponsFromWiki(),
    scrapeMapsFromWiki(),
    scrapeCosmeticsFromWiki(),
    scrapeLoadingScreensFromWiki(),
  ]);

  const [iconPaths, mapImagePaths, cosmeticImagePaths, backgroundPaths] = await Promise.all([
    downloadAssets(
      weapons.map((weapon) => ({ name: weapon.name, url: weapon.iconUrl })),
      weaponAssetsPath,
      "tc2-assets/weapons",
      projectRoot,
    ),
    downloadAssets(
      maps.map((map) => ({ name: map.name, url: map.imageUrl })),
      mapAssetsPath,
      "tc2-assets/maps",
      projectRoot,
    ),
    downloadAssets(
      cosmetics.map((cosmetic) => ({ name: cosmetic.name, url: cosmetic.imageUrl })),
      cosmeticAssetsPath,
      "tc2-assets/cosmetics",
      projectRoot,
    ),
    downloadAssets(
      loadingScreenUrls.map((url, index) => loadingScreenAssetItem(url, index)),
      loadingScreenAssetsPath,
      "tc2-assets/loading-screens",
      projectRoot,
    ),
  ]);

  const localWeapons = weapons.map((weapon) => ({ ...weapon, iconUrl: iconPaths.get(weapon.iconUrl) || "" }));
  const localMaps = maps.map((map) => ({ ...map, imageUrl: mapImagePaths.get(map.imageUrl) || "" }));
  const localCosmetics = cosmetics.map((cosmetic) => ({ ...cosmetic, imageUrl: cosmeticImagePaths.get(cosmetic.imageUrl) || "" }));
  const localLoadingScreenUrls = loadingScreenUrls.map((url) => backgroundPaths.get(url)).filter(Boolean);

  await Promise.all([
    writeFile(weaponsOutputPath, renderWeaponsGeneratedFile(localWeapons), "utf8"),
    writeFile(mapsOutputPath, renderMapsGeneratedFile(localMaps), "utf8"),
    writeFile(cosmeticsOutputPath, renderCosmeticsGeneratedFile(localCosmetics), "utf8"),
    writeFile(loadingScreensOutputPath, renderLoadingScreensGeneratedFile(localLoadingScreenUrls), "utf8"),
  ]);
  await writeManifest({ weapons: localWeapons, maps: localMaps, cosmetics: localCosmetics, loadingScreenUrls: localLoadingScreenUrls });

  await logWeapons(weapons.length, iconPaths.size);
  await logMaps(maps.length, mapImagePaths.size);
  await logCosmetics(cosmetics.length, cosmeticImagePaths.size);
  await logLoadingScreens(loadingScreenUrls.length, backgroundPaths.size);
}

async function scrapeWeapons() {
  const weapons = await scrapeWeaponsFromWiki();
  const iconPaths = await downloadAssets(
    weapons.map((weapon) => ({ name: weapon.name, url: weapon.iconUrl })),
    weaponAssetsPath,
    "tc2-assets/weapons",
    projectRoot,
  );
  const localWeapons = weapons.map((weapon) => ({ ...weapon, iconUrl: iconPaths.get(weapon.iconUrl) || "" }));
  await writeFile(weaponsOutputPath, renderWeaponsGeneratedFile(localWeapons), "utf8");
  await writeManifest({ weapons: localWeapons });
  await logWeapons(weapons.length, iconPaths.size);
}

async function scrapeMaps() {
  const maps = await scrapeMapsFromWiki();
  const imagePaths = await downloadAssets(
    maps.map((map) => ({ name: map.name, url: map.imageUrl })),
    mapAssetsPath,
    "tc2-assets/maps",
    projectRoot,
  );
  const localMaps = maps.map((map) => ({ ...map, imageUrl: imagePaths.get(map.imageUrl) || "" }));
  await writeFile(mapsOutputPath, renderMapsGeneratedFile(localMaps), "utf8");
  await writeManifest({ maps: localMaps });
  await logMaps(maps.length, imagePaths.size);
}

async function scrapeCosmetics() {
  const cosmetics = await scrapeCosmeticsFromWiki();
  const imagePaths = await downloadAssets(
    cosmetics.map((cosmetic) => ({ name: cosmetic.name, url: cosmetic.imageUrl })),
    cosmeticAssetsPath,
    "tc2-assets/cosmetics",
    projectRoot,
  );
  const localCosmetics = cosmetics.map((cosmetic) => ({ ...cosmetic, imageUrl: imagePaths.get(cosmetic.imageUrl) || "" }));
  await writeFile(cosmeticsOutputPath, renderCosmeticsGeneratedFile(localCosmetics), "utf8");
  await writeManifest({ cosmetics: localCosmetics });
  await logCosmetics(cosmetics.length, imagePaths.size);
}

async function scrapeLoadingScreens() {
  const loadingScreenUrls = await scrapeLoadingScreensFromWiki();
  const backgroundPaths = await downloadAssets(
    loadingScreenUrls.map((url, index) => loadingScreenAssetItem(url, index)),
    loadingScreenAssetsPath,
    "tc2-assets/loading-screens",
    projectRoot,
  );
  const localLoadingScreenUrls = loadingScreenUrls.map((url) => backgroundPaths.get(url)).filter(Boolean);
  await writeFile(loadingScreensOutputPath, renderLoadingScreensGeneratedFile(localLoadingScreenUrls), "utf8");
  await writeManifest({ loadingScreenUrls: localLoadingScreenUrls });
  await logLoadingScreens(loadingScreenUrls.length, backgroundPaths.size);
}

async function logWeapons(count, assetCount) {
  console.log(`Scraped ${count} weapons into ${path.relative(projectRoot, weaponsOutputPath)}.`);
  await logAssetSummary("Weapon icons", assetCount, weaponAssetsPath);
}

async function logMaps(count, assetCount) {
  console.log(`Scraped ${count} maps into ${path.relative(projectRoot, mapsOutputPath)}.`);
  await logAssetSummary("Map images", assetCount, mapAssetsPath);
}

async function logCosmetics(count, assetCount) {
  console.log(`Scraped ${count} cosmetics into ${path.relative(projectRoot, cosmeticsOutputPath)}.`);
  await logAssetSummary("Cosmetic images", assetCount, cosmeticAssetsPath);
}

async function logLoadingScreens(count, assetCount) {
  console.log(`Scraped ${count} loading screens into ${path.relative(projectRoot, loadingScreensOutputPath)}.`);
  await logAssetSummary("Loading screens", assetCount, loadingScreenAssetsPath);
}

function loadingScreenAssetItem(url, index) {
  return {
    name: path.basename(new URL(url).pathname.split("/revision/")[0]),
    namePrefix: `loading-screen-${String(index + 1).padStart(3, "0")}`,
    url,
  };
}

async function logAssetSummary(label, scrapedCount, directoryPath) {
  const summary = await summarizeAssetDirectory(directoryPath);
  console.log(`${label}: ${summary.count} WebP files, ${formatBytes(summary.bytes)} (${scrapedCount} referenced this run).`);
}

async function writeManifest({ weapons, maps, cosmetics, loadingScreenUrls }) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    weapons: await manifestSection(weapons, weaponAssetsPath),
    maps: await manifestSection(maps, mapAssetsPath),
    cosmetics: await manifestSection(cosmetics, cosmeticAssetsPath),
    loadingScreens: await manifestSection(loadingScreenUrls, loadingScreenAssetsPath),
  };

  await writeFile(manifestOutputPath, renderManifestGeneratedFile(manifest), "utf8");
}

async function manifestSection(items, assetsPath) {
  const assets = await summarizeAssetDirectory(assetsPath);
  return {
    count: Array.isArray(items) ? items.length : 0,
    assetCount: assets.count,
    assetBytes: assets.bytes,
  };
}
