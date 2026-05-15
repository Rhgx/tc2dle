import { CLASSES, CLASS_ROLES } from "../../constants/classes";
import type { ComparisonStatus, Weapon } from "../../types";
import { cleanText } from "./text";
import type { WeaponStatValue } from "./weaponStats";

export function numeric(value: WeaponStatValue) {
  if (typeof value === "number") return value;

  const text = String(value || "").trim();
  if (!text || /N\s*\/\s*A|unknown/i.test(text)) return null;
  if (text.includes("\u221e") || /infinity/i.test(text)) return Number.POSITIVE_INFINITY;

  const numbers = text.match(/[0-9]+([.][0-9]+)?/g)?.map(Number) || [];
  if (!numbers.length) return null;
  return Math.max(...numbers);
}
export function compareValue(guess: WeaponStatValue, target: WeaponStatValue): ComparisonStatus {
  if (cleanText(guess) === cleanText(target)) return "correct";

  const g = numeric(guess);
  const t = numeric(target);
  if (g === null || t === null) return "wrong";
  if (g === t) return "correct";

  return g < t ? "higher" : "lower";
}

export function formatClassNames(classNames: string[]) {
  return classNames.join(" / ");
}

function splitValue(value: string | string[]) {
  if (!value) return [];
  if (Array.isArray(value)) {
    if (value.includes("All Classes")) return CLASSES.filter((item) => item !== "All Classes");
    return value.map(cleanText).filter(Boolean);
  }
  if (value === "All Classes") return CLASSES.filter((item) => item !== "All Classes");
  return value.split(/\s*\/\s*|\s*,\s*/).map(cleanText).filter(Boolean);
}

function setCompare(guessValue: string | string[], targetValue: string | string[], roleAware = false): ComparisonStatus {
  const guess = splitValue(guessValue);
  const target = splitValue(targetValue);
  if (guess.length === target.length && guess.every((item) => target.includes(item))) return "correct";
  const overlap = guess.filter((item) => target.includes(item));
  if (overlap.length) return "partial";
  // if (roleAware) {
  //   const guessRoles = new Set(guess.map((item) => CLASS_ROLES[item]).filter(Boolean));
  //   const targetRoles = new Set(target.map((item) => CLASS_ROLES[item]).filter(Boolean));
  //   if ([...guessRoles].some((role) => targetRoles.has(role))) return "partial-light";
  // }
  return "wrong";
}

export function compareWeapon(guess: Weapon, target: Weapon) {
  return {
    className: setCompare(guess.classNames, target.classNames, true),
    slot: setCompare(guess.slot, target.slot),
    source: setCompare(guess.source, target.source),
    capacity: compareValue(guess.capacity, target.capacity),
    ammo: compareValue(guess.ammo, target.ammo),
  };
}

export function fuzzyScore(candidate: string, query: string) {
  const name = candidate.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  if (name === q) return 1000;
  if (name.startsWith(q)) return 800 - name.length;
  if (name.includes(q)) return 600 - name.indexOf(q);

  let score = 0;
  let index = 0;
  for (const char of q) {
    const found = name.indexOf(char, index);
    if (found === -1) return 0;
    score += Math.max(1, 40 - (found - index));
    index = found + 1;
  }
  return score;
}
