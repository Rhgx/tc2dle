import { weaponAttributesText } from "../lib/game/attributes";
import { inferType } from "../lib/game/weaponTypes";
import type { Weapon, WeaponAttribute } from "../types";

const fallbackRows = [
  { name: "Lever Shotgun", className: "Flanker", slot: "Primary", source: "Stock", capacity: "6", ammo: "32", iconUrl: "", attributes: [neutralAttribute("Stock Flanker primary.")] },
  { name: "Rocket Launcher", className: "Trooper", slot: "Primary", source: "Stock", capacity: "4", ammo: "20", iconUrl: "", attributes: [neutralAttribute("Stock Trooper primary.")] },
  { name: "Flamethrower", className: "Arsonist", slot: "Primary", source: "Stock", capacity: "200", ammo: "N/A", iconUrl: "", attributes: [neutralAttribute("Stock Arsonist primary.")] },
  { name: "Grenade Launcher", className: "Annihilator", slot: "Primary", source: "Stock", capacity: "4", ammo: "16", iconUrl: "", attributes: [neutralAttribute("Stock Annihilator primary.")] },
  { name: "Minigun", className: "Brute", slot: "Primary", source: "Stock", capacity: "200", ammo: "N/A", iconUrl: "", attributes: [neutralAttribute("Stock Brute primary.")] },
  { name: "Wrench", className: "Mechanic", slot: "Melee", source: "Stock", capacity: "N/A", ammo: "N/A", iconUrl: "", attributes: [neutralAttribute("Builds, repairs, and upgrades buildings.")] },
  { name: "Medigun", className: "Doctor", slot: "Secondary", source: "Stock", capacity: "N/A", ammo: "N/A", iconUrl: "", attributes: [neutralAttribute("Doctor healing tool.")] },
  { name: "Sniper Rifle", className: "Marksman", slot: "Primary", source: "Stock", capacity: "25", ammo: "N/A", iconUrl: "", attributes: [neutralAttribute("Marksman's stock rifle.")] },
  { name: "Knife", className: "Agent", slot: "Melee", source: "Stock", capacity: "N/A", ammo: "N/A", iconUrl: "", attributes: [neutralAttribute("Backstabs for a one-hit kill.")] },
];

export const fallbackWeapons: Weapon[] = fallbackRows.map((weapon) => ({
  ...weapon,
  type: inferType(weapon.name, weapon.slot, weaponAttributesText(weapon.attributes)),
}));

function neutralAttribute(text: string): WeaponAttribute {
  return { kind: "neutral", label: "Neutral note", text };
}
