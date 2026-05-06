import type { GameKind } from "../types";

export const GAME_MODES: Array<{ kind: GameKind; label: string; route: string; legacyRoutes: string[] }> = [
  { kind: "weapon", label: "Weapon", route: "/weapons", legacyRoutes: ["/weapon"] },
  { kind: "map", label: "Map", route: "/maps", legacyRoutes: ["/map"] },
  { kind: "cosmetic", label: "Cosmetic", route: "/cosmetics", legacyRoutes: ["/cosmetic"] },
];

export const DEFAULT_GAME_KIND: GameKind = "weapon";
