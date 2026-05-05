import { dateKey, dateKeyForOffset } from "./date";
import type { GameKind } from "../types";

export function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

export function pickDaily<T>(list: T[], gameKind: GameKind = "weapon", testSeed = 0) {
  const seed = testSeed ? `${dateKey()}-tc2-${gameKind}-test-${testSeed}` : `${dateKey()}-tc2-${gameKind}`;
  return list[hashString(seed) % list.length];
}

export function pickYesterday<T>(list: T[], gameKind: GameKind = "weapon") {
  return list[hashString(`${dateKeyForOffset(-1)}-tc2-${gameKind}`) % list.length];
}
