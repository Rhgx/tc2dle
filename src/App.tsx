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
          <Box component="footer" sx={{ mt: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Data from <Box component="a" href={WIKI_PAGE_URL} target="_blank" rel="noreferrer" sx={{ color: "primary.main", fontWeight: 800 }}>TC2 Wiki Weapons</Box>.
            </Typography>
            <ResetCountdown />
            <YesterdayAnswer weapons={weapons} />
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
