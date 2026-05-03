import { inferType } from "../lib/weaponTypes";
import type { Weapon } from "../types";

const fallbackRows = [
  { name: "Lever Shotgun", className: "Flanker", slot: "Primary", source: "Stock", capacity: "6", ammo: "32", iconUrl: "", notes: ["Stock Flanker primary."] },
  { name: "Rocket Launcher", className: "Trooper", slot: "Primary", source: "Stock", capacity: "4", ammo: "20", iconUrl: "", notes: ["Stock Trooper primary."] },
  { name: "Flamethrower", className: "Arsonist", slot: "Primary", source: "Stock", capacity: "200", ammo: "N/A", iconUrl: "", notes: ["Stock Arsonist primary."] },
  { name: "Grenade Launcher", className: "Annihilator", slot: "Primary", source: "Stock", capacity: "4", ammo: "16", iconUrl: "", notes: ["Stock Annihilator primary."] },
  { name: "Minigun", className: "Brute", slot: "Primary", source: "Stock", capacity: "200", ammo: "N/A", iconUrl: "", notes: ["Stock Brute primary."] },
  { name: "Wrench", className: "Mechanic", slot: "Melee", source: "Stock", capacity: "N/A", ammo: "N/A", iconUrl: "", notes: ["Builds, repairs, and upgrades buildings."] },
  { name: "Medigun", className: "Doctor", slot: "Secondary", source: "Stock", capacity: "N/A", ammo: "N/A", iconUrl: "", notes: ["Doctor healing tool."] },
  { name: "Sniper Rifle", className: "Marksman", slot: "Primary", source: "Stock", capacity: "25", ammo: "N/A", iconUrl: "", notes: ["Marksman's stock rifle."] },
  { name: "Knife", className: "Agent", slot: "Melee", source: "Stock", capacity: "N/A", ammo: "N/A", iconUrl: "", notes: ["Backstabs for a one-hit kill."] },
];

export const fallbackWeapons: Weapon[] = fallbackRows.map((weapon) => ({
  ...weapon,
  type: inferType(weapon.name, weapon.slot, weapon.notes.join(" ")),
}));
