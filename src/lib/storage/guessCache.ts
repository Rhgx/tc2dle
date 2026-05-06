import type { GameKind } from "../../types";
import { dateKey } from "../time/date";

const CACHE_KEY = "tc2dle:guesses";
const MAX_DAYS_TO_KEEP = 14;

type GuessCache = {
  version: 1;
  days: Record<string, Partial<Record<GameKind, CachedGame>>>;
};

type CachedGame = {
  answer: string;
  guesses: string[];
};

export function readCachedGuessNames(gameKind: GameKind, answer: string) {
  try {
    const cache = readCache();
    migrateLegacyGuessNames(cache, gameKind, answer);
    removeLegacyGuessKeys();
    pruneCache(cache);
    const cached = cache.days[dateKey()]?.[gameKind];
    writeCache(cache);
    return cached?.answer === answer ? cached.guesses : [];
  } catch {
    return [];
  }
}

export function writeCachedGuessNames(gameKind: GameKind, answer: string, guesses: string[]) {
  try {
    const cache = readCache();
    removeLegacyGuessKeys();
    pruneCache(cache);
    const day = dateKey();
    cache.days[day] = cache.days[day] || {};
    cache.days[day][gameKind] = { answer, guesses };
    writeCache(cache);
  } catch {
    // Storage can be unavailable in private browsing or strict browser settings.
  }
}

function migrateLegacyGuessNames(cache: GuessCache, gameKind: GameKind, answer: string) {
  const day = dateKey();
  const legacyMode = gameKind === "weapon" ? "daily" : gameKind === "map" ? "map" : "cosmetic";
  const legacyKey = `tc2dle:${day}:${legacyMode}:${answer}`;
  const existing = cache.days[day]?.[gameKind];
  if (existing?.answer === answer && existing.guesses.length) return;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(legacyKey) || "[]") as unknown;
    if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) return;

    cache.days[day] = cache.days[day] || {};
    cache.days[day][gameKind] = { answer, guesses: parsed };
  } catch {
    // Ignore malformed legacy cache entries.
  }
}

function removeLegacyGuessKeys() {
  const keysToRemove: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith("tc2dle:") && key !== CACHE_KEY) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
}

function readCache(): GuessCache {
  const parsed = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "null") as unknown;
  if (!isGuessCache(parsed)) return { version: 1, days: {} };
  return parsed;
}

function writeCache(cache: GuessCache) {
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function pruneCache(cache: GuessCache) {
  const days = Object.keys(cache.days).sort((a, b) => b.localeCompare(a));
  days.slice(MAX_DAYS_TO_KEEP).forEach((day) => {
    delete cache.days[day];
  });
}

function isGuessCache(value: unknown): value is GuessCache {
  if (!value || typeof value !== "object") return false;
  const cache = value as GuessCache;
  return cache.version === 1 && Boolean(cache.days) && typeof cache.days === "object";
}
