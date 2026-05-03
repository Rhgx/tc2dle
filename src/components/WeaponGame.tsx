import confetti from "canvas-confetti";
import { Alert, Box, Button, CircularProgress, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { fuzzyScore } from "../lib/compare";
import { dateKey } from "../lib/date";
import { pickDaily } from "../lib/hash";
import type { GuessEntry, Weapon } from "../types";
import { GuessGrid } from "./GuessGrid";
import { LegendChip } from "./LegendChip";
import { WeaponIcon } from "./WeaponIcon";

type WeaponGameProps = {
  weapons: Weapon[];
  status: string;
};

export function WeaponGame({ weapons, status }: WeaponGameProps) {
  const target = useMemo(() => pickDaily(weapons), [weapons]);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [guesses, setGuesses] = useState<GuessEntry[]>([]);
  const [message, setMessage] = useState("");
  const [loadedCacheKey, setLoadedCacheKey] = useState("");
  const cacheKey = useMemo(() => (target ? getGuessCacheKey(target) : ""), [target]);

  useEffect(() => {
    if (!target || !cacheKey) return;
    setLoadedCacheKey("");
    setQuery("");
    setHighlightedIndex(0);
    setMessage("");
    setGuesses(readCachedGuesses(cacheKey, weapons));
    setLoadedCacheKey(cacheKey);
  }, [cacheKey, target, weapons]);

  useEffect(() => {
    if (!cacheKey || loadedCacheKey !== cacheKey) return;
    writeCachedGuesses(cacheKey, guesses);
  }, [cacheKey, guesses, loadedCacheKey]);

  const revealing = guesses.some((entry) => (entry.revealStage ?? 6) < 6);
  const won = guesses.some((entry) => entry.weapon.name === target?.name && (entry.revealStage ?? 6) >= 6);
  const lost = guesses.length >= 10 && !won && guesses.every((entry) => (entry.revealStage ?? 6) >= 6);
  const guessedNames = useMemo(() => new Set(guesses.map((entry) => entry.weapon.name)), [guesses]);

  const suggestions = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    return weapons
      .filter((weapon) => !guessedNames.has(weapon.name))
      .map((weapon) => ({ weapon, score: fuzzyScore(weapon.name, trimmed) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.weapon.name.localeCompare(b.weapon.name))
      .slice(0, 8)
      .map((item) => item.weapon);
  }, [weapons, query, guessedNames]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  useEffect(() => {
    if (highlightedIndex >= suggestions.length) {
      setHighlightedIndex(Math.max(0, suggestions.length - 1));
    }
  }, [suggestions.length, highlightedIndex]);

  function submit(weapon?: Weapon) {
    if (revealing || won || lost || !target) return;

    const selected = weapon || suggestions[0] || weapons.find((item) => item.name.toLowerCase() === query.trim().toLowerCase());
    if (!selected) {
      setMessage("Type a valid weapon name or pick a result from the fuzzy search.");
      return;
    }
    if (guessedNames.has(selected.name)) {
      setMessage("You already guessed that weapon.");
      return;
    }

    const id = `${selected.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setGuesses((current) => [{ id, weapon: selected, revealStage: 0 }, ...current]);
    setQuery("");
    setHighlightedIndex(0);
    setMessage("Revealing...");

    for (let stage = 1; stage <= 6; stage += 1) {
      window.setTimeout(() => {
        setGuesses((current) => current.map((entry) => (entry.id === id ? { ...entry, revealStage: stage } : entry)));
        if (stage === 6) {
          const correct = selected.name === target.name;
          setMessage(correct ? "Correct." : "");
          if (correct) celebrateWin();
        }
      }, stage * 520);
    }
  }

  if (!target) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress color="primary" />
        <Typography sx={{ mt: 2 }}>Loading weapons...</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={4} sx={{ p: { xs: 1.25, sm: 3 }, bgcolor: "background.paper", borderRadius: { xs: 1, sm: 1.25 } }}>
      <Stack spacing={{ xs: 1.5, sm: 2 }}>
        <Box>
          <Box>
            <Typography variant="h2" sx={{ fontSize: { xs: 21, sm: 24 } }}>Weapon</Typography>
            <Typography variant="body2" color="text.secondary">
              Guess today's weapon
            </Typography>
          </Box>
        </Box>

        <Divider />

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
            label="Search weapon"
            placeholder="Type a TC2 weapon..."
            autoComplete="off"
            fullWidth
            sx={{
              "& .MuiInputBase-root": {
                minHeight: { xs: 52, sm: 56 },
              },
            }}
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
              {suggestions.map((weapon, index) => (
                <Box
                  key={weapon.name}
                  component="button"
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => submit(weapon)}
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
                  <WeaponIcon weapon={weapon} size={40} bare />
                  <Typography sx={{ fontWeight: 900 }}>{weapon.name}</Typography>
                </Box>
              ))}
            </Paper>
          )}
        </Box>

        {message && !won && !lost && <Alert severity="info">{message}</Alert>}
        {status.includes("failed") && <Alert severity="warning">{status}</Alert>}

        {(won || lost) && (
          <Alert severity={won ? "success" : "error"}>
            <strong>{won ? "Solved:" : "Out of guesses. Answer:"}</strong> {target.name} - {target.className} · {target.slot} · {target.source}
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
          <LegendChip label="Higher" status="higher" />
          <LegendChip label="Lower" status="lower" />
          <LegendChip label="Wrong" status="wrong" />
        </Box>

        <GuessGrid guesses={guesses} target={target} />
      </Stack>
    </Paper>
  );
}

function celebrateWin() {
  confetti({ particleCount: 120, spread: 72, origin: { y: 0.62 }, scalar: 0.95 });
  confetti({ particleCount: 60, spread: 120, origin: { x: 0.2, y: 0.72 }, scalar: 0.8 });
  confetti({ particleCount: 60, spread: 120, origin: { x: 0.8, y: 0.72 }, scalar: 0.8 });
}

function getGuessCacheKey(target: Weapon) {
  return `tc2dle:${dateKey()}:daily:${target.name}`;
}

function readCachedGuesses(cacheKey: string, weapons: Weapon[]): GuessEntry[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(cacheKey) || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];

    const byName = new Map(weapons.map((weapon) => [weapon.name, weapon]));
    return parsed
      .filter((name): name is string => typeof name === "string")
      .map((name, index) => byName.get(name) ? { id: `${cacheKey}-${name}-${index}`, weapon: byName.get(name)!, revealStage: 6 } : null)
      .filter((entry): entry is GuessEntry => Boolean(entry));
  } catch {
    return [];
  }
}

function writeCachedGuesses(cacheKey: string, guesses: GuessEntry[]) {
  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(guesses.map((entry) => entry.weapon.name)));
  } catch {
    // Storage can be unavailable in private browsing or strict browser settings.
  }
}
