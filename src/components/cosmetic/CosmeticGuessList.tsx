import { Box, Paper, Stack, Typography } from "@mui/material";
import type { CosmeticGuessEntry, Cosmetic } from "../../types";
import { CosmeticImage } from "./CosmeticImage";

type CosmeticGuessListProps = {
  guesses: CosmeticGuessEntry[];
  target: Cosmetic;
};

export function CosmeticGuessList({ guesses, target }: CosmeticGuessListProps) {
  if (!guesses.length) {
    return (
      <Paper variant="outlined" sx={{ py: { xs: 3, sm: 5 }, px: 2, textAlign: "center", bgcolor: "#191919" }}>
        <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
          Start typing a cosmetic name to make your first guess.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={1}>
      {guesses.map((entry) => {
        const correct = entry.cosmetic.name === target.name;
        return (
          <Box
            key={entry.id}
            sx={{
              minHeight: { xs: 58, sm: 66 },
              display: "grid",
              gridTemplateColumns: { xs: "52px 1fr", sm: "64px 1fr" },
              alignItems: "center",
              gap: { xs: 1, sm: 1.25 },
              borderRadius: 1,
              border: "1px solid rgba(255,255,255,0.14)",
              bgcolor: correct ? "#3dbc55" : "#e33434",
              color: correct ? "#ffffff" : "#ffffff",
              px: { xs: 1, sm: 1.25 },
              py: 0.65,
              fontWeight: 900,
              animation: "tc2dleFadeIn 420ms ease both",
            }}
          >
            <CosmeticImage cosmetic={entry.cosmetic} size={{ xs: 46, sm: 54 }} />
            <Typography sx={{ minWidth: 0, fontWeight: 900, lineHeight: 1.15, overflowWrap: "anywhere" }}>{entry.cosmetic.name}</Typography>
          </Box>
        );
      })}
    </Stack>
  );
}
