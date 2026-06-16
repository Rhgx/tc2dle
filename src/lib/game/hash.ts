import type { GameKind } from "../../types";
import { dateKey, dateKeyForOffset } from "../time/date";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
  let previousLast: number | undefined;

  for (let currentCycle = 0; currentCycle <= cycle; currentCycle += 1) {
    order = rawOrderForCycle(length, seed, currentCycle);
    if (previousLast !== undefined && order[0] === previousLast) order.push(order.shift()!);
    previousLast = order[order.length - 1];
  }

  return order;
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
