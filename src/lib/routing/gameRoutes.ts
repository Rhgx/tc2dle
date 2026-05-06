import { DEFAULT_GAME_KIND, GAME_MODES } from "../../constants/modes";
import type { GameKind } from "../../types/game";

export function getGameKindFromPath(): GameKind {
  const route = currentRoutePath();
  return GAME_MODES.find((mode) => mode.route === route || mode.legacyRoutes.includes(route))?.kind || DEFAULT_GAME_KIND;
}

export function routeForGameKind(gameKind: GameKind) {
  return GAME_MODES.find((mode) => mode.kind === gameKind)?.route || GAME_MODES[0].route;
}

export function currentRoutePath() {
  const basePath = normalizeBasePath(import.meta.env.BASE_URL);
  const pathname = window.location.pathname;
  const withoutBase = pathname.startsWith(basePath) ? pathname.slice(basePath.length - 1) : pathname;
  const route = withoutBase.replace(/\/+$/, "") || "/";
  return GAME_MODES.find((mode) => mode.legacyRoutes.includes(route))?.route || route;
}

export function withBasePath(route: string) {
  const basePath = normalizeBasePath(import.meta.env.BASE_URL);
  return `${basePath.replace(/\/$/, "")}${route}`;
}

function normalizeBasePath(basePath: string) {
  return basePath.endsWith("/") ? basePath : `${basePath}/`;
}
