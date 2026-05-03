import type { Weapon } from "../types";

const preloadedImageUrls = new Set<string>();

export function preloadWeaponImages(weapons: Weapon[]) {
  weapons.forEach((weapon) => {
    if (!weapon.iconUrl || preloadedImageUrls.has(weapon.iconUrl)) return;
    preloadedImageUrls.add(weapon.iconUrl);

    const image = new Image();
    image.decoding = "async";
    image.src = weapon.iconUrl;

    if (typeof image.decode === "function") {
      image.decode().catch(() => undefined);
    }
  });
}
