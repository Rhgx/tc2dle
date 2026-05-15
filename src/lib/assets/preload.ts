import type { Cosmetic, Tc2Map, Weapon } from "../../types";

const preloadedImageUrls = new Set<string>();
const PRELOAD_BATCH_SIZE = 8;

export function preloadWeaponImages(weapons: Weapon[]) {
  return preloadImageUrls(weapons.map((weapon) => weapon.iconUrl));
}

export function preloadMapImages(maps: Tc2Map[]) {
  return preloadImageUrls(maps.map((map) => map.imageUrl));
}

export function preloadCosmeticImages(cosmetics: Cosmetic[]) {
  return preloadImageUrls(cosmetics.map((cosmetic) => cosmetic.imageUrl));
}

function preloadImageUrls(urls: string[]) {
  const pendingUrls = urls.filter((url) => url && !preloadedImageUrls.has(url));
  let cursor = 0;
  let cancelled = false;
  let timeoutId = 0;

  function preloadBatch() {
    if (cancelled) return;

    const batch = pendingUrls.slice(cursor, cursor + PRELOAD_BATCH_SIZE);
    cursor += PRELOAD_BATCH_SIZE;

    batch.forEach((url) => {
      if (preloadedImageUrls.has(url)) return;
      preloadedImageUrls.add(url);

      const image = new Image();
      image.loading = "lazy";
      image.decoding = "async";
      image.src = url;
    });

    if (cursor < pendingUrls.length) {
      timeoutId = window.setTimeout(preloadBatch, 250);
    }
  }

  timeoutId = window.setTimeout(preloadBatch, 250);

  return () => {
    cancelled = true;
    window.clearTimeout(timeoutId);
  };
}
