export type WeaponAttributeKind = "positive" | "negative" | "neutral" | "vs-bosses-positive" | "vs-bosses-negative";

export type WeaponAttribute = {
  kind: WeaponAttributeKind;
  label: string;
  text: string;
};

export type Weapon = {
  name: string;
  className: string;
  slot: string;
  source: string;
  capacity: string;
  ammo: string;
  iconUrl: string;
  attributes: WeaponAttribute[];
  type: string;
};

export type GameKind = "weapon" | "map" | "cosmetic";

export type Cosmetic = {
  name: string;
  usedBy: string[];
  slots: string[];
  imageUrl: string;
};

export type Tc2Map = {
  name: string;
  gameModes: string;
  group: string;
  status: string;
  imageUrl: string;
};

export type GuessEntry = {
  id: string;
  weapon: Weapon;
  revealStage: number;
};

export type MapGuessEntry = {
  id: string;
  map: Tc2Map;
  revealStage: number;
};

export type CosmeticGuessEntry = {
  id: string;
  cosmetic: Cosmetic;
};

export type ComparisonStatus = "correct" | "partial" | "partial-light" | "wrong" | "higher" | "lower" | "neutral" | "header";
