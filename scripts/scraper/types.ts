export type StatValue = string | number | null;

export type WeaponAttributeKind = "positive" | "negative" | "neutral" | "vs-bosses-positive" | "vs-bosses-negative";

export type WeaponAttribute = {
  kind: WeaponAttributeKind;
  label: string;
  text: string;
};

export type ScrapedWeapon = {
  name: string;
  classNames: string[];
  slot: string;
  source: string;
  capacity: StatValue;
  ammo: StatValue;
  attributes: WeaponAttribute[];
  iconUrl: string;
  types: string[];
};

export type WeaponTableRow = {
  name: string;
  className: string;
  slot: string;
  source: string;
  capacity: StatValue;
  ammo: StatValue;
  attributes: WeaponAttribute[];
  iconUrl: string;
};

export type ScrapedMap = {
  name: string;
  gameMode: string;
  group: string;
  status: string;
  imageUrl: string;
};

export type ScrapedCosmetic = {
  name: string;
  usedBy: string[];
  slots: string[];
  imageUrl: string;
};

export type GeneratedManifestSection = {
  count: number;
  assetCount: number;
  assetBytes: number;
};

export type GeneratedManifest = {
  generatedAt: string;
  weapons: GeneratedManifestSection;
  maps: GeneratedManifestSection;
  cosmetics: GeneratedManifestSection;
  loadingScreens: GeneratedManifestSection;
};
