import { Alert, Box, Button, CircularProgress, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { fuzzyScore } from "../../lib/game/compare";
import { hashString, pickDaily } from "../../lib/game/hash";
import { expandMapGameEntries, mapKey, mapLabel } from "../../lib/game/maps";
import { readCachedGuessNames, writeCachedGuessNames } from "../../lib/storage/guessCache";
import { MAP_GUESS_LIMIT, MAP_ZOOM_STEPS } from "../../constants/maps";
import type { MapGuessEntry, Tc2Map } from "../../types";
import { LegendChip } from "../shared/LegendChip";
import { MapGuessGrid } from "./MapGuessGrid";
import { MapImage } from "./MapImage";

type MapGameProps = {
  maps: Tc2Map[];
  status: string;
};

export function MapGame({ maps, status }: MapGameProps) {
  const mapEntries = useMemo(() => expandMapGameEntries(maps), [maps]);
  const target = useMemo(() => pickDaily(mapEntries, "map"), [mapEntries]);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [guesses, setGuesses] = useState<MapGuessEntry[]>([]);
  const [message, setMessage] = useState("");
  const [loadedAnswer, setLoadedAnswer] = useState("");
  const [animatedSolvedAnswer, setAnimatedSolvedAnswer] = useState("");

  useEffect(() => {
    if (!target) return;
    setLoadedAnswer("");
    setQuery("");
    setHighlightedIndex(0);
    setMessage("");
    setAnimatedSolvedAnswer("");
    setGuesses(readCachedMapGuesses(mapKey(target), mapEntries));
    setLoadedAnswer(mapKey(target));
  }, [target, mapEntries]);

  useEffect(() => {
    if (!loadedAnswer || loadedAnswer !== (target ? mapKey(target) : "")) return;
    writeCachedMapGuesses(loadedAnswer, guesses);
  }, [guesses, loadedAnswer, target]);

  const revealing = false;
  const won = guesses.some((entry) => target && mapKey(entry.map) === mapKey(target));
  const lost = guesses.length >= MAP_GUESS_LIMIT && !won;
  const guessedKeys = useMemo(() => new Set(guesses.map((entry) => mapKey(entry.map))), [guesses]);
  const failedGuesses = won ? Math.max(0, guesses.length - 1) : guesses.length;
  const zoom = MAP_ZOOM_STEPS[Math.min(failedGuesses, MAP_ZOOM_STEPS.length - 1)];
  const cropPosition = useMemo(() => (target ? getDailyCropPosition(target.name) : "50% 50%"), [target]);
  const answerKey = target ? mapKey(target) : "";
  const animateSolvedReveal = Boolean(answerKey && animatedSolvedAnswer === answerKey);
  const animateMapImage = (!won && !lost) || animateSolvedReveal;

  const suggestions = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    return mapEntries
      .filter((map) => !guessedKeys.has(mapKey(map)))
      .map((map) => ({ map, score: Math.max(fuzzyScore(map.name, trimmed), fuzzyScore(mapLabel(map), trimmed)) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || mapLabel(a.map).localeCompare(mapLabel(b.map)))
      .slice(0, 8)
      .map((item) => item.map);
  }, [mapEntries, query, guessedKeys]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  useEffect(() => {
    if (highlightedIndex >= suggestions.length) {
      setHighlightedIndex(Math.max(0, suggestions.length - 1));
    }
  }, [suggestions.length, highlightedIndex]);

  useEffect(() => {
    if (!animateSolvedReveal || !answerKey) return;
    const timeoutId = window.setTimeout(() => {
      setAnimatedSolvedAnswer((current) => (current === answerKey ? "" : current));
    }, 650);

    return () => window.clearTimeout(timeoutId);
  }, [animateSolvedReveal, answerKey]);

  function submit(map?: Tc2Map) {
    if (revealing || won || lost || !target) return;

    const normalizedQuery = query.trim().toLowerCase();
    const selected = map || suggestions[0] || mapEntries.find((item) => mapLabel(item).toLowerCase() === normalizedQuery || item.name.toLowerCase() === normalizedQuery);
    if (!selected) {
      setMessage("Type a valid map name or pick a result from the fuzzy search.");
      return;
    }
    if (guessedKeys.has(mapKey(selected))) {
      setMessage("You already guessed that map and gamemode.");
      return;
    }

    const id = `${mapKey(selected)}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setGuesses((current) => [{ id, map: selected, revealStage: 1 }, ...current]);
    setQuery("");
    setHighlightedIndex(0);
    const correct = mapKey(selected) === mapKey(target);
    setMessage(correct ? "Correct." : "");
    if (correct) {
      setAnimatedSolvedAnswer(mapKey(target));
      celebrateWin();
    }
  }

  if (!target) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress color="primary" />
        <Typography sx={{ mt: 2 }}>Loading maps...</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={4} sx={{ p: { xs: 1.25, sm: 3 }, bgcolor: "background.paper", borderRadius: { xs: 1, sm: 1.25 } }}>
      <Stack spacing={{ xs: 1.5, sm: 2 }}>
        <Box>
          <Typography variant="h2" sx={{ fontSize: { xs: 21, sm: 24 } }}>Map</Typography>
          <Typography variant="body2" color="text.secondary">
            Guess today's map
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Box
            onContextMenu={(event) => event.preventDefault()}
            sx={{
              position: "relative",
              overflow: "hidden",
              aspectRatio: "16 / 9",
              minHeight: { xs: 180, sm: 280, md: 420 },
              borderRadius: 1,
              border: "1px solid rgba(255,255,255,0.14)",
              bgcolor: "#111111",
              boxShadow: "0 18px 45px rgba(0,0,0,0.32)",
            }}
          >
            {target.imageUrl ? (
              <Box
                component="img"
                src={target.imageUrl}
                alt=""
                draggable={false}
                onContextMenu={(event) => event.preventDefault()}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: cropPosition,
                  transformOrigin: cropPosition,
                  transform: `scale(${won || lost ? 1 : zoom})`,
                  transition: animateMapImage ? "transform 520ms ease, transform-origin 520ms ease" : "none",
                  pointerEvents: "none",
                  userSelect: "none",
                  filter: won || lost ? "none" : "saturate(1.05) contrast(1.04)",
                }}
              />
            ) : (
              <Typography sx={{ display: "grid", height: "100%", placeItems: "center", fontWeight: 900, color: "primary.main" }}>
                ?
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ position: "relative", display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr auto" }, gap: 1 }}>
          <TextField
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setHighlightedIndex((index) => Math.min(index + 1, suggestions.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setHighlightedIndex((index) => Math.max(index - 1, 0));
              } else if (event.key === "Enter") {
                event.preventDefault();
                submit(suggestions[highlightedIndex]);
              } else if (event.key === "Escape") {
                setQuery("");
                setHighlightedIndex(0);
              }
            }}
            disabled={won || lost || revealing}
            label="Search map"
            placeholder="Type a TC2 map..."
            autoComplete="off"
            fullWidth
            sx={{ "& .MuiInputBase-root": { minHeight: { xs: 52, sm: 56 } } }}
          />
          <Button
            variant="contained"
            size="large"
            onClick={() => submit()}
            disabled={won || lost || revealing}
            sx={{ px: 4, minHeight: { xs: 50, sm: 56 }, width: { xs: "100%", sm: "auto" } }}
          >
            Guess
          </Button>

          {query.trim() && suggestions.length > 0 && !won && !lost && !revealing && (
            <Paper
              elevation={8}
              sx={{
                position: "absolute",
                zIndex: 10,
                top: { xs: 58, sm: "calc(100% + 6px)" },
                left: 0,
                right: { xs: 0, sm: 118 },
                maxHeight: { xs: "min(52vh, 360px)", sm: 330 },
                overflowY: "auto",
                bgcolor: "#181818",
              }}
            >
              {suggestions.map((map, index) => (
                <Box
                  key={mapKey(map)}
                  component="button"
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => submit(map)}
                  sx={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    border: 0,
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    bgcolor: index === highlightedIndex ? "rgba(245,158,11,0.22)" : "transparent",
                    color: "text.primary",
                    p: { xs: 1.15, sm: 1 },
                    minHeight: { xs: 56, sm: "auto" },
                    textAlign: "left",
                    cursor: "pointer",
                    "&:hover": { bgcolor: "rgba(245,158,11,0.22)" },
                    outline: index === highlightedIndex ? "1px solid rgba(245,158,11,0.42)" : "none",
                    outlineOffset: "-1px",
                  }}
                >
                  <MapImage map={map} width={54} height={34} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 900 }}>{map.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 800, lineHeight: 1.15 }}>
                      {map.gameMode}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Paper>
          )}
        </Box>

        {message && !won && !lost && <Alert severity="info">{message}</Alert>}
        {status.includes("failed") && <Alert severity="warning">{status}</Alert>}

        {(won || lost) && (
          <Alert severity={won ? "success" : "error"}>
            <strong>{won ? "Solved:" : "Out of guesses. Answer:"}</strong> {mapLabel(target)}
          </Alert>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "space-between", sm: "flex-start" },
            gap: { xs: 0.75, sm: 2 },
            flexWrap: "nowrap",
            width: "100%",
            py: 0.5,
            overflow: "hidden",
          }}
        >
          <LegendChip label="Correct" status="correct" />
          <LegendChip label="Partial" status="partial" />
          <LegendChip label="Wrong" status="wrong" />
        </Box>

        <MapGuessGrid guesses={guesses} target={target} />
      </Stack>
    </Paper>
  );
}

async function celebrateWin() {
  const { default: confetti } = await import("canvas-confetti");
  confetti({ particleCount: 120, spread: 72, origin: { y: 0.62 }, scalar: 0.95 });
  confetti({ particleCount: 60, spread: 120, origin: { x: 0.2, y: 0.72 }, scalar: 0.8 });
  confetti({ particleCount: 60, spread: 120, origin: { x: 0.8, y: 0.72 }, scalar: 0.8 });
}

function readCachedMapGuesses(answer: string, maps: Tc2Map[]): MapGuessEntry[] {
  try {
    const parsed = readCachedGuessNames("map", answer) as unknown;
    if (!Array.isArray(parsed)) return [];

    const byKey = new Map(maps.map((map) => [mapKey(map), map]));
    return parsed
      .filter((name): name is string => typeof name === "string")
      .map((name, index) => {
        const map = byKey.get(name) || maps.find((entry) => entry.name === name);
        return map ? { id: `map-${answer}-${name}-${index}`, map, revealStage: 1 } : null;
      })
      .filter((entry): entry is MapGuessEntry => Boolean(entry));
  } catch {
    return [];
  }
}

function writeCachedMapGuesses(answer: string, guesses: MapGuessEntry[]) {
  writeCachedGuessNames("map", answer, guesses.map((entry) => mapKey(entry.map)));
}

function getDailyCropPosition(mapName: string) {
  const hash = hashString(`tc2dle-map-crop-${mapName}`);
  const x = 8 + (hash % 85);
  const y = 8 + (Math.floor(hash / 97) % 85);
  return `${x}% ${y}%`;
}
