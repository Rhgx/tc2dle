export function renderWeaponsGeneratedFile(weapons) {
  const generatedAt = new Date().toISOString();
  return `import type { Weapon } from "../types";

export const weaponsGeneratedAt = ${JSON.stringify(generatedAt)};
export const weapons: Weapon[] = ${JSON.stringify(weapons, null, 2)};
`;
}

export function renderMapsGeneratedFile(maps) {
  const generatedAt = new Date().toISOString();
  return `import type { Tc2Map } from "../types";

export const mapsGeneratedAt = ${JSON.stringify(generatedAt)};
export const maps: Tc2Map[] = ${JSON.stringify(maps, null, 2)};
`;
}

export function renderCosmeticsGeneratedFile(cosmetics) {
  const generatedAt = new Date().toISOString();
  return `import type { Cosmetic } from "../types";

export const cosmeticsGeneratedAt = ${JSON.stringify(generatedAt)};
export const cosmetics: Cosmetic[] = ${JSON.stringify(cosmetics, null, 2)};
`;
}

export function renderLoadingScreensGeneratedFile(urls) {
  const generatedAt = new Date().toISOString();
  return `export const loadingScreensGeneratedAt = ${JSON.stringify(generatedAt)};
export const loadingScreenUrls: string[] = ${JSON.stringify(urls, null, 2)};
`;
}
