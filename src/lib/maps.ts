import type { Tc2Map } from "../types";

export function expandMapGameEntries(maps: Tc2Map[]) {
  return maps.flatMap((map) => splitGameModes(map.gameModes).map((gameMode) => ({ ...map, gameModes: gameMode })));
}

export function splitGameModes(gameModes: string) {
  return gameModes
    .split(/\s+\/\s+/)
    .map((mode) => mode.trim())
    .filter(Boolean);
}

export function mapKey(map: Tc2Map) {
  return `${map.name}::${map.gameModes}`;
}

export function mapLabel(map: Tc2Map) {
  return `${map.name} (${map.gameModes})`;
}
