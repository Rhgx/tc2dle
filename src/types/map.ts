export type Tc2Map = {
  name: string;
  gameMode: string;
  group: string;
  status: string;
  imageUrl: string;
};

export type MapGuessEntry = {
  id: string;
  map: Tc2Map;
  revealStage: number;
};
