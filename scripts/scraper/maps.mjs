import { JSDOM } from "jsdom";
import { getImageUrl } from "./shared/assets.mjs";
import { cleanText, getHeadingText, normalizeName } from "./shared/text.mjs";

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

export async function scrapeMapsFromWiki() {
  const response = await fetch(MAPS_API_URL);
  if (!response.ok) throw new Error(`TC2 maps wiki request failed with ${response.status}`);
  const json = await response.json();
  const html = json?.parse?.text?.["*"];
  if (!html) throw new Error("TC2 maps wiki API returned no rendered HTML.");
  const maps = parseMapsHtml(html);
  if (maps.length < 20) throw new Error(`Scrape returned only ${maps.length} maps.`);
  return maps;
}

function getCurrentMapGroup(text, currentGroup) {
  const heading = cleanText(text);
  if (/Standard game\s*mode/i.test(heading)) return "Standard";
  if (/Special game\s*mode/i.test(heading)) return "Special";
  return currentGroup;
}

function normalizeMapStatus(value) {
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

function isAllowedMapStatus(status) {
  return ["Active", "Active (Console/Mobile Only)", "Active (Rare)", "Seasonal", "Community Server"].includes(status);
}

function isAllowedMapMode(gameMode) {
  return !/^(infection|prop hunt)$/i.test(cleanText(gameMode));
}

function extractMapItem(item, gameMode, group) {
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

function dedupeMaps(rows) {
  const byMapMode = new Map();

  rows.forEach((row) => {
    const key = `${row.name.toLowerCase()}::${row.gameMode.toLowerCase()}`;
    if (!byMapMode.has(key)) {
      byMapMode.set(key, {
        name: row.name,
        gameMode: row.gameMode,
        imageUrl: row.imageUrl || "",
        groups: new Set(),
        statuses: new Set(),
      });
    }

    const item = byMapMode.get(key);
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

function keepUniqueMapImages(rows) {
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

function getMapModePriority(gameMode) {
  const normalized = cleanText(gameMode);
  const index = MAP_IMAGE_MODE_PRIORITY.findIndex((mode) => mode.toLowerCase() === normalized.toLowerCase());
  return index >= 0 ? index : MAP_IMAGE_MODE_PRIORITY.length;
}

function parseMapsHtml(html) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const output = doc.querySelector(".mw-parser-output") || doc.body;
  const parsed = [];
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
        .filter(Boolean)
        .forEach((map) => parsed.push(map));
    }
  });

  return dedupeMaps(parsed);
}
