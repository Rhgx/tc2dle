import { JSDOM } from "jsdom";
import { getImageUrl } from "./shared/assets.ts";
import { cleanText, getHeadingText, normalizeName } from "./shared/text.ts";
import type { ScrapedMap } from "./types.ts";

const MAPS_API_URL =
  "https://typicalcolors2.fandom.com/api.php?action=parse&page=Maps&prop=text&format=json&origin=*";
const MAP_IMAGE_MODE_PRIORITY = [
  "Attack Defense",
  "Attack/Defense",
  "King of the Hill",
  "Payload",
  "Capture the Flag",
  "Control Points",
  "Player Destruction",
  "Arena",
  "Vs. Bosses",
  "Team Deathmatch",
  // Preserve the wiki's historical misspelling so scraped rows still rank correctly.
  "Medieaval",
  "Medieval",
  "Training",
  "Infection",
  "Prop Hunt",
  "None",
];

type MapAccumulator = Omit<ScrapedMap, "group" | "status"> & {
  groups: Set<string>;
  statuses: Set<string>;
};

export async function scrapeMapsFromWiki(): Promise<ScrapedMap[]> {
  const response = await fetch(MAPS_API_URL);
  if (!response.ok) throw new Error(`TC2 maps wiki request failed with ${response.status}`);
  const json = await response.json();
  const html = json?.parse?.text?.["*"];
  if (!html) throw new Error("TC2 maps wiki API returned no rendered HTML.");
  const maps = parseMapsHtml(html);
  if (maps.length < 20) throw new Error(`Scrape returned only ${maps.length} maps.`);
  return maps;
}

function getCurrentMapGroup(text: string, currentGroup: string): string {
  const heading = cleanText(text);
  if (/Standard game\s*mode/i.test(heading)) return "Standard";
  if (/Special game\s*mode/i.test(heading)) return "Special";
  return currentGroup;
}

function normalizeMapStatus(value: string): string {
  const text = cleanText(value)
    .replace(/\u2b24/g, "")
    .replace(/\u25cf/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (/active\s*\(console\/mobile only\)/i.test(text)) return "Active (Console/Mobile Only)";
  if (/active\s*\(rare\)/i.test(text)) return "Active (Rare)";
  if (/community server/i.test(text)) return "Community Server";
  if (/seasonal/i.test(text)) return "Seasonal";
  if (/^active$/i.test(text)) return "Active";
  return text;
}

function isAllowedMapStatus(status: string): boolean {
  return ["Active", "Active (Console/Mobile Only)", "Active (Rare)", "Seasonal", "Community Server"].includes(status);
}

function isAllowedMapMode(gameMode: string): boolean {
  return !/^(infection|prop hunt)$/i.test(cleanText(gameMode));
}

function extractMapItem(item: Element, gameMode: string, group: string): ScrapedMap | null {
  if (!isAllowedMapMode(gameMode)) return null;

  const caption = item.querySelector(".lightbox-caption");
  const name = normalizeName(caption?.querySelector("a")?.textContent || "");
  if (!name) return null;

  const captionText = cleanText(caption?.textContent || "");
  const status = normalizeMapStatus(captionText.slice(name.length));
  if (!isAllowedMapStatus(status)) return null;

  const image = item.querySelector("img[data-src], img[src]");
  const imageUrl = getImageUrl(image);
  return {
    name,
    gameMode: gameMode || "None",
    group: group || "Special",
    status,
    imageUrl,
  };
}

function dedupeMaps(rows: ScrapedMap[]): ScrapedMap[] {
  const byMapMode = new Map<string, MapAccumulator>();

  rows.forEach((row) => {
    const key = `${row.name.toLowerCase()}::${row.gameMode.toLowerCase()}`;
    const item = getOrCreateMapAccumulator(byMapMode, key, row);
    if (!item.imageUrl && row.imageUrl) item.imageUrl = row.imageUrl;
    item.groups.add(row.group);
    item.statuses.add(row.status);
  });

  return keepUniqueMapImages([...byMapMode.values()])
    .map((item) => ({
      name: item.name,
      gameMode: item.gameMode,
      group: [...item.groups].sort((a, b) => a.localeCompare(b)).join(" / "),
      status: [...item.statuses].sort((a, b) => a.localeCompare(b)).join(" / "),
      imageUrl: item.imageUrl,
    }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.gameMode.localeCompare(b.gameMode));
}

function getOrCreateMapAccumulator(byMapMode: Map<string, MapAccumulator>, key: string, row: ScrapedMap): MapAccumulator {
  const existing = byMapMode.get(key);
  if (existing) return existing;

  const created = {
    name: row.name,
    gameMode: row.gameMode,
    imageUrl: row.imageUrl || "",
    groups: new Set<string>(),
    statuses: new Set<string>(),
  };
  byMapMode.set(key, created);
  return created;
}

export function keepUniqueMapImages<T extends Pick<ScrapedMap, "gameMode" | "imageUrl" | "name">>(rows: T[]): T[] {
  const seenImages = new Set();
  return rows
    .sort((a, b) => getMapModePriority(a.gameMode) - getMapModePriority(b.gameMode) || a.name.localeCompare(b.name))
    .filter((row) => {
      const imageKey = row.imageUrl.toLowerCase();
      if (!imageKey) return true;
      if (seenImages.has(imageKey)) return false;
      seenImages.add(imageKey);
      return true;
    });
}

function getMapModePriority(gameMode: string): number {
  const normalized = cleanText(gameMode);
  const index = MAP_IMAGE_MODE_PRIORITY.findIndex((mode) => mode.toLowerCase() === normalized.toLowerCase());
  return index >= 0 ? index : MAP_IMAGE_MODE_PRIORITY.length;
}

function parseMapsHtml(html: string): ScrapedMap[] {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const output = doc.querySelector(".mw-parser-output") || doc.body;
  const parsed: ScrapedMap[] = [];
  let currentGroup = "";
  let currentMode = "";

  [...output.children].forEach((element) => {
    const tag = element.tagName;
    const headingText = getHeadingText(element);

    if (tag === "H2") {
      currentGroup = getCurrentMapGroup(headingText, currentGroup);
      return;
    }

    if (tag === "H3") {
      currentMode = headingText;
      return;
    }

    if (element.classList.contains("wikia-gallery")) {
      [...element.querySelectorAll(".wikia-gallery-item")]
        .map((item) => extractMapItem(item, currentMode, currentGroup))
        .filter((map): map is ScrapedMap => Boolean(map))
        .forEach((map) => parsed.push(map));
    }
  });

  return dedupeMaps(parsed);
}
