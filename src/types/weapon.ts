export type WeaponAttributeKind = "positive" | "negative" | "neutral" | "vs-bosses-positive" | "vs-bosses-negative";

export type WeaponAttribute = {
  kind: WeaponAttributeKind;
  label: string;
  text: string;
};

export type Weapon = {
  name: string;
  classNames: string[];
  slot: string;
  source: string;
  capacity: string | number | null;
  ammo: string | number | null;
  iconUrl: string;
  attributes: WeaponAttribute[];
  types: string[];
};

export type GuessEntry = {
  id: string;
  weapon: Weapon;
  revealStage: number;
};
