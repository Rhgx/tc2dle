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
import { cosmetics, cosmeticsGeneratedAt } from "./data/cosmetics";
import { loadingScreenUrls } from "./data/loadingScreens";
import { maps, mapsGeneratedAt } from "./data/maps";
import { weapons, weaponsGeneratedAt } from "./data/weapons";
import { pickDailyLoadingScreen } from "./lib/assets/loadingScreens";
import { preloadCosmeticImages, preloadMapImages, preloadWeaponImages } from "./lib/assets/preload";
import { resolveAssetUrl } from "./lib/assets/resolve";
import { pickDaily, pickYesterday } from "./lib/game/hash";
import { expandMapGameEntries } from "./lib/game/maps";
import { currentRoutePath, getGameKindFromPath, routeForGameKind, withBasePath } from "./lib/routing/gameRoutes";
import { theme } from "./theme";
import type { GameKind } from "./types/game";

export default function App() {
  const [gameKind, setGameKind] = useState<GameKind>(() => getGameKindFromPath());
  const resolvedWeapons = useMemo(() => weapons.map((weapon) => ({ ...weapon, iconUrl: resolveAssetUrl(weapon.iconUrl) })), []);
  const resolvedMaps = useMemo(() => maps.map((map) => ({ ...map, imageUrl: resolveAssetUrl(map.imageUrl) })), []);
  const mapEntries = useMemo(() => expandMapGameEntries(resolvedMaps), [resolvedMaps]);
  const resolvedCosmetics = useMemo(() => cosmetics.map((cosmetic) => ({ ...cosmetic, imageUrl: resolveAssetUrl(cosmetic.imageUrl) })), []);
  const backgroundUrl = useMemo(() => pickDailyLoadingScreen(loadingScreenUrls.map(resolveAssetUrl)), []);
  const priorityImageUrls = useMemo(() => {
    if (gameKind === "weapon") {
      return compactUrls([pickDaily(resolvedWeapons)?.iconUrl, pickYesterday(resolvedWeapons)?.iconUrl]);
    }
    if (gameKind === "map") {
      return compactUrls([pickDaily(mapEntries, "map")?.imageUrl, pickYesterday(mapEntries, "map")?.imageUrl]);
    }
    return compactUrls([pickDaily(resolvedCosmetics, "cosmetic")?.imageUrl, pickYesterday(resolvedCosmetics, "cosmetic")?.imageUrl]);
  }, [gameKind, mapEntries, resolvedCosmetics, resolvedWeapons]);
  const weaponStatus = weaponsGeneratedAt
    ? `Loaded ${resolvedWeapons.length} scraped weapons generated on ${new Date(weaponsGeneratedAt).toLocaleString()}.`
    : `Loaded ${resolvedWeapons.length} bundled fallback weapons. Run npm run scrape:weapons to generate the full list.`;
  const mapStatus = mapsGeneratedAt
    ? `Loaded ${resolvedMaps.length} scraped maps generated on ${new Date(mapsGeneratedAt).toLocaleString()}.`
    : `Loaded ${resolvedMaps.length} bundled maps. Run npm run scrape:maps to generate the full list.`;
  const cosmeticStatus = cosmeticsGeneratedAt
    ? `Loaded ${resolvedCosmetics.length} scraped cosmetics generated on ${new Date(cosmeticsGeneratedAt).toLocaleString()}.`
    : `Loaded ${resolvedCosmetics.length} bundled cosmetics. Run npm run scrape:cosmetics to generate the full list.`;
  const activeItems = gameKind === "weapon" ? resolvedWeapons : gameKind === "map" ? mapEntries : resolvedCosmetics;

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
