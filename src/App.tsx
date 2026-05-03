import { Box, Container, CssBaseline, GlobalStyles, ThemeProvider, Typography } from "@mui/material";
import { useEffect, useMemo } from "react";
import { Header } from "./components/Header";
import { ResetCountdown } from "./components/ResetCountdown";
import { WeaponGame } from "./components/WeaponGame";
import { YesterdayAnswer } from "./components/YesterdayAnswer";
import { WIKI_PAGE_URL } from "./constants/wiki";
import { loadingScreenUrls } from "./data/loadingScreens.generated";
import { generatedAt, weapons as generatedWeapons } from "./data/weapons.generated";
import { resolveAssetUrl } from "./lib/assets";
import { pickDailyLoadingScreen } from "./lib/loadingScreens";
import { preloadWeaponImages } from "./lib/preload";
import { theme } from "./theme";

export default function App() {
  const weapons = useMemo(() => generatedWeapons.map((weapon) => ({ ...weapon, iconUrl: resolveAssetUrl(weapon.iconUrl) })), []);
  const backgroundUrl = useMemo(() => pickDailyLoadingScreen(loadingScreenUrls.map(resolveAssetUrl)), []);
  const status = generatedAt
    ? `Loaded ${weapons.length} scraped weapons generated on ${new Date(generatedAt).toLocaleString()}.`
    : `Loaded ${weapons.length} bundled fallback weapons. Run npm run scrape:weapons to generate the full list.`;

  useEffect(() => {
    preloadWeaponImages(weapons);
  }, [weapons]);

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
          <WeaponGame weapons={weapons} status={status} />
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
              <YesterdayAnswer weapons={weapons} />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              Made by Rocks • Data from the <Box component="a" href={WIKI_PAGE_URL} target="_blank" rel="noreferrer" sx={{ color: "primary.main", fontWeight: 800 }}>TC2 Wiki</Box>
            </Typography>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
