import type { Tc2Map } from "../../types";

export function expandMapGameEntries(maps: Tc2Map[]) {
  return maps.flatMap((map) => splitGameMode(map.gameMode).map((gameMode) => ({ ...map, gameMode })));
}

export function splitGameMode(gameMode: string) {
  return gameMode
    .split(/\s+\/\s+/)
    .map((mode) => mode.trim())
    .filter(Boolean);
}

export function mapKey(map: Tc2Map) {
  return `${map.name}::${map.gameMode}`;
}

export function mapLabel(map: Tc2Map) {
  return `${map.name} (${map.gameMode})`;
}
