import { Box, Typography } from "@mui/material";
import { useMemo } from "react";
import { pickYesterday } from "../lib/hash";
import type { Weapon } from "../types";

type YesterdayAnswerProps = {
  weapons: Weapon[];
};

export function YesterdayAnswer({ weapons }: YesterdayAnswerProps) {
  const answer = useMemo(() => (weapons.length ? pickYesterday(weapons) : null), [weapons]);
  if (!answer) return null;

  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ display: "block", width: "100%", mt: 1, textAlign: "center", fontWeight: 800 }}
    >
      Yesterday&apos;s answer: <Box component="span" sx={{ color: "text.primary", fontWeight: 900 }}>{answer.name}</Box>
    </Typography>
  );
}
