import { weaponAttributesText } from "../lib/game/attributes";
import { inferType } from "../lib/game/weaponTypes";
import type { Weapon, WeaponAttribute } from "../types";

const fallbackRows = [
  { name: "Lever Shotgun", classNames: ["Flanker"], slot: "Primary", source: "Stock", capacity: "6", ammo: "32", iconUrl: "", attributes: [neutralAttribute("Stock Flanker primary.")] },
  { name: "Rocket Launcher", classNames: ["Trooper"], slot: "Primary", source: "Stock", capacity: "4", ammo: "20", iconUrl: "", attributes: [neutralAttribute("Stock Trooper primary.")] },
  { name: "Flamethrower", classNames: ["Arsonist"], slot: "Primary", source: "Stock", capacity: "200", ammo: null, iconUrl: "", attributes: [neutralAttribute("Stock Arsonist primary.")] },
  { name: "Grenade Launcher", classNames: ["Annihilator"], slot: "Primary", source: "Stock", capacity: "4", ammo: "16", iconUrl: "", attributes: [neutralAttribute("Stock Annihilator primary.")] },
  { name: "Minigun", classNames: ["Brute"], slot: "Primary", source: "Stock", capacity: "200", ammo: null, iconUrl: "", attributes: [neutralAttribute("Stock Brute primary.")] },
  { name: "Wrench", classNames: ["Mechanic"], slot: "Melee", source: "Stock", capacity: null, ammo: null, iconUrl: "", attributes: [neutralAttribute("Builds, repairs, and upgrades buildings.")] },
  { name: "Medigun", classNames: ["Doctor"], slot: "Secondary", source: "Stock", capacity: null, ammo: null, iconUrl: "", attributes: [neutralAttribute("Doctor healing tool.")] },
  { name: "Sniper Rifle", classNames: ["Marksman"], slot: "Primary", source: "Stock", capacity: "25", ammo: null, iconUrl: "", attributes: [neutralAttribute("Marksman's stock rifle.")] },
  { name: "Knife", classNames: ["Agent"], slot: "Melee", source: "Stock", capacity: null, ammo: null, iconUrl: "", attributes: [neutralAttribute("Backstabs for a one-hit kill.")] },
];

export const fallbackWeapons: Weapon[] = fallbackRows.map((weapon) => ({
  ...weapon,
  types: inferType(weapon.name, weapon.slot, weaponAttributesText(weapon.attributes)),
}));

function neutralAttribute(text: string): WeaponAttribute {
  return { kind: "neutral", label: "Neutral note", text };
}
