import { Box, Paper, Stack, Typography } from "@mui/material";
import type { PropsWithChildren } from "react";
import { compareWeapon, formatClassNames } from "../../lib/game/compare";
import { formatWeaponStat } from "../../lib/game/weaponStats";
import { getStatusStyles } from "../../styles/statusStyles";
import type { ComparisonStatus, GuessEntry, Weapon } from "../../types";
import { FadeCell, HeaderCell, ResultCell } from "../shared/ResultCell";
import { WeaponIcon } from "./WeaponIcon";

type GuessGridProps = {
  guesses: GuessEntry[];
  target: Weapon;
};

export function GuessGrid({ guesses, target }: GuessGridProps) {
  const columns = "repeat(6, minmax(0, 1fr))";
  const arrow = (status: ComparisonStatus) => (status === "higher" ? " ↑" : status === "lower" ? " ↓" : "");

  return (
    <Stack spacing={{ xs: 1, lg: 1.35 }}>
      <Box sx={{ display: { xs: "none", md: "grid" }, gap: { md: 0.75, lg: 1 }, gridTemplateColumns: columns }}>
        <HeaderCell>Image</HeaderCell>
        <HeaderCell>Class</HeaderCell>
        <HeaderCell>Slot</HeaderCell>
        <HeaderCell>Source</HeaderCell>
        <HeaderCell>Clip</HeaderCell>
        <HeaderCell>Reserve</HeaderCell>
      </Box>

      {guesses.length === 0 ? (
        <Paper variant="outlined" sx={{ py: { xs: 3, sm: 5 }, px: 2, textAlign: "center", bgcolor: "#191919" }}>
          <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
            Start typing a weapon name to make your first guess.
          </Typography>
        </Paper>
      ) : (
        guesses.map((entry) => {
          const guess = entry.weapon;
          const result = compareWeapon(guess, target);
          const stage = entry.revealStage ?? 7;
          const imageStatus = stage >= 6 ? (guess.name === target.name ? "correct" : "wrong") : "neutral";

          return (
            <Box key={entry.id}>
              <Box sx={{ display: { xs: "none", md: "grid" }, gap: { md: 0.75, lg: 1 }, gridTemplateColumns: columns }}>
                <ResultCell status={imageStatus}>
                  <WeaponIcon weapon={guess} size={{ md: 88, lg: 112, xl: 126 }} bare />
                </ResultCell>
                <FadeCell visible={stage >= 1} status={result.className}>{formatClassNames(guess.classNames)}</FadeCell>
                <FadeCell visible={stage >= 2} status={result.slot}>{guess.slot}</FadeCell>
                <FadeCell visible={stage >= 3} status={result.source}>{guess.source}</FadeCell>
                <FadeCell visible={stage >= 4} status={result.capacity}>{formatWeaponStat(guess.capacity)}{arrow(result.capacity)}</FadeCell>
                <FadeCell visible={stage >= 5} status={result.ammo}>{formatWeaponStat(guess.ammo)}{arrow(result.ammo)}</FadeCell>
              </Box>

              <MobileGuessCard guess={guess} imageStatus={imageStatus} result={result} stage={stage} arrow={arrow} />
            </Box>
          );
        })
      )}
    </Stack>
  );
}

type MobileGuessCardProps = {
  guess: Weapon;
  imageStatus: ComparisonStatus;
  result: ReturnType<typeof compareWeapon>;
  stage: number;
  arrow: (status: ComparisonStatus) => string;
};

function MobileGuessCard({ guess, imageStatus, result, stage, arrow }: MobileGuessCardProps) {
  return (
    <Paper variant="outlined" sx={{ display: { xs: "block", md: "none" }, bgcolor: "#181818", p: 1, borderRadius: 1 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 1, alignItems: "stretch" }}>
        <MobileValue status={imageStatus} revealed>
          <WeaponIcon weapon={guess} size={58} bare />
        </MobileValue>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 0.75, minWidth: 0 }}>
          <MobileField label="Class" value={formatClassNames(guess.classNames)} status={result.className} revealed={stage >= 1} />
          <MobileField label="Slot" value={guess.slot} status={result.slot} revealed={stage >= 2} />
          <MobileField label="Source" value={guess.source} status={result.source} revealed={stage >= 3} />
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 0.75 }}>
            <MobileField label="Clip" value={`${formatWeaponStat(guess.capacity)}${arrow(result.capacity)}`} status={result.capacity} revealed={stage >= 4} />
            <MobileField label="Reserve" value={`${formatWeaponStat(guess.ammo)}${arrow(result.ammo)}`} status={result.ammo} revealed={stage >= 5} />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

type MobileFieldProps = {
  label: string;
  value: string;
  status: ComparisonStatus;
  revealed: boolean;
};

function MobileField({ label, value, status, revealed }: MobileFieldProps) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ display: "block", mb: 0.25, color: "text.secondary", fontWeight: 800, lineHeight: 1, fontSize: 10 }}>
        {label}
      </Typography>
      <MobileValue status={status} revealed={revealed}>
        {value}
      </MobileValue>
    </Box>
  );
}

function MobileValue({ children, status, revealed }: PropsWithChildren<{ status: ComparisonStatus; revealed: boolean }>) {
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
        animation: revealed ? "tc2dleFadeIn 420ms ease both" : "none",
        ...(revealed
          ? getStatusStyles(status, "cell")
          : {
              bgcolor: "rgba(255,255,255,0.035)",
              color: "rgba(255,255,255,0.18)",
              borderColor: "rgba(255,255,255,0.08)",
              fontSize: 22,
            }),
      }}
    >
      {revealed ? children : "?"}
    </Box>
  );
}
