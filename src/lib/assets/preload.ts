import type { Cosmetic, Tc2Map, Weapon } from "../../types";

const preloadedImageUrls = new Set<string>();
const DESKTOP_MAX_WARM_COUNT = 96;
const MOBILE_MAX_WARM_COUNT = 24;
const DESKTOP_BATCH_SIZE = 8;
const MOBILE_BATCH_SIZE = 3;
const WARMUP_DELAY_MS = 250;

type PreloadImagesOptions = {
  urls: string[];
  priorityUrls?: string[];
  maxWarmCount?: number;
  batchSize?: number;
};

export function preloadWeaponImages(weapons: Weapon[], priorityUrls: string[] = []) {
  return preloadImages({ urls: weapons.map((weapon) => weapon.iconUrl), priorityUrls });
}

export function preloadMapImages(maps: Tc2Map[], priorityUrls: string[] = []) {
  return preloadImages({ urls: maps.map((map) => map.imageUrl), priorityUrls });
}

export function preloadCosmeticImages(cosmetics: Cosmetic[], priorityUrls: string[] = []) {
  return preloadImages({ urls: cosmetics.map((cosmetic) => cosmetic.imageUrl), priorityUrls });
}

export function preloadImages({ urls, priorityUrls = [], maxWarmCount, batchSize }: PreloadImagesOptions) {
  const mobile = isMobileViewport();
  const warmCount = maxWarmCount ?? (mobile ? MOBILE_MAX_WARM_COUNT : DESKTOP_MAX_WARM_COUNT);
  const warmBatchSize = batchSize ?? (mobile ? MOBILE_BATCH_SIZE : DESKTOP_BATCH_SIZE);
  const prioritySet = new Set(priorityUrls.filter(Boolean));
  const pendingUrls = uniqueUrls(urls).filter((url) => !prioritySet.has(url)).slice(0, warmCount);
  let cursor = 0;
  let cancelled = false;
  let timeoutId = 0;
  let idleId = 0;

  uniqueUrls(priorityUrls).forEach(preloadImage);

  function preloadBatch() {
    if (cancelled) return;

    const batch = pendingUrls.slice(cursor, cursor + warmBatchSize);
    cursor += warmBatchSize;
    batch.forEach(preloadImage);

    if (cursor < pendingUrls.length) {
      scheduleWarmup();
    }
  }

  function scheduleWarmup() {
    const requestIdleCallback = getRequestIdleCallback();
    if (requestIdleCallback) {
      idleId = requestIdleCallback(preloadBatch, { timeout: 1600 });
      return;
    }

    timeoutId = window.setTimeout(preloadBatch, WARMUP_DELAY_MS);
  }

  scheduleWarmup();

  return () => {
    cancelled = true;
    window.clearTimeout(timeoutId);
    const cancelIdleCallback = getCancelIdleCallback();
    if (cancelIdleCallback) cancelIdleCallback(idleId);
  };
}

function preloadImage(url: string) {
  if (!url || preloadedImageUrls.has(url)) return;
  preloadedImageUrls.add(url);

  const image = new Image();
  image.loading = "lazy";
  image.decoding = "async";
  image.src = url;
}

function uniqueUrls(urls: string[]) {
  return [...new Set(urls.filter(Boolean))];
}

function isMobileViewport() {
  return window.matchMedia("(pointer: coarse), (max-width: 640px)").matches;
}

function getRequestIdleCallback() {
  return (window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number }).requestIdleCallback;
}

function getCancelIdleCallback() {
  return (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
}
