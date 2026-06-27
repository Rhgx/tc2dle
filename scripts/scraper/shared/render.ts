import type { GeneratedManifest, ScrapedCosmetic, ScrapedMap, ScrapedWeapon } from "../types.ts";

export function renderWeaponsGeneratedFile(weapons: ScrapedWeapon[]): string {
  const generatedAt = new Date().toISOString();
  return `import type { Weapon } from "../../types";

export const weaponsGeneratedAt = ${JSON.stringify(generatedAt)};
export const weapons: Weapon[] = ${stringifyWithInfinity(weapons)};
`;
}

export function renderMapsGeneratedFile(maps: ScrapedMap[]): string {
  const generatedAt = new Date().toISOString();
  return `import type { Tc2Map } from "../../types";

export const mapsGeneratedAt = ${JSON.stringify(generatedAt)};
export const maps: Tc2Map[] = ${JSON.stringify(maps, null, 2)};
`;
}

export function renderCosmeticsGeneratedFile(cosmetics: ScrapedCosmetic[]): string {
  const generatedAt = new Date().toISOString();
  return `import type { Cosmetic } from "../../types";

export const cosmeticsGeneratedAt = ${JSON.stringify(generatedAt)};
export const cosmetics: Cosmetic[] = ${JSON.stringify(cosmetics, null, 2)};
`;
}

export function renderLoadingScreensGeneratedFile(urls: string[]): string {
  const generatedAt = new Date().toISOString();
  return `export const loadingScreensGeneratedAt = ${JSON.stringify(generatedAt)};
export const loadingScreenUrls: string[] = ${JSON.stringify(urls, null, 2)};
`;
}

export function renderManifestGeneratedFile(manifest: GeneratedManifest): string {
  return `export const generatedManifest = ${JSON.stringify(manifest, null, 2)} as const;
`;
}

function stringifyWithInfinity(value: unknown): string {
  return JSON.stringify(value, (_key, item) => (item === Number.POSITIVE_INFINITY ? "__TC2DLE_INFINITY__" : item), 2)
    .replace(/"__TC2DLE_INFINITY__"/g, "Infinity");
}
