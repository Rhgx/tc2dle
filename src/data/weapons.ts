import { fallbackWeapons } from "./fallbackWeapons";
import { weaponsGeneratedAt as generatedWeaponsAt, weapons as generatedWeapons } from "./generated/weapons.generated";

export const weaponsGeneratedAt = generatedWeapons.length ? generatedWeaponsAt : "";
export const weapons = generatedWeapons.length ? generatedWeapons : fallbackWeapons;
