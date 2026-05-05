import { Box } from "@mui/material";
import { useMemo } from "react";
import { pickYesterday } from "../../lib/hash";
import { mapLabel } from "../../lib/maps";
import type { GameKind, Tc2Map } from "../../types";

type YesterdayItem = { name: string } | Tc2Map;

type YesterdayAnswerProps = {
  items: YesterdayItem[];
  gameKind: GameKind;
};

export function YesterdayAnswer({ items, gameKind }: YesterdayAnswerProps) {
  const answer = useMemo(() => (items.length ? pickYesterday(items, gameKind) : null), [items, gameKind]);
  if (!answer) return null;

  return (
    <Box component="span">
      Yesterday&apos;s answer: <Box component="span" sx={{ color: "text.primary", fontWeight: 900 }}>{gameKind === "map" && isMapAnswer(answer) ? mapLabel(answer) : answer.name}</Box>
    </Box>
  );
}

function isMapAnswer(answer: YesterdayItem): answer is Tc2Map {
  return "gameModes" in answer;
}
