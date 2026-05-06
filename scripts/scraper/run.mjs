import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { downloadAssets } from "./assets.mjs";
import { scrapeCosmeticsFromWiki } from "./cosmetics.mjs";
import { scrapeLoadingScreensFromWiki } from "./loadingScreens.mjs";
import { scrapeMapsFromWiki } from "./maps.mjs";
import { renderCosmeticsGeneratedFile, renderLoadingScreensGeneratedFile, renderMapsGeneratedFile, renderWeaponsGeneratedFile } from "./render.mjs";
import { scrapeWeaponsFromWiki } from "./weapons.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const weaponsOutputPath = path.join(projectRoot, "src", "data", "weapons.generated.ts");
const mapsOutputPath = path.join(projectRoot, "src", "data", "maps.generated.ts");
const cosmeticsOutputPath = path.join(projectRoot, "src", "data", "cosmetics.generated.ts");
const loadingScreensOutputPath = path.join(projectRoot, "src", "data", "loadingScreens.generated.ts");
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

  logWeapons(weapons.length, iconPaths.size);
  logMaps(maps.length, mapImagePaths.size);
  logCosmetics(cosmetics.length, cosmeticImagePaths.size);
  logLoadingScreens(loadingScreenUrls.length, backgroundPaths.size);
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
  logWeapons(weapons.length, iconPaths.size);
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
  logMaps(maps.length, imagePaths.size);
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
  logCosmetics(cosmetics.length, imagePaths.size);
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
  logLoadingScreens(loadingScreenUrls.length, backgroundPaths.size);
}

function logWeapons(count, assetCount) {
  console.log(`Scraped ${count} weapons into ${path.relative(projectRoot, weaponsOutputPath)}.`);
  console.log(`Downloaded ${assetCount} weapon icons into ${path.relative(projectRoot, weaponAssetsPath)}.`);
}

function logMaps(count, assetCount) {
  console.log(`Scraped ${count} maps into ${path.relative(projectRoot, mapsOutputPath)}.`);
  console.log(`Downloaded ${assetCount} map images into ${path.relative(projectRoot, mapAssetsPath)}.`);
}

function logCosmetics(count, assetCount) {
  console.log(`Scraped ${count} cosmetics into ${path.relative(projectRoot, cosmeticsOutputPath)}.`);
  console.log(`Downloaded ${assetCount} cosmetic images into ${path.relative(projectRoot, cosmeticAssetsPath)}.`);
}

function logLoadingScreens(count, assetCount) {
  console.log(`Scraped ${count} loading screens into ${path.relative(projectRoot, loadingScreensOutputPath)}.`);
  console.log(`Downloaded ${assetCount} loading screens into ${path.relative(projectRoot, loadingScreenAssetsPath)}.`);
}

function loadingScreenAssetItem(url, index) {
  return {
    name: path.basename(new URL(url).pathname.split("/revision/")[0]),
    namePrefix: `loading-screen-${String(index + 1).padStart(3, "0")}`,
    url,
  };
}
