import { access, readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(".");
const generatedDir = path.join(projectRoot, "src", "data", "generated");

const weapons = await readGeneratedArray("weapons.generated.ts", "weapons");
const maps = await readGeneratedArray("maps.generated.ts", "maps");
const cosmetics = await readGeneratedArray("cosmetics.generated.ts", "cosmetics");
const loadingScreenUrls = await readGeneratedArray("loadingScreens.generated.ts", "loadingScreenUrls");

const issues = [
  ...validateNamedItems("weapon", weapons),
  ...validateNamedItems("map", maps),
  ...validateNamedItems("cosmetic", cosmetics),
  ...validateWeaponClasses(weapons),
  ...validateWeaponTypes(weapons),
  ...validateWeaponStats(weapons),
  ...validateUnique("weapon name", weapons.map((weapon) => weapon.name.toLowerCase())),
  ...validateUnique("map key", maps.map((map) => `${map.name.toLowerCase()}\u0000${map.gameMode.toLowerCase()}`)),
  ...validateUnique("cosmetic name", cosmetics.map((cosmetic) => cosmetic.name.toLowerCase())),
  ...await validateAssetPaths("weapon icon", weapons.map((weapon) => weapon.iconUrl)),
  ...await validateAssetPaths("map image", maps.map((map) => map.imageUrl)),
  ...await validateAssetPaths("cosmetic image", cosmetics.map((cosmetic) => cosmetic.imageUrl)),
  ...await validateAssetPaths("loading screen", loadingScreenUrls),
];

if (issues.length) {
  console.error(`Generated data validation failed with ${issues.length} issue(s):`);
  issues.slice(0, 50).forEach((issue) => console.error(`- ${issue}`));
  if (issues.length > 50) console.error(`- ...and ${issues.length - 50} more.`);
  process.exit(1);
}

console.log(`Validated generated data: ${weapons.length} weapons, ${maps.length} maps, ${cosmetics.length} cosmetics, ${loadingScreenUrls.length} loading screens.`);

async function readGeneratedArray(fileName, exportName) {
  const source = await readFile(path.join(generatedDir, fileName), "utf8");
  const exportMatch = new RegExp(`export\\s+const\\s+${exportName}(?:\\s|:)`).exec(source);
  if (!exportMatch) throw new Error(`Could not find export ${exportName} in ${fileName}.`);
  const exportIndex = exportMatch.index;

  const assignmentIndex = source.indexOf("=", exportIndex);
  if (assignmentIndex < 0) throw new Error(`Could not find assignment for ${exportName} in ${fileName}.`);

  const arrayStart = source.indexOf("[", assignmentIndex);
  if (arrayStart < 0) throw new Error(`Could not find array for ${exportName} in ${fileName}.`);

  const arrayEnd = findMatchingBracket(source, arrayStart);
  const jsonLike = source.slice(arrayStart, arrayEnd + 1).replace(/:\s*Infinity([,}\]])/g, ': "__TC2DLE_INFINITY__"$1');
  return reviveInfinity(JSON.parse(jsonLike));
}

function findMatchingBracket(source, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      escaped = char === "\\" && !escaped;
      if (char === "\"" && !escaped) inString = false;
      if (char !== "\\") escaped = false;
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }
    if (char === "[") depth += 1;
    if (char === "]") depth -= 1;
    if (depth === 0) return index;
  }

  throw new Error("Unclosed generated array.");
}

function validateNamedItems(label, items) {
  return items.flatMap((item, index) => {
    const issues = [];
    if (!item.name || typeof item.name !== "string") issues.push(`${label} at index ${index} is missing a name.`);
    return issues;
  });
}

function validateWeaponStats(weapons) {
  return weapons.flatMap((weapon) => {
    const issues = [];
    ["capacity", "ammo"].forEach((field) => {
      const value = weapon[field];
      if (value !== null && typeof value !== "string" && typeof value !== "number") issues.push(`${weapon.name} has invalid ${field}: ${value}.`);
      if (typeof value === "string" && /∞|infinity/i.test(value)) issues.push(`${weapon.name} stores ${field} infinity as a string: ${value}.`);
      if (typeof value === "string" && /^[^:|]+:\s*N\s*\/\s*A$/i.test(value)) issues.push(`${weapon.name} has prefixed ${field}: ${value}.`);
    });
    return issues;
  });
}

function validateWeaponClasses(weapons) {
  return weapons.flatMap((weapon) => {
    const issues = [];
    if ("className" in weapon) issues.push(`${weapon.name} still uses className instead of classNames.`);
    if (!Array.isArray(weapon.classNames) || !weapon.classNames.length) {
      issues.push(`${weapon.name} is missing classNames.`);
    } else if (weapon.classNames.some((className) => typeof className !== "string" || !className.trim())) {
      issues.push(`${weapon.name} has invalid classNames: ${JSON.stringify(weapon.classNames)}.`);
    }
    return issues;
  });
}

function validateWeaponTypes(weapons) {
  return weapons.flatMap((weapon) => {
    const issues = [];
    if ("type" in weapon) issues.push(`${weapon.name} still uses type instead of types.`);
    if (!Array.isArray(weapon.types) || !weapon.types.length) {
      issues.push(`${weapon.name} is missing types.`);
    } else if (weapon.types.some((type) => typeof type !== "string" || !type.trim())) {
      issues.push(`${weapon.name} has invalid types: ${JSON.stringify(weapon.types)}.`);
    }
    return issues;
  });
}

function reviveInfinity(value) {
  if (value === "__TC2DLE_INFINITY__") return Number.POSITIVE_INFINITY;
  if (Array.isArray(value)) return value.map(reviveInfinity);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, reviveInfinity(item)]));
  }
  return value;
}

function validateUnique(label, keys) {
  const seen = new Set();
  const issues = [];
  keys.forEach((key) => {
    if (seen.has(key)) issues.push(`Duplicate ${label}: ${key}.`);
    seen.add(key);
  });
  return issues;
}

async function validateAssetPaths(label, urls) {
  const issues = [];
  await Promise.all(urls.filter(Boolean).map(async (url) => {
    if (!url.endsWith(".webp")) {
      issues.push(`${label} is not WebP: ${url}.`);
      return;
    }
    const filePath = path.join(projectRoot, "public", url);
    try {
      await access(filePath);
    } catch {
      issues.push(`${label} file is missing: ${url}.`);
    }
  }));
  return issues;
}
