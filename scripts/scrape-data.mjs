import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const WIKI_API_URL =
  "https://typicalcolors2.fandom.com/api.php?action=parse&page=Weapons&prop=text&format=json&origin=*";
const LOADING_SCREENS_CATEGORY_API =
  "https://typicalcolors2.fandom.com/api.php?action=query&list=categorymembers&cmtitle=Category:Loading_screens&cmtype=file&cmlimit=max&format=json&origin=*";

const CLASSES = [
  "Flanker",
  "Trooper",
  "Arsonist",
  "Annihilator",
  "Brute",
  "Mechanic",
  "Doctor",
  "Marksman",
  "Agent",
  "All Classes",
];

const SOURCE_WORDS = [
  "Stock",
  "Shop",
  "Item Drop",
  "Battle Pass",
  "Distributed",
  "Achievement",
  "Intel Shop",
  "Contract",
  "Crate",
  "Event",
  "Exclusive",
  "Community",
];

function cleanText(value) {
  return String(value || "")
    .replace(/\[[^\]]*edit[^\]]*\]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textWithBreaks(element) {
  const clone = element.cloneNode(true);
  clone.querySelectorAll("script, style, .mw-editsection, sup").forEach((node) => node.remove());
  clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  return clone.textContent.split("\n").map(cleanText).filter(Boolean);
}

function cellText(element) {
  if (!element) return "";
  const clone = element.cloneNode(true);
  clone.querySelectorAll("script, style, .mw-editsection, sup, img").forEach((node) => node.remove());
  clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  return clone.textContent.split("\n").map(cleanText).filter(Boolean).join(" • ");
}

function normalizeName(value) {
  return cleanText(value).replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeImageUrl(url) {
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

function isStaticBackgroundUrl(url) {
  try {
    const parsed = new URL(url);
    return !/\.(gif)(?:$|[/?#])/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

async function prepareAssetDirectory(directoryPath) {
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

async function downloadAssets(items, directoryPath, publicPrefix) {
  await prepareAssetDirectory(directoryPath);

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

function getImageUrl(img) {
  if (!img) return "";
  const raw = img.getAttribute("data-src") || img.getAttribute("src") || "";
  return normalizeImageUrl(raw);
}

function extractWeaponCell(cell) {
  const image = cell.querySelector("img");
  const iconUrl = getImageUrl(image);
  const links = [...cell.querySelectorAll("a[href*='/wiki/']")]
    .map((anchor) => ({
      href: anchor.getAttribute("href") || "",
      title: anchor.getAttribute("title") || "",
      text: cleanText(anchor.textContent || anchor.getAttribute("title") || ""),
    }))
    .filter((link) => {
      const value = `${link.href} ${link.title}`;
      return link.text && !/File:|Special:|Category:|Help:|Template:/i.test(value) && !/pictogram|render|transparent|image:/i.test(value);
    });

  const weaponLink = links[links.length - 1];
  const name = normalizeName(weaponLink?.text || weaponLink?.title || "");
  if (!name) return null;

  const lines = textWithBreaks(cell);
  const nameIndex = lines.findIndex((line) => normalizeName(line) === name);
  const sourceCandidate = nameIndex > 0 ? lines[nameIndex - 1] : "";
  const source =
    SOURCE_WORDS.find((word) => cleanText(sourceCandidate).toLowerCase().includes(word.toLowerCase())) || sourceCandidate || "Unknown";

  return { name, source: cleanText(source) || "Unknown", iconUrl };
}

function tableToGrid(table) {
  const grid = [];
  const spans = [];
  const rows = [...table.querySelectorAll("tr")];

  rows.forEach((row, rowIndex) => {
    const gridRow = [];
    let colIndex = 0;

    while (spans[colIndex]) {
      gridRow[colIndex] = spans[colIndex].cell;
      spans[colIndex].remaining -= 1;
      if (spans[colIndex].remaining <= 0) spans[colIndex] = null;
      colIndex += 1;
    }

    [...row.children].forEach((cell) => {
      while (spans[colIndex]) {
        gridRow[colIndex] = spans[colIndex].cell;
        spans[colIndex].remaining -= 1;
        if (spans[colIndex].remaining <= 0) spans[colIndex] = null;
        colIndex += 1;
      }

      const colspan = Number(cell.getAttribute("colspan") || 1);
      const rowspan = Number(cell.getAttribute("rowspan") || 1);
      for (let i = 0; i < colspan; i += 1) {
        gridRow[colIndex + i] = cell;
        if (rowspan > 1) spans[colIndex + i] = { cell, remaining: rowspan - 1 };
      }
      colIndex += colspan;
    });

    grid[rowIndex] = gridRow;
  });

  return grid;
}

function getCurrentClassFromHeading(text) {
  const heading = cleanText(text);
  if (/Community-Only Weapons/i.test(heading)) return "Community Only";
  return CLASSES.find((className) => heading.includes(className)) || null;
}

function getCurrentSlotFromHeading(text, currentSlot) {
  const heading = cleanText(text);
  return ["Primary", "Secondary", "Melee", "PDA"].find((slot) => heading.includes(slot)) || currentSlot || "Unknown";
}

function extractNotes(cell) {
  if (!cell) return [];
  const text = cellText(cell).replace(/This item always /gi, "Always ").replace(/Image:/gi, "").replace(/\s+/g, " ");
  return text
    .split(/\s*•\s*|(?<=\.)\s+(?=[A-Z+\-0-9])/)
    .map(cleanText)
    .filter((note) => note && note.length > 2)
    .slice(0, 8);
}

function headerText(cell) {
  return cleanText(cellText(cell)).toLowerCase();
}

function getTableColumnIndexes(grid) {
  const headerRowIndex = grid.findIndex((row) => row.some((cell) => cell?.tagName === "TH"));
  const headerRow = headerRowIndex >= 0 ? grid[headerRowIndex] : grid[0] || [];
  const headers = headerRow.map(headerText);

  const findHeader = (tests) => headers.findIndex((text) => tests.some((test) => test.test(text)));
  const weapon = Math.max(0, findHeader([/^weapon$/, /weapon name/, /^item$/]));
  const capacity = findHeader([/capacity/, /clip/, /magazine/, /loaded/]);
  const ammo = findHeader([/^ammo$/, /reserve/, /ammo carried/, /ammunition/]);
  let notes = findHeader([/notes?/, /stats?/, /attributes?/, /description/, /information/, /info/, /effects?/]);

  if (notes < 0) notes = headers.findIndex((_, index) => index !== weapon && index !== capacity && index !== ammo);

  return {
    weapon,
    capacity,
    ammo,
    notes,
    dataStart: headerRowIndex >= 0 ? headerRowIndex + 1 : 1,
  };
}

function normalizeStatCell(value) {
  const text = cleanText(value);
  if (!text) return "N/A";
  if (text.length > 40 && !/^[0-9. /-]+$/.test(text) && text !== "∞") return "N/A";
  if (/cloak type:|cannot attack|move speed|debuff|bosses|invisible|meter|regen/i.test(text)) return "N/A";
  return text;
}

function inferType(name, slot, notes) {
  const text = `${name} ${slot} ${notes}`.toLowerCase();
  if (/pda|watch|cloak|disguise|sapper|building/.test(text)) return "PDA";
  if (/melee|bat|pan|fists|sword|knife|wrench|saw|axe|shovel|bottle|club|blade|machete|sign|racket|cane/.test(text)) return "Melee";
  if (/lunchbox|cola|milk|drink|consume|sandvich|burger|banana|sneakers|boots|wearer/.test(text)) return "Utility";
  if (/rocket|grenade|sticky|flare|syringe|arrow|projectile|launcher|cannon|throw|ball/.test(text)) return "Projectile";
  if (/flame|fire|burn|ignite|afterburn/.test(text)) return "Flame";
  if (/medigun|heal|overheal|supercharge/.test(text)) return "Healing";
  return "Hitscan";
}

function addSetValue(map, key, value) {
  if (!value) return;
  if (!map[key]) map[key] = new Set();
  String(value)
    .split(/\s*\/\s*|\s*,\s*/)
    .map(cleanText)
    .filter(Boolean)
    .forEach((item) => map[key].add(item));
}

function dedupeWeapons(rows) {
  const byName = new Map();

  rows.forEach((row) => {
    const key = row.name.toLowerCase();
    if (!byName.has(key)) {
      byName.set(key, {
        ...row,
        classSet: new Set(),
        slotSet: new Set(),
        sourceSet: new Set(),
        capacitySet: new Set(),
        ammoSet: new Set(),
        notesSet: new Set(),
        iconUrl: row.iconUrl || "",
      });
    }
    const item = byName.get(key);
    if (!item.iconUrl && row.iconUrl) item.iconUrl = row.iconUrl;
    addSetValue(item, "classSet", row.className);
    addSetValue(item, "slotSet", row.slot);
    addSetValue(item, "sourceSet", row.source);
    addSetValue(item, "capacitySet", row.capacity);
    addSetValue(item, "ammoSet", row.ammo);
    row.notes.forEach((note) => item.notesSet.add(note));
  });

  return [...byName.values()]
    .map((item) => {
      const classSet = [...item.classSet];
      const slotSet = [...item.slotSet];
      const sourceSet = [...item.sourceSet];
      const capacitySet = [...item.capacitySet].filter(Boolean);
      const ammoSet = [...item.ammoSet].filter(Boolean);
      const notes = [...item.notesSet].slice(0, 8);
      return {
        name: item.name,
        className: classSet.includes("All Classes") ? "All Classes" : classSet.join(" / ") || "Unknown",
        slot: slotSet.join(" / ") || "Unknown",
        source: sourceSet.join(" / ") || "Unknown",
        capacity: capacitySet.join(" / ") || "N/A",
        ammo: ammoSet.join(" / ") || "N/A",
        notes,
        iconUrl: item.iconUrl || "",
        type: inferType(item.name, slotSet.join(" "), notes.join(" ")),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function parseWeaponsHtml(html) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const output = doc.querySelector(".mw-parser-output") || doc.body;
  const parsed = [];
  let currentClass = "";
  let currentSlot = "";
  let withinWeapons = false;

  [...output.children].forEach((element) => {
    const tag = element.tagName;
    const headingText = cleanText(element.textContent);

    if (tag === "H2") {
      if (/Weapons List/i.test(headingText)) {
        withinWeapons = true;
        return;
      }
      if (/Trivia/i.test(headingText)) {
        withinWeapons = false;
        return;
      }
      const className = getCurrentClassFromHeading(headingText);
      if (className) {
        withinWeapons = true;
        currentClass = className;
        currentSlot = className === "Community Only" ? "Community" : "Unknown";
      }
    }

    if (!withinWeapons) return;
    if (tag === "H3") currentSlot = getCurrentSlotFromHeading(headingText, currentSlot);

    if (tag === "TABLE" && element.classList.contains("wikitable")) {
      const grid = tableToGrid(element);
      const indexes = getTableColumnIndexes(grid);

      grid.slice(indexes.dataStart).forEach((cells) => {
        const weaponCell = cells[indexes.weapon];
        if (!weaponCell) return;
        const weapon = extractWeaponCell(weaponCell);
        if (!weapon) return;

        const capacityCell = indexes.capacity >= 0 ? cells[indexes.capacity] : null;
        const ammoCell = indexes.ammo >= 0 ? cells[indexes.ammo] : null;
        const notesCell = indexes.notes >= 0 ? cells[indexes.notes] : null;

        parsed.push({
          ...weapon,
          className: currentClass || "Unknown",
          slot: currentSlot || "Unknown",
          capacity: normalizeStatCell(cellText(capacityCell)),
          ammo: normalizeStatCell(cellText(ammoCell)),
          notes: extractNotes(notesCell),
        });
      });
    }
  });

  return dedupeWeapons(parsed);
}

async function scrapeWeaponsFromWiki() {
  const response = await fetch(WIKI_API_URL);
  if (!response.ok) throw new Error(`TC2 wiki request failed with ${response.status}`);
  const json = await response.json();
  const html = json?.parse?.text?.["*"];
  if (!html) throw new Error("TC2 wiki API returned no rendered HTML.");
  const weapons = parseWeaponsHtml(html);
  if (weapons.length < 50) throw new Error(`Scrape returned only ${weapons.length} weapons.`);
  return weapons;
}

async function scrapeLoadingScreensFromWiki() {
  const categoryResponse = await fetch(LOADING_SCREENS_CATEGORY_API);
  if (!categoryResponse.ok) throw new Error(`Loading screens category request failed with ${categoryResponse.status}`);

  const categoryJson = await categoryResponse.json();
  const members = categoryJson?.query?.categorymembers || [];
  const titles = members.map((member) => member.title).filter(Boolean);
  if (!titles.length) return [];

  const imageInfoUrl =
    "https://typicalcolors2.fandom.com/api.php?action=query&prop=imageinfo&iiprop=url&format=json&origin=*&titles=" +
    encodeURIComponent(titles.join("|"));
  const imageResponse = await fetch(imageInfoUrl);
  if (!imageResponse.ok) throw new Error(`Loading screen image request failed with ${imageResponse.status}`);

  const imageJson = await imageResponse.json();
  const pages = Object.values(imageJson?.query?.pages || {});
  return pages
    .map((page) => normalizeImageUrl(page?.imageinfo?.[0]?.url || ""))
    .filter(isStaticBackgroundUrl)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function renderWeaponsGeneratedFile(weapons) {
  const generatedAt = new Date().toISOString();
  return `import type { Weapon } from "../types";

export const generatedAt = ${JSON.stringify(generatedAt)};
export const weapons: Weapon[] = ${JSON.stringify(weapons, null, 2)};
`;
}

function renderLoadingScreensGeneratedFile(urls) {
  const generatedAt = new Date().toISOString();
  return `export const loadingScreensGeneratedAt = ${JSON.stringify(generatedAt)};
export const loadingScreenUrls: string[] = ${JSON.stringify(urls, null, 2)};
`;
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const weaponsOutputPath = path.join(projectRoot, "src", "data", "weapons.generated.ts");
const loadingScreensOutputPath = path.join(projectRoot, "src", "data", "loadingScreens.generated.ts");
const weaponAssetsPath = path.join(projectRoot, "public", "tc2-assets", "weapons");
const loadingScreenAssetsPath = path.join(projectRoot, "public", "tc2-assets", "loading-screens");

const target = process.argv[2] || "all";
const validTargets = new Set(["all", "weapons", "loading-screens"]);

if (!validTargets.has(target)) {
  console.error(`Unknown scrape target "${target}". Use one of: all, weapons, loading-screens.`);
  process.exit(1);
}

await mkdir(path.dirname(weaponsOutputPath), { recursive: true });

if (target === "weapons") {
  const weapons = await scrapeWeaponsFromWiki();
  const iconPaths = await downloadAssets(
    weapons.map((weapon) => ({ name: weapon.name, url: weapon.iconUrl })),
    weaponAssetsPath,
    "tc2-assets/weapons",
  );
  const localWeapons = weapons.map((weapon) => ({ ...weapon, iconUrl: iconPaths.get(weapon.iconUrl) || "" }));
  await writeFile(weaponsOutputPath, renderWeaponsGeneratedFile(localWeapons), "utf8");
  console.log(`Scraped ${weapons.length} weapons into ${path.relative(projectRoot, weaponsOutputPath)}.`);
  console.log(`Downloaded ${iconPaths.size} weapon icons into ${path.relative(projectRoot, weaponAssetsPath)}.`);
}

if (target === "loading-screens") {
  const loadingScreenUrls = await scrapeLoadingScreensFromWiki();
  const backgroundPaths = await downloadAssets(
    loadingScreenUrls.map((url) => ({ name: path.basename(new URL(url).pathname.split("/revision/")[0]), url })),
    loadingScreenAssetsPath,
    "tc2-assets/loading-screens",
  );
  const localLoadingScreenUrls = loadingScreenUrls.map((url) => backgroundPaths.get(url)).filter(Boolean);
  await writeFile(loadingScreensOutputPath, renderLoadingScreensGeneratedFile(localLoadingScreenUrls), "utf8");
  console.log(`Scraped ${loadingScreenUrls.length} loading screens into ${path.relative(projectRoot, loadingScreensOutputPath)}.`);
  console.log(`Downloaded ${backgroundPaths.size} loading screens into ${path.relative(projectRoot, loadingScreenAssetsPath)}.`);
}

if (target === "all") {
  const [weapons, loadingScreenUrls] = await Promise.all([scrapeWeaponsFromWiki(), scrapeLoadingScreensFromWiki()]);
  const [iconPaths, backgroundPaths] = await Promise.all([
    downloadAssets(
      weapons.map((weapon) => ({ name: weapon.name, url: weapon.iconUrl })),
      weaponAssetsPath,
      "tc2-assets/weapons",
    ),
    downloadAssets(
      loadingScreenUrls.map((url) => ({ name: path.basename(new URL(url).pathname.split("/revision/")[0]), url })),
      loadingScreenAssetsPath,
      "tc2-assets/loading-screens",
    ),
  ]);
  const localWeapons = weapons.map((weapon) => ({ ...weapon, iconUrl: iconPaths.get(weapon.iconUrl) || "" }));
  const localLoadingScreenUrls = loadingScreenUrls.map((url) => backgroundPaths.get(url)).filter(Boolean);
  await Promise.all([
    writeFile(weaponsOutputPath, renderWeaponsGeneratedFile(localWeapons), "utf8"),
    writeFile(loadingScreensOutputPath, renderLoadingScreensGeneratedFile(localLoadingScreenUrls), "utf8"),
  ]);
  console.log(`Scraped ${weapons.length} weapons into ${path.relative(projectRoot, weaponsOutputPath)}.`);
  console.log(`Downloaded ${iconPaths.size} weapon icons into ${path.relative(projectRoot, weaponAssetsPath)}.`);
  console.log(`Scraped ${loadingScreenUrls.length} loading screens into ${path.relative(projectRoot, loadingScreensOutputPath)}.`);
  console.log(`Downloaded ${backgroundPaths.size} loading screens into ${path.relative(projectRoot, loadingScreenAssetsPath)}.`);
}
