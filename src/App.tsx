import { Box, Button, ButtonGroup, Container, CssBaseline, GlobalStyles, ThemeProvider, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { CosmeticGame } from "./components/cosmetic/CosmeticGame";
import { MapGame } from "./components/map/MapGame";
import { Header } from "./components/shared/Header";
import { ResetCountdown } from "./components/shared/ResetCountdown";
import { YesterdayAnswer } from "./components/shared/YesterdayAnswer";
import { WeaponGame } from "./components/weapon/WeaponGame";
import { GAME_MODES } from "./constants/modes";
import { WIKI_PAGE_URL } from "./constants/wiki";
import { pickDailyLoadingScreen } from "./lib/assets/loadingScreens";
import { preloadCosmeticImages, preloadMapImages, preloadWeaponImages } from "./lib/assets/preload";
import { resolveAssetUrl } from "./lib/assets/resolve";
import { pickDaily, pickYesterday } from "./lib/game/hash";
import { expandMapGameEntries } from "./lib/game/maps";
import { currentRoutePath, getGameKindFromPath, routeForGameKind, withBasePath } from "./lib/routing/gameRoutes";
import { theme } from "./theme";
import type { Cosmetic, Tc2Map, Weapon } from "./types";
import type { GameKind } from "./types/game";

type DataState<T> = {
  items: T[];
  generatedAt: string;
  loaded: boolean;
};

const emptyData = { items: [], generatedAt: "", loaded: false };

export default function App() {
  const [gameKind, setGameKind] = useState<GameKind>(() => getGameKindFromPath());
  const [weaponData, setWeaponData] = useState<DataState<Weapon>>(emptyData);
  const [mapData, setMapData] = useState<DataState<Tc2Map>>(emptyData);
  const [cosmeticData, setCosmeticData] = useState<DataState<Cosmetic>>(emptyData);
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const resolvedWeapons = useMemo(() => weaponData.items.map((weapon) => ({ ...weapon, iconUrl: resolveAssetUrl(weapon.iconUrl) })), [weaponData.items]);
  const resolvedMaps = useMemo(() => mapData.items.map((map) => ({ ...map, imageUrl: resolveAssetUrl(map.imageUrl) })), [mapData.items]);
  const mapEntries = useMemo(() => expandMapGameEntries(resolvedMaps), [resolvedMaps]);
  const resolvedCosmetics = useMemo(() => cosmeticData.items.map((cosmetic) => ({ ...cosmetic, imageUrl: resolveAssetUrl(cosmetic.imageUrl) })), [cosmeticData.items]);
  const priorityImageUrls = useMemo(() => {
    if (gameKind === "weapon") {
      return compactUrls([pickDaily(resolvedWeapons)?.iconUrl, pickYesterday(resolvedWeapons)?.iconUrl]);
    }
    if (gameKind === "map") {
      return compactUrls([pickDaily(mapEntries, "map")?.imageUrl, pickYesterday(mapEntries, "map")?.imageUrl]);
    }
    return compactUrls([pickDaily(resolvedCosmetics, "cosmetic")?.imageUrl, pickYesterday(resolvedCosmetics, "cosmetic")?.imageUrl]);
  }, [gameKind, mapEntries, resolvedCosmetics, resolvedWeapons]);
  const weaponStatus = dataStatus("weapons", resolvedWeapons.length, weaponData);
  const mapStatus = dataStatus("maps", resolvedMaps.length, mapData);
  const cosmeticStatus = dataStatus("cosmetics", resolvedCosmetics.length, cosmeticData);
  const activeItems = gameKind === "weapon" ? resolvedWeapons : gameKind === "map" ? mapEntries : resolvedCosmetics;

  useEffect(() => {
    let cancelled = false;
    import("./data/loadingScreens").then(({ loadingScreenUrls }) => {
      if (!cancelled) setBackgroundUrl(pickDailyLoadingScreen(loadingScreenUrls.map(resolveAssetUrl)) || "");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (gameKind !== "weapon" || weaponData.loaded) return;
    let cancelled = false;
    import("./data/weapons").then(({ weapons, weaponsGeneratedAt }) => {
      if (!cancelled) setWeaponData({ items: weapons, generatedAt: weaponsGeneratedAt, loaded: true });
    });
    return () => {
      cancelled = true;
    };
  }, [gameKind, weaponData.loaded]);

  useEffect(() => {
    if (gameKind !== "map" || mapData.loaded) return;
    let cancelled = false;
    import("./data/maps").then(({ maps, mapsGeneratedAt }) => {
      if (!cancelled) setMapData({ items: maps, generatedAt: mapsGeneratedAt, loaded: true });
    });
    return () => {
      cancelled = true;
    };
  }, [gameKind, mapData.loaded]);

  useEffect(() => {
    if (gameKind !== "cosmetic" || cosmeticData.loaded) return;
    let cancelled = false;
    import("./data/cosmetics").then(({ cosmetics, cosmeticsGeneratedAt }) => {
      if (!cancelled) setCosmeticData({ items: cosmetics, generatedAt: cosmeticsGeneratedAt, loaded: true });
    });
    return () => {
      cancelled = true;
    };
  }, [cosmeticData.loaded, gameKind]);

  useEffect(() => {
    if (gameKind === "weapon") return preloadWeaponImages(resolvedWeapons, priorityImageUrls);
    if (gameKind === "map") return preloadMapImages(resolvedMaps, priorityImageUrls);
    return preloadCosmeticImages(resolvedCosmetics, priorityImageUrls);
  }, [gameKind, priorityImageUrls, resolvedCosmetics, resolvedMaps, resolvedWeapons]);

  useEffect(() => {
    function handlePopState() {
      setGameKind(getGameKindFromPath());
    }

    window.addEventListener("popstate", handlePopState);
    const route = routeForGameKind(getGameKindFromPath());
    if (currentRoutePath() !== route) {
      window.history.replaceState(null, "", withBasePath(route));
    }

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function selectGameKind(nextGameKind: GameKind) {
    setGameKind(nextGameKind);
    const route = routeForGameKind(nextGameKind);
    if (currentRoutePath() !== route) {
      window.history.pushState(null, "", withBasePath(route));
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          "@keyframes tc2dleFadeIn": {
            from: { opacity: 0, transform: "scale(0.94) translateY(4px)" },
            to: { opacity: 1, transform: "scale(1) translateY(0)" },
          },
        }}
      />
      <Box
        component="svg"
        aria-hidden="true"
        focusable="false"
        sx={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      >
        <filter id="weapon-alpha-shadow" x="-80%" y="-80%" width="260%" height="260%" colorInterpolationFilters="sRGB">
          <feComponentTransfer in="SourceAlpha" result="alphaCutoff">
            <feFuncA type="linear" slope="8" intercept="-0.45" />
          </feComponentTransfer>
          <feGaussianBlur in="alphaCutoff" stdDeviation="5" result="shadowBlur" />
          <feOffset in="shadowBlur" dx="0" dy="8" result="shadowOffset" />
          <feFlood floodColor="#000000" floodOpacity="0.38" result="shadowColor" />
          <feComposite in="shadowColor" in2="shadowOffset" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </Box>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 0.5, sm: 0 },
          position: "relative",
          overflow: "hidden",
          "&::before": backgroundUrl
            ? {
                content: '""',
                position: "fixed",
                inset: 0,
                zIndex: 0,
                backgroundImage: `url(${backgroundUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "grayscale(45%) saturate(35%) blur(1.2px)",
                opacity: 0.38,
                transform: "scale(1.025)",
              }
            : {},
          "&::after": backgroundUrl
            ? {
                content: '""',
                position: "fixed",
                inset: 0,
                zIndex: 0,
                background: "rgba(35, 35, 35, 0.68)",
              }
            : {},
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, px: { xs: 1.25, sm: 3 } }}>
          <Header />
          <ButtonGroup
            variant="outlined"
            aria-label="Game selector"
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: { xs: 1.5, sm: 2 },
              "& .MuiButton-root": {
                minWidth: { xs: 96, sm: 148 },
                fontWeight: 900,
              },
            }}
          >
            {GAME_MODES.map((mode) => (
              <Button key={mode.kind} variant={gameKind === mode.kind ? "contained" : "outlined"} onClick={() => selectGameKind(mode.kind)}>
                {mode.label}
              </Button>
            ))}
          </ButtonGroup>

          {gameKind === "weapon" ? (
            <WeaponGame weapons={resolvedWeapons} status={weaponStatus} />
          ) : gameKind === "map" ? (
            <MapGame maps={resolvedMaps} status={mapStatus} />
          ) : (
            <CosmeticGame cosmetics={resolvedCosmetics} status={cosmeticStatus} />
          )}
          <Box component="footer" sx={{ mt: 2.25, textAlign: "center", color: "text.secondary" }}>
            <Box
              component="p"
              sx={{
                m: 0,
                color: "text.secondary",
                display: "inline-grid",
                gridTemplateColumns: "auto 1.2ch auto",
                alignItems: "center",
                justifyContent: "center",
                whiteSpace: "nowrap",
                fontSize: { xs: "clamp(7px, 2.45vw, 11px)", sm: 12 },
                fontWeight: 800,
                lineHeight: 1.35,
                maxWidth: "100%",
              }}
            >
              <ResetCountdown />
              <Box
                component="span"
                aria-hidden="true"
                sx={{
                  width: "1.2ch",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: "0.32em",
                    height: "0.32em",
                    borderRadius: "50%",
                    bgcolor: "rgba(255,255,255,0.32)",
                  }}
                />
              </Box>
              <YesterdayAnswer items={activeItems} gameKind={gameKind} />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              Made by Rocks - Data from the <Box component="a" href={WIKI_PAGE_URL} target="_blank" rel="noreferrer" sx={{ color: "primary.main", fontWeight: 800 }}>TC2 Wiki</Box>
            </Typography>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

function compactUrls(urls: Array<string | undefined>) {
  return urls.filter((url): url is string => Boolean(url));
}

function dataStatus<T>(label: string, count: number, data: DataState<T>) {
  if (!data.loaded) return `Loading ${label}...`;
  return data.generatedAt
    ? `Loaded ${count} scraped ${label} generated on ${new Date(data.generatedAt).toLocaleString()}.`
    : `Loaded ${count} bundled ${label}. Run npm run scrape to generate the full list.`;
}
