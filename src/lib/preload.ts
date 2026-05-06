import type { Cosmetic, Tc2Map, Weapon } from "../types";

const preloadedImageUrls = new Set<string>();

export function preloadWeaponImages(weapons: Weapon[]) {
  weapons.forEach((weapon) => preloadImage(weapon.iconUrl));
}

export function preloadMapImages(maps: Tc2Map[]) {
  maps.forEach((map) => preloadImage(map.imageUrl));
}

export function preloadCosmeticImages(cosmetics: Cosmetic[]) {
  cosmetics.forEach((cosmetic) => preloadImage(cosmetic.imageUrl));
}

function preloadImage(url: string) {
  if (!url || preloadedImageUrls.has(url)) return;
  preloadedImageUrls.add(url);

  const image = new Image();
  image.decoding = "async";
  image.src = url;

  if (typeof image.decode === "function") {
    image.decode().catch(() => undefined);
  }
}
