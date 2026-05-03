import { dateKey, dateKeyForOffset } from "./date";

export function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

export function pickDaily<T>(list: T[], testSeed = 0) {
  const seed = testSeed ? `${dateKey()}-tc2-weapon-test-${testSeed}` : `${dateKey()}-tc2-weapon`;
  return list[hashString(seed) % list.length];
}

export function pickYesterday<T>(list: T[]) {
  return list[hashString(`${dateKeyForOffset(-1)}-tc2-weapon`) % list.length];
}
