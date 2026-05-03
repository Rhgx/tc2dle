export type Weapon = {
  name: string;
  className: string;
  slot: string;
  source: string;
  capacity: string;
  ammo: string;
  iconUrl: string;
  notes: string[];
  type: string;
};

export type GuessEntry = {
  id: string;
  weapon: Weapon;
  revealStage: number;
};

export type ComparisonStatus = "correct" | "partial" | "partial-light" | "wrong" | "higher" | "lower" | "neutral" | "header";
