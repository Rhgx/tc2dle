import { Box } from "@mui/material";
import { useMemo } from "react";
import { pickYesterday } from "../../lib/hash";
import type { GameKind } from "../../types";

type YesterdayAnswerProps = {
  items: { name: string }[];
  gameKind: GameKind;
};

export function YesterdayAnswer({ items, gameKind }: YesterdayAnswerProps) {
  const answer = useMemo(() => (items.length ? pickYesterday(items, gameKind) : null), [items, gameKind]);
  if (!answer) return null;

  return (
    <Box component="span">
      Yesterday&apos;s answer: <Box component="span" sx={{ color: "text.primary", fontWeight: 900 }}>{answer.name}</Box>
    </Box>
  );
}
