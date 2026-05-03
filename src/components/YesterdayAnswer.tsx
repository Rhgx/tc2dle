import { Box } from "@mui/material";
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
    <Box component="span">
      Yesterday&apos;s answer: <Box component="span" sx={{ color: "text.primary", fontWeight: 900 }}>{answer.name}</Box>
    </Box>
  );
}
