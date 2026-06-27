import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { scrapeCosmeticsFromWiki } from "./cosmetics.ts";
import { scrapeLoadingScreensFromWiki } from "./loadingScreens.ts";
import { keepUniqueMapImages, scrapeMapsFromWiki } from "./maps.ts";
import { downloadAssets, formatBytes, pruneAssetDirectory, summarizeAssetDirectory } from "./shared/assets.ts";
import {
  renderCosmeticsGeneratedFile,
  renderLoadingScreensGeneratedFile,
  renderManifestGeneratedFile,
  renderMapsGeneratedFile,
  renderWeaponsGeneratedFile,
} from "./shared/render.ts";
import type { GeneratedManifest, GeneratedManifestSection, ScrapedCosmetic, ScrapedMap, ScrapedWeapon } from "./types.ts";
import { scrapeWeaponsFromWiki } from "./weapons.ts";

type ScrapeTarget = "all" | "weapons" | "maps" | "cosmetics" | "loading-screens";
type AssetUrlField = "iconUrl" | "imageUrl";

type ManifestInput = {
  weapons?: ScrapedWeapon[];
  maps?: ScrapedMap[];
  cosmetics?: ScrapedCosmetic[];
  loadingScreenUrls?: string[];
};

type AssetConfig<T, K extends AssetUrlField> = {
  assetLabel: string;
  directoryPath: string;
  outputPath: string;
  publicPrefix: string;
  render: (items: T[]) => string;
  urlField: K;
};

type LocalizedAssetResult<T> = {
  assetCount: number;
  items: T[];
};

type LogConfig = {
  assetCount: number;
  assetDirectoryPath: string;
  assetLabel: string;
  itemCount: number;
  itemLabel: string;
  outputPath: string;
};

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const generatedDataPath = path.join(projectRoot, "src", "data", "generated");
const publicAssetsPath = path.join(projectRoot, "public", "tc2-assets");

const outputPaths = {
  weapons: path.join(generatedDataPath, "weapons.generated.ts"),
  maps: path.join(generatedDataPath, "maps.generated.ts"),
  cosmetics: path.join(generatedDataPath, "cosmetics.generated.ts"),
  loadingScreens: path.join(generatedDataPath, "loadingScreens.generated.ts"),
  manifest: path.join(generatedDataPath, "manifest.generated.ts"),
};

const assetDirectories = {
  weapons: path.join(publicAssetsPath, "weapons"),
  maps: path.join(publicAssetsPath, "maps"),
  cosmetics: path.join(publicAssetsPath, "cosmetics"),
  loadingScreens: path.join(publicAssetsPath, "loading-screens"),
};

const weaponAssets: AssetConfig<ScrapedWeapon, "iconUrl"> = {
  assetLabel: "Weapon icons",
  directoryPath: assetDirectories.weapons,
  outputPath: outputPaths.weapons,
  publicPrefix: "tc2-assets/weapons",
  render: renderWeaponsGeneratedFile,
  urlField: "iconUrl",
};

const mapAssets: AssetConfig<ScrapedMap, "imageUrl"> = {
  assetLabel: "Map images",
  directoryPath: assetDirectories.maps,
  outputPath: outputPaths.maps,
  publicPrefix: "tc2-assets/maps",
  render: renderMapsGeneratedFile,
  urlField: "imageUrl",
};

const cosmeticAssets: AssetConfig<ScrapedCosmetic, "imageUrl"> = {
  assetLabel: "Cosmetic images",
  directoryPath: assetDirectories.cosmetics,
  outputPath: outputPaths.cosmetics,
  publicPrefix: "tc2-assets/cosmetics",
  render: renderCosmeticsGeneratedFile,
  urlField: "imageUrl",
};

const targets = {
  all: scrapeAll,
  weapons: scrapeWeapons,
  maps: scrapeMaps,
  cosmetics: scrapeCosmetics,
  "loading-screens": scrapeLoadingScreens,
} satisfies Record<ScrapeTarget, () => Promise<void>>;

await main(parseTarget(process.argv[2]));

async function main(target: ScrapeTarget): Promise<void> {
  await mkdir(generatedDataPath, { recursive: true });
  await targets[target]();
}

function parseTarget(rawTarget = "all"): ScrapeTarget {
  if (rawTarget in targets) return rawTarget as ScrapeTarget;

  console.error(`Unknown scrape target "${rawTarget}". Use one of: ${Object.keys(targets).join(", ")}.`);
  process.exit(1);
}

async function scrapeAll(): Promise<void> {
  const [weapons, maps, cosmetics, loadingScreenUrls] = await Promise.all([
    scrapeWeaponsFromWiki(),
    scrapeMapsFromWiki(),
    scrapeCosmeticsFromWiki(),
    scrapeLoadingScreensFromWiki(),
  ]);

  const [localizedWeapons, localizedMaps, localizedCosmetics, localizedLoadingScreens] = await Promise.all([
    localizeAssetBackedItems(weapons, weaponAssets),
    localizeAssetBackedItems(maps, mapAssets),
    localizeAssetBackedItems(cosmetics, cosmeticAssets),
    localizeLoadingScreens(loadingScreenUrls),
  ]);

  const finalMaps = await finalizeLocalMaps(localizedMaps.items);
  await pruneLocalMapAssets(finalMaps);

  await Promise.all([
    writeGeneratedFile(weaponAssets, localizedWeapons.items),
    writeGeneratedFile(mapAssets, finalMaps),
    writeGeneratedFile(cosmeticAssets, localizedCosmetics.items),
    writeFile(outputPaths.loadingScreens, renderLoadingScreensGeneratedFile(localizedLoadingScreens.items), "utf8"),
  ]);
  await writeManifest({
    weapons: localizedWeapons.items,
    maps: finalMaps,
    cosmetics: localizedCosmetics.items,
    loadingScreenUrls: localizedLoadingScreens.items,
  });

  await Promise.all([
    logGeneratedData("weapons", weapons.length, localizedWeapons.assetCount, weaponAssets),
    logGeneratedData("maps", finalMaps.length, localizedMaps.assetCount, mapAssets),
    logGeneratedData("cosmetics", cosmetics.length, localizedCosmetics.assetCount, cosmeticAssets),
    logGeneratedData("loading screens", loadingScreenUrls.length, localizedLoadingScreens.assetCount, {
      assetLabel: "Loading screens",
      directoryPath: assetDirectories.loadingScreens,
      outputPath: outputPaths.loadingScreens,
    }),
  ]);
}

async function scrapeWeapons(): Promise<void> {
  const weapons = await scrapeWeaponsFromWiki();
  const localizedWeapons = await localizeAssetBackedItems(weapons, weaponAssets);

  await writeGeneratedFile(weaponAssets, localizedWeapons.items);
  await writeManifest({ weapons: localizedWeapons.items });
  await logGeneratedData("weapons", weapons.length, localizedWeapons.assetCount, weaponAssets);
}

async function scrapeMaps(): Promise<void> {
  const maps = await scrapeMapsFromWiki();
  const localizedMaps = await localizeAssetBackedItems(maps, mapAssets);
  const finalMaps = await finalizeLocalMaps(localizedMaps.items);

  await pruneLocalMapAssets(finalMaps);
  await writeGeneratedFile(mapAssets, finalMaps);
  await writeManifest({ maps: finalMaps });
  await logGeneratedData("maps", finalMaps.length, localizedMaps.assetCount, mapAssets);
}

async function scrapeCosmetics(): Promise<void> {
  const cosmetics = await scrapeCosmeticsFromWiki();
  const localizedCosmetics = await localizeAssetBackedItems(cosmetics, cosmeticAssets);

  await writeGeneratedFile(cosmeticAssets, localizedCosmetics.items);
  await writeManifest({ cosmetics: localizedCosmetics.items });
  await logGeneratedData("cosmetics", cosmetics.length, localizedCosmetics.assetCount, cosmeticAssets);
}

async function scrapeLoadingScreens(): Promise<void> {
  const loadingScreenUrls = await scrapeLoadingScreensFromWiki();
  const localizedLoadingScreens = await localizeLoadingScreens(loadingScreenUrls);

  await writeFile(outputPaths.loadingScreens, renderLoadingScreensGeneratedFile(localizedLoadingScreens.items), "utf8");
  await writeManifest({ loadingScreenUrls: localizedLoadingScreens.items });
  await logGeneratedData("loading screens", loadingScreenUrls.length, localizedLoadingScreens.assetCount, {
    assetLabel: "Loading screens",
    directoryPath: assetDirectories.loadingScreens,
    outputPath: outputPaths.loadingScreens,
  });
}

async function localizeAssetBackedItems<T extends { name: string } & Record<K, string>, K extends AssetUrlField>(
  items: T[],
  config: AssetConfig<T, K>,
): Promise<LocalizedAssetResult<T>> {
  const pathByRemoteUrl = await downloadAssets(
    items.map((item) => ({ name: item.name, url: item[config.urlField] })),
    config.directoryPath,
    config.publicPrefix,
    projectRoot,
  );

  return {
    assetCount: pathByRemoteUrl.size,
    items: items.map((item) => ({
      ...item,
      [config.urlField]: pathByRemoteUrl.get(item[config.urlField]) || "",
    })),
  };
}

async function localizeLoadingScreens(urls: string[]): Promise<LocalizedAssetResult<string>> {
  const pathByRemoteUrl = await downloadAssets(
    urls.map((url, index) => ({
      name: path.basename(new URL(url).pathname.split("/revision/")[0]),
      namePrefix: `loading-screen-${String(index + 1).padStart(3, "0")}`,
      url,
    })),
    assetDirectories.loadingScreens,
    "tc2-assets/loading-screens",
    projectRoot,
  );

  return {
    assetCount: pathByRemoteUrl.size,
    items: urls.flatMap((url) => pathByRemoteUrl.get(url) || []),
  };
}

async function writeGeneratedFile<T, K extends AssetUrlField>(config: AssetConfig<T, K>, items: T[]): Promise<void> {
  await writeFile(config.outputPath, config.render(items), "utf8");
}

async function logGeneratedData(
  itemLabel: string,
  itemCount: number,
  assetCount: number,
  config: Pick<AssetConfig<unknown, AssetUrlField>, "assetLabel" | "directoryPath" | "outputPath">,
): Promise<void> {
  await logSummary({
    assetCount,
    assetDirectoryPath: config.directoryPath,
    assetLabel: config.assetLabel,
    itemCount,
    itemLabel,
    outputPath: config.outputPath,
  });
}

async function logSummary({ assetCount, assetDirectoryPath, assetLabel, itemCount, itemLabel, outputPath }: LogConfig): Promise<void> {
  const summary = await summarizeAssetDirectory(assetDirectoryPath);
  console.log(`Scraped ${itemCount} ${itemLabel} into ${path.relative(projectRoot, outputPath)}.`);
  console.log(`${assetLabel}: ${summary.count} WebP files, ${formatBytes(summary.bytes)} (${assetCount} referenced this run).`);
}

async function pruneLocalMapAssets(maps: ScrapedMap[]): Promise<void> {
  const expectedImages = maps.map((map) => path.basename(map.imageUrl)).filter(Boolean);
  await pruneAssetDirectory(assetDirectories.maps, new Set(expectedImages));
}

async function writeManifest(input: ManifestInput): Promise<void> {
  const existingManifest = await readExistingManifest();
  const manifest: GeneratedManifest = {
    generatedAt: new Date().toISOString(),
    weapons: await manifestSection(input.weapons, assetDirectories.weapons, existingManifest.weapons),
    maps: await manifestSection(input.maps, assetDirectories.maps, existingManifest.maps),
    cosmetics: await manifestSection(input.cosmetics, assetDirectories.cosmetics, existingManifest.cosmetics),
    loadingScreens: await manifestSection(input.loadingScreenUrls, assetDirectories.loadingScreens, existingManifest.loadingScreens),
  };

  await writeFile(outputPaths.manifest, renderManifestGeneratedFile(manifest), "utf8");
}

async function manifestSection(
  items: unknown[] | undefined,
  assetsPath: string,
  existingSection?: GeneratedManifestSection,
): Promise<GeneratedManifestSection> {
  const assets = await summarizeAssetDirectory(assetsPath);
  return {
    count: Array.isArray(items) ? items.length : existingSection?.count || 0,
    assetCount: assets.count,
    assetBytes: assets.bytes,
  };
}

async function finalizeLocalMaps(maps: ScrapedMap[]): Promise<ScrapedMap[]> {
  const uniqueMaps = keepUniqueMapImages(maps);
  const visuallyUniqueMaps = await keepUniqueMapVisuals(uniqueMaps);
  return visuallyUniqueMaps.sort((a, b) => a.name.localeCompare(b.name) || a.gameMode.localeCompare(b.gameMode));
}

async function keepUniqueMapVisuals(maps: ScrapedMap[]): Promise<ScrapedMap[]> {
  const kept: ScrapedMap[] = [];
  const signaturesByName = new Map<string, string[]>();

  for (const map of maps) {
    const nameKey = map.name.toLowerCase();
    const signature = await mapImageSignature(map.imageUrl);
    const signatures = signaturesByName.get(nameKey) || [];

    if (signature && signatures.some((existing) => signatureDistance(signature, existing) <= 2)) {
      continue;
    }

    kept.push(map);
    if (signature) {
      signatures.push(signature);
      signaturesByName.set(nameKey, signatures);
    }
  }

  return kept;
}

async function mapImageSignature(imageUrl: string): Promise<string> {
  if (!imageUrl) return "";

  try {
    const source = await readFile(path.join(projectRoot, "public", imageUrl));
    const bytes = await sharp(source)
      .resize(8, 8, { fit: "fill" })
      .grayscale()
      .raw()
      .toBuffer();
    const average = bytes.reduce((sum, value) => sum + value, 0) / bytes.length;
    return [...bytes].map((value) => (value >= average ? "1" : "0")).join("");
  } catch {
    return "";
  }
}

function signatureDistance(left: string, right: string): number {
  let distance = 0;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) distance += 1;
  }
  return distance;
}

async function readExistingManifest(): Promise<Partial<GeneratedManifest>> {
  try {
    const source = await readFile(outputPaths.manifest, "utf8");
    const start = source.indexOf("{");
    const end = source.lastIndexOf("}");
    if (start < 0 || end < start) return {};
    return JSON.parse(source.slice(start, end + 1));
  } catch {
    return {};
  }
}
