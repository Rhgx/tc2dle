import { JSDOM } from "jsdom";
import { getImageUrl } from "./shared/assets.ts";
import { cleanText, normalizeName } from "./shared/text.ts";
import type { ScrapedCosmetic } from "./types.ts";

const COSMETICS_API_URL =
  "https://typicalcolors2.fandom.com/api.php?action=parse&page=Cosmetics&prop=text&format=json&origin=*";
const CLASS_TABLE_PATTERN = /^(.+?) Cosmetics/i;
const ALLOWED_TABLES = new Set([
  "Flanker",
  "Trooper",
  "Arsonist",
  "Annihilator",
  "Brute",
  "Mechanic",
  "Doctor",
  "Marksman",
  "Agent",
  "All-Class",
]);

type CosmeticRow = {
  name: string;
  usedBy: string;
  slot: string;
  imageUrl: string;
};

type CosmeticAccumulator = {
  name: string;
  usedBy: Set<string>;
  slots: Set<string>;
  imageUrl: string;
};

export async function scrapeCosmeticsFromWiki(): Promise<ScrapedCosmetic[]> {
  const response = await fetch(COSMETICS_API_URL);
  if (!response.ok) throw new Error(`TC2 cosmetics wiki request failed with ${response.status}`);
  const json = await response.json();
  const html = json?.parse?.text?.["*"];
  if (!html) throw new Error("TC2 cosmetics wiki API returned no rendered HTML.");
  const cosmetics = parseCosmeticsHtml(html);
  if (cosmetics.length < 50) throw new Error(`Scrape returned only ${cosmetics.length} cosmetics.`);
  return cosmetics;
}

function parseCosmeticsHtml(html: string): ScrapedCosmetic[] {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const cosmetics: CosmeticRow[] = [];

  doc.querySelectorAll("table.navbox__container").forEach((table) => {
    const tableName = getTableName(table);
    if (!tableName || !ALLOWED_TABLES.has(tableName)) return;

    const usedBy = tableName === "All-Class" ? "All Classes" : tableName;
    table.querySelectorAll("table.navbox__image-table").forEach((slotTable) => {
      const slot = normalizeSlot(slotTable.querySelector(".navbox__image-header-cell")?.textContent || "");
      if (!slot) return;

      slotTable.querySelectorAll(".navbox__image-item").forEach((item) => {
        const cosmetic = extractCosmeticItem(item, usedBy, slot);
        if (cosmetic) cosmetics.push(cosmetic);
      });
    });
  });

  return dedupeCosmetics(cosmetics);
}

function getTableName(table: Element): string {
  const headerText = cleanText(table.querySelector(".navbox__header-cell")?.childNodes?.[0]?.textContent || table.querySelector(".navbox__header-cell")?.textContent || "");
  const match = headerText.match(CLASS_TABLE_PATTERN);
  return match ? cleanText(match[1]) : "";
}

function normalizeSlot(value: string): string {
  return cleanText(value).replace(/\s+Cosmetics$/i, "");
}

function extractCosmeticItem(item: Element, usedBy: string, slot: string): CosmeticRow | null {
  const caption = item.querySelector(".navbox__image-item-caption a");
  const name = normalizeName(caption?.textContent || caption?.getAttribute("title") || "");
  if (!name) return null;

  const image = item.querySelector(".navbox__image-item-image img[data-src], .navbox__image-item-image img[src]");
  const imageUrl = getImageUrl(image);
  if (!imageUrl) return null;

  return { name, usedBy, slot, imageUrl };
}

function dedupeCosmetics(rows: CosmeticRow[]): ScrapedCosmetic[] {
  const byName = new Map<string, CosmeticAccumulator>();

  rows.forEach((row) => {
    const key = row.name.toLowerCase();
    const item = getOrCreateCosmeticAccumulator(byName, key, row);
    item.usedBy.add(row.usedBy);
    item.slots.add(row.slot);
    if (!item.imageUrl && row.imageUrl) item.imageUrl = row.imageUrl;
  });

  return [...byName.values()]
    .map((item) => ({
      name: item.name,
      usedBy: [...item.usedBy].sort(sortUsedBy),
      slots: [...item.slots].sort((a, b) => a.localeCompare(b)),
      imageUrl: item.imageUrl,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getOrCreateCosmeticAccumulator(byName: Map<string, CosmeticAccumulator>, key: string, row: CosmeticRow): CosmeticAccumulator {
  const existing = byName.get(key);
  if (existing) return existing;

  const created = {
    name: row.name,
    usedBy: new Set<string>(),
    slots: new Set<string>(),
    imageUrl: row.imageUrl,
  };
  byName.set(key, created);
  return created;
}

function sortUsedBy(a: string, b: string): number {
  return getClassOrder(a) - getClassOrder(b) || a.localeCompare(b);
}

function getClassOrder(className: string): number {
  const order = ["Flanker", "Trooper", "Arsonist", "Annihilator", "Brute", "Mechanic", "Doctor", "Marksman", "Agent", "All Classes"];
  const index = order.indexOf(className);
  return index >= 0 ? index : order.length;
}
