export type Cosmetic = {
  name: string;
  usedBy: string[];
  slots: string[];
  imageUrl: string;
};

export type CosmeticGuessEntry = {
  id: string;
  cosmetic: Cosmetic;
};
