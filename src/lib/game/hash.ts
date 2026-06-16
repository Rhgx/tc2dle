import type { GameKind } from "../../types";
import { dateKey, dateKeyForOffset } from "../time/date";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const RECENT_PICK_WINDOW_DAYS = 30;

export function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

export function pickDaily<T>(list: T[], gameKind: GameKind = "weapon", testSeed = 0) {
  const seed = testSeed ? `tc2-${gameKind}-test-${testSeed}` : `tc2-${gameKind}`;
  return pickForDate(list, dateKey(), seed);
}

export function pickYesterday<T>(list: T[], gameKind: GameKind = "weapon") {
  return pickForDate(list, dateKeyForOffset(-1), `tc2-${gameKind}`);
}

function pickForDate<T>(list: T[], key: string, seed: string) {
  if (!list.length) return undefined;
  if (list.length === 1) return list[0];

  const day = dayNumber(key);
  const cycle = Math.floor(day / list.length);
  const offset = positiveModulo(day, list.length);
  const cycleOrder = orderForCycle(list.length, seed, cycle);

  return list[cycleOrder[offset]];
}

function orderForCycle(length: number, seed: string, cycle: number) {
  let order: number[] = [];
  let previousTail: number[] = [];
  const recentWindow = Math.min(RECENT_PICK_WINDOW_DAYS, length - 1);

  for (let currentCycle = 0; currentCycle <= cycle; currentCycle += 1) {
    order = avoidRecentCycleRepeats(rawOrderForCycle(length, seed, currentCycle), previousTail, recentWindow);
    previousTail = order.slice(-recentWindow);
  }

  return order;
}

function avoidRecentCycleRepeats(order: number[], previousTail: number[], recentWindow: number) {
  if (!previousTail.length || recentWindow <= 0) return order;

  const remaining = [...order];
  const protectedPrefix: number[] = [];
  const prefixLength = Math.min(recentWindow, remaining.length);

  for (let position = 0; position < prefixLength; position += 1) {
    const forbiddenCount = recentWindow - position;
    const forbidden = new Set(previousTail.slice(Math.max(0, previousTail.length - forbiddenCount)));
    const nextIndex = remaining.findIndex((item) => !forbidden.has(item));
    if (nextIndex === -1) break;
    protectedPrefix.push(remaining.splice(nextIndex, 1)[0]);
  }

  return [...protectedPrefix, ...remaining];
}

function rawOrderForCycle(length: number, seed: string, cycle: number) {
  const order = Array.from({ length }, (_value, index) => index).sort((a, b) => {
    const difference = hashString(`${seed}-${cycle}-${a}`) - hashString(`${seed}-${cycle}-${b}`);
    return difference || a - b;
  });
  return order;
}

function dayNumber(key: string) {
  return Math.floor(Date.parse(`${key}T00:00:00.000Z`) / MS_PER_DAY);
}

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}
