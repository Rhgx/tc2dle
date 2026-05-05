import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
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

      const extension = getImageExtension(item.url);
      const fileName = `${slugifyFileName(item.name)}-${hashValue(item.url)}${extension}`;
      const outputPath = path.join(directoryPath, fileName);
      await downloadAsset(item.url, outputPath);
      pathByUrl.set(item.url, `${publicPrefix}/${fileName}`);
    }
  }

  await Promise.all(Array.from({ length: Math.min(workerCount, uniqueItems.length) }, worker));
  return pathByUrl;
}

function getImageExtension(url) {
  try {
    const parsed = new URL(url);
    const withoutRevision = parsed.pathname.split("/revision/")[0];
    const extension = path.extname(withoutRevision).toLowerCase();
    return extension || ".png";
  } catch {
    return ".png";
  }
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

  await rm(resolved, { recursive: true, force: true });
  await mkdir(resolved, { recursive: true });
}

async function downloadAsset(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Asset request failed with ${response.status}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, bytes);
}
