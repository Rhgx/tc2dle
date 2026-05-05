import { Box, Paper, Stack, Typography } from "@mui/material";
import type { PropsWithChildren } from "react";
import { getStatusStyles } from "../../styles/statusStyles";
import type { ComparisonStatus, MapGuessEntry, Tc2Map } from "../../types";
import { MapImage } from "./MapImage";

type MapGuessGridProps = {
  guesses: MapGuessEntry[];
  target: Tc2Map;
};

export function MapGuessGrid({ guesses, target }: MapGuessGridProps) {
  return (
    <Stack spacing={{ xs: 1, lg: 1.35 }}>
      <Box
        sx={{
          display: { xs: "none", md: "grid" },
          gap: { md: 0.75, lg: 1 },
          gridTemplateColumns: "minmax(280px, 1.05fr) minmax(360px, 1fr)",
          width: "100%",
          mx: 0,
        }}
      >
        <MapBoardCell status="header" header>
          Image
        </MapBoardCell>
        <MapBoardCell status="header" header>
          Gamemode
        </MapBoardCell>

        {guesses.map((entry) => {
          const guess = entry.map;
          const imageStatus = guess.name === target.name ? "correct" : "wrong";
          const gamemodeStatus = compareSet(guess.gameModes, target.gameModes);

          return (
            <MapBoardRow key={entry.id} guess={guess} imageStatus={imageStatus} gamemodeStatus={gamemodeStatus} />
          );
        })}
      </Box>

      {guesses.length === 0 ? (
        <Paper variant="outlined" sx={{ py: { xs: 3, sm: 5 }, px: 2, textAlign: "center", bgcolor: "#191919" }}>
          <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
            Start typing a map name to make your first guess.
          </Typography>
        </Paper>
      ) : null}

      {guesses.length > 0 ? (
        guesses.map((entry) => {
          const guess = entry.map;
          const imageStatus = guess.name === target.name ? "correct" : "wrong";
          const gamemodeStatus = compareSet(guess.gameModes, target.gameModes);

          return (
            <Box key={entry.id} sx={{ display: { xs: "block", md: "none" } }}>
              <MobileMapGuess guess={guess} imageStatus={imageStatus} gamemodeStatus={gamemodeStatus} />
            </Box>
          );
        })
      ) : null}
    </Stack>
  );
}

function MapBoardRow({
  guess,
  imageStatus,
  gamemodeStatus,
}: {
  guess: Tc2Map;
  imageStatus: ComparisonStatus;
  gamemodeStatus: ComparisonStatus;
}) {
  return (
    <>
      <MapBoardCell status={imageStatus}>
        <MapImage map={guess} width={{ md: 190, lg: 224, xl: 252 }} height={{ md: 107, lg: 126, xl: 142 }} fit="contain" />
      </MapBoardCell>
      <MapBoardCell status={gamemodeStatus}>{guess.gameModes}</MapBoardCell>
    </>
  );
}

function MapBoardCell({
  children,
  status,
  header = false,
}: PropsWithChildren<{
  status: ComparisonStatus;
  header?: boolean;
}>) {
  return (
    <Box
      component="span"
      sx={{
        minHeight: header ? { md: 72, lg: 84 } : { md: 122, lg: 140, xl: 156 },
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: header ? { md: 0.75, lg: 0.9 } : { md: 0.45, lg: 0.55 },
        borderRadius: 1,
        border: "1px solid rgba(255,255,255,0.14)",
        textAlign: "center",
        fontWeight: 900,
        fontSize: header ? { md: 14, lg: 16 } : { md: 14, lg: 16, xl: 17 },
        lineHeight: 1.15,
        overflow: "hidden",
        overflowWrap: "anywhere",
        animation: header ? "none" : "tc2dleFadeIn 420ms ease both",
        transition: "background-color 700ms ease, color 700ms ease, border-color 700ms ease, box-shadow 700ms ease",
        ...getStatusStyles(status, "cell"),
      }}
    >
      {children}
    </Box>
  );
}

function MobileMapGuess({
  guess,
  imageStatus,
  gamemodeStatus,
}: {
  guess: Tc2Map;
  imageStatus: ComparisonStatus;
  gamemodeStatus: ComparisonStatus;
}) {
  return (
    <Paper variant="outlined" sx={{ display: { xs: "block", md: "none" }, bgcolor: "#181818", p: 1, borderRadius: 1 }}>
      <Stack spacing={0.75}>
        <MobileValue status={imageStatus}>
          <MapImage map={guess} height={86} />
        </MobileValue>
        <Box>
          <Typography variant="caption" sx={{ display: "block", mb: 0.25, color: "text.secondary", fontWeight: 800, lineHeight: 1, fontSize: 10 }}>
            Gamemode
          </Typography>
          <MobileValue status={gamemodeStatus}>{guess.gameModes}</MobileValue>
        </Box>
      </Stack>
    </Paper>
  );
}

function MobileValue({ children, status }: PropsWithChildren<{ status: ComparisonStatus }>) {
  return (
    <Box
      sx={{
        minHeight: 44,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 1,
        px: 0.75,
        py: 0.5,
        textAlign: "center",
        fontSize: 11,
        lineHeight: 1.1,
        fontWeight: 900,
        overflow: "hidden",
        overflowWrap: "anywhere",
        animation: "tc2dleFadeIn 420ms ease both",
        ...getStatusStyles(status, "cell"),
      }}
    >
      {children}
    </Box>
  );
}

function compareSet(guessValue: string, targetValue: string): ComparisonStatus {
  if (guessValue === targetValue) return "correct";
  const guess = splitValue(guessValue);
  const target = splitValue(targetValue);
  return guess.some((item) => target.includes(item)) ? "partial" : "wrong";
}

function splitValue(value: string) {
  return String(value || "")
    .split(/\s*\/\s*|\s*,\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
}
