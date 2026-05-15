import { createHash } from "node:crypto";
import { access, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { cleanText } from "./text.mjs";

export function normalizeImageUrl(url) {
  if (!url) return "";
  const absolute = url.startsWith("//")
    ? `https:${url}`
    : url.startsWith("/")
      ? `https://typicalcolors2.fandom.com${url}`
      : url;

  if (!absolute.includes("static.wikia.nocookie.net")) return absolute;

  const parsed = new URL(absolute);
  const latestIndex = parsed.pathname.indexOf("/revision/latest");
  if (latestIndex < 0) return absolute;

  const cb = parsed.searchParams.get("cb");
  parsed.pathname = parsed.pathname.slice(0, latestIndex + "/revision/latest".length);
  parsed.search = cb ? `?cb=${encodeURIComponent(cb)}` : "";
  return parsed.toString();
}

export function getImageUrl(img) {
  if (!img) return "";
  const raw = img.getAttribute("data-src") || img.getAttribute("src") || "";
  return normalizeImageUrl(raw);
}

export function isStaticBackgroundUrl(url) {
  try {
    const parsed = new URL(url);
    return !/\.(gif)(?:$|[/?#])/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

export async function downloadAssets(items, directoryPath, publicPrefix, projectRoot) {
  await prepareAssetDirectory(directoryPath, projectRoot);

  const uniqueItems = [...new Map(items.filter((item) => item.url).map((item) => [item.url, item])).values()];
  const pathByUrl = new Map();
  let cursor = 0;
  const workerCount = 8;

  async function worker() {
    while (cursor < uniqueItems.length) {
      const item = uniqueItems[cursor];
      cursor += 1;

      const baseName = item.namePrefix || slugifyFileName(item.name);
      const fileName = item.fileName || `${baseName}-${hashValue(item.url)}.webp`;
      const outputPath = path.join(directoryPath, fileName);
      await writeAsset(item.url, outputPath, directoryPath, path.parse(fileName).name);
      pathByUrl.set(item.url, `${publicPrefix}/${fileName}`);
    }
  }

  await Promise.all(Array.from({ length: Math.min(workerCount, uniqueItems.length) }, worker));
  await pruneAssetDirectory(directoryPath, new Set([...pathByUrl.values()].map((url) => path.basename(url))));
  return pathByUrl;
}

function slugifyFileName(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "asset";
}

function hashValue(value) {
  return createHash("sha1").update(value).digest("hex").slice(0, 10);
}

async function prepareAssetDirectory(directoryPath, projectRoot) {
  const resolved = path.resolve(directoryPath);
  const publicRoot = path.join(projectRoot, "public");
  if (!resolved.startsWith(publicRoot)) {
    throw new Error(`Refusing to clean asset directory outside public: ${resolved}`);
  }

  await mkdir(resolved, { recursive: true });
}

async function writeAsset(url, outputPath, directoryPath, outputBaseName) {
  if (await fileExists(outputPath)) return;

  const existingPath = await findExistingAsset(directoryPath, outputBaseName);
  if (existingPath) {
    await writeWebpAsset(await readExistingAsset(existingPath), outputPath);
    return;
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Asset request failed with ${response.status}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeWebpAsset(bytes, outputPath);
}

async function writeWebpAsset(bytes, outputPath) {
  const webp = await sharp(bytes).webp({ quality: 82, effort: 5 }).toBuffer();
  await writeFile(outputPath, webp);
}

async function findExistingAsset(directoryPath, outputBaseName) {
  const entries = await readdir(directoryPath).catch(() => []);
  const match = entries.find((entry) => path.parse(entry).name === outputBaseName && path.extname(entry).toLowerCase() !== ".webp");
  return match ? path.join(directoryPath, match) : "";
}

async function readExistingAsset(filePath) {
  const { readFile } = await import("node:fs/promises");
  return readFile(filePath);
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function pruneAssetDirectory(directoryPath, expectedFileNames) {
  const entries = await readdir(directoryPath).catch(() => []);
  await Promise.all(entries.map(async (entry) => {
    if (expectedFileNames.has(entry)) return;
    await rm(path.join(directoryPath, entry), { force: true, recursive: true });
  }));
}

export async function summarizeAssetDirectory(directoryPath) {
  const entries = await readdir(directoryPath).catch(() => []);
  let count = 0;
  let bytes = 0;

  await Promise.all(entries.map(async (entry) => {
    const filePath = path.join(directoryPath, entry);
    const info = await stat(filePath);
    if (!info.isFile()) return;
    count += 1;
    bytes += info.size;
  }));

  return { count, bytes };
}

export function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
