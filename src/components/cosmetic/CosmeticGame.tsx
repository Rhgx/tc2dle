import { Alert, Box, Button, CircularProgress, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { COSMETIC_CLASS_REVEAL_GUESS, COSMETIC_COLOR_REVEAL_GUESS, COSMETIC_ROTATION_REVEAL_GUESS } from "../../constants/cosmetics";
import { fuzzyScore } from "../../lib/game/compare";
import { hashString, pickDaily } from "../../lib/game/hash";
import { readCachedGuessNames, writeCachedGuessNames } from "../../lib/storage/guessCache";
import type { Cosmetic, CosmeticGuessEntry } from "../../types";
import { CosmeticGuessList } from "./CosmeticGuessList";
import { CosmeticImage } from "./CosmeticImage";

type CosmeticGameProps = {
  cosmetics: Cosmetic[];
  status: string;
};

export function CosmeticGame({ cosmetics, status }: CosmeticGameProps) {
  const target = useMemo(() => pickDaily(cosmetics, "cosmetic"), [cosmetics]);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [guesses, setGuesses] = useState<CosmeticGuessEntry[]>([]);
  const [message, setMessage] = useState("");
  const [loadedAnswer, setLoadedAnswer] = useState("");

  useEffect(() => {
    if (!target) return;
    setLoadedAnswer("");
    setQuery("");
    setHighlightedIndex(0);
    setMessage("");
    setGuesses(readCachedCosmeticGuesses(target.name, cosmetics));
    setLoadedAnswer(target.name);
  }, [target, cosmetics]);

  useEffect(() => {
    if (!loadedAnswer || loadedAnswer !== target?.name) return;
    writeCachedCosmeticGuesses(loadedAnswer, guesses);
  }, [guesses, loadedAnswer, target]);

  const won = guesses.some((entry) => entry.cosmetic.name === target?.name);
  const guessedNames = useMemo(() => new Set(guesses.map((entry) => entry.cosmetic.name)), [guesses]);
  const clueGuessCount = won ? Math.max(guesses.length, COSMETIC_CLASS_REVEAL_GUESS) : guesses.length;
  const rotationRevealed = clueGuessCount >= COSMETIC_ROTATION_REVEAL_GUESS;
  const colorRevealed = clueGuessCount >= COSMETIC_COLOR_REVEAL_GUESS;
  const classRevealed = clueGuessCount >= COSMETIC_CLASS_REVEAL_GUESS;
  const rotation = useMemo(() => (target ? getDailyCosmeticRotation(target.name) : 0), [target]);

  const suggestions = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    return cosmetics
      .filter((cosmetic) => !guessedNames.has(cosmetic.name))
      .map((cosmetic) => ({ cosmetic, score: fuzzyScore(cosmetic.name, trimmed) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.cosmetic.name.localeCompare(b.cosmetic.name))
      .slice(0, 8)
      .map((item) => item.cosmetic);
  }, [cosmetics, query, guessedNames]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  useEffect(() => {
    if (highlightedIndex >= suggestions.length) {
      setHighlightedIndex(Math.max(0, suggestions.length - 1));
    }
  }, [suggestions.length, highlightedIndex]);

  function submit(cosmetic?: Cosmetic) {
    if (won || !target) return;

    const selected = cosmetic || suggestions[0] || cosmetics.find((item) => item.name.toLowerCase() === query.trim().toLowerCase());
    if (!selected) {
      setMessage("Type a valid cosmetic name or pick a result from the fuzzy search.");
      return;
    }
    if (guessedNames.has(selected.name)) {
      setMessage("You already guessed that cosmetic.");
      return;
    }

    const id = `${selected.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setGuesses((current) => [{ id, cosmetic: selected }, ...current]);
    setQuery("");
    setHighlightedIndex(0);
    const correct = selected.name === target.name;
    setMessage(correct ? "Correct." : "");
    if (correct) celebrateWin();
  }

  if (!target) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress color="primary" />
        <Typography sx={{ mt: 2 }}>Loading cosmetics...</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={4} sx={{ p: { xs: 1.25, sm: 3 }, bgcolor: "background.paper", borderRadius: { xs: 1, sm: 1.25 } }}>
      <Stack spacing={{ xs: 1.5, sm: 2 }}>
        <Box>
          <Typography variant="h2" sx={{ fontSize: { xs: 21, sm: 24 } }}>Cosmetic</Typography>
          <Typography variant="body2" color="text.secondary">
            Guess today's cosmetic
          </Typography>
        </Box>

        <Divider />

        <Box
          sx={{
            minHeight: { xs: 220, sm: 300, md: 360 },
            display: "grid",
            placeItems: "center",
            borderRadius: 1,
            border: "1px solid rgba(255,255,255,0.14)",
            bgcolor: "#111111",
            overflow: "hidden",
          }}
        >
          <CosmeticImage
            cosmetic={target}
            size={{ xs: 170, sm: 230, md: 280 }}
            grayscale={!won && !colorRevealed}
            rotation={won || rotationRevealed ? 0 : rotation}
            animate={!won}
          />
        </Box>

        <CosmeticClues
          guesses={clueGuessCount}
          usedBy={target.usedBy.join(", ")}
          rotationRevealed={rotationRevealed}
          colorRevealed={colorRevealed}
          classRevealed={classRevealed}
        />

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
            disabled={won}
            label="Search cosmetic"
            placeholder="Type a TC2 cosmetic..."
            autoComplete="off"
            fullWidth
            sx={{ "& .MuiInputBase-root": { minHeight: { xs: 52, sm: 56 } } }}
          />
          <Button variant="contained" size="large" onClick={() => submit()} disabled={won} sx={{ px: 4, minHeight: { xs: 50, sm: 56 }, width: { xs: "100%", sm: "auto" } }}>
            Guess
          </Button>

          {query.trim() && suggestions.length > 0 && !won && (
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
              {suggestions.map((cosmetic, index) => (
                <Box
                  key={cosmetic.name}
                  component="button"
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => submit(cosmetic)}
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
                  <CosmeticImage cosmetic={cosmetic} size={42} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 900 }}>{cosmetic.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 800, lineHeight: 1.15 }}>
                      {cosmetic.usedBy.join(", ")}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Paper>
          )}
        </Box>

        {message && !won && <Alert severity="info">{message}</Alert>}
        {status.includes("failed") && <Alert severity="warning">{status}</Alert>}

        {won && (
          <Alert severity="success">
            <strong>Solved:</strong> {target.name} - {target.usedBy.join(", ")} - {target.slots.join(", ")}
          </Alert>
        )}

        <CosmeticGuessList guesses={guesses} target={target} />
      </Stack>
    </Paper>
  );
}

function CosmeticClues({
  guesses,
  usedBy,
  rotationRevealed,
  colorRevealed,
  classRevealed,
}: {
  guesses: number;
  usedBy: string;
  rotationRevealed: boolean;
  colorRevealed: boolean;
  classRevealed: boolean;
}) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 1, textAlign: "center" }}>
      <ClueBox active={rotationRevealed}>{rotationRevealed ? "Rotation corrected" : `Correct rotation in ${Math.max(COSMETIC_ROTATION_REVEAL_GUESS - guesses, 0)} tries`}</ClueBox>
      <ClueBox active={colorRevealed}>{colorRevealed ? "Color revealed" : `Remove gray filter in ${Math.max(COSMETIC_COLOR_REVEAL_GUESS - guesses, 0)} tries`}</ClueBox>
      <ClueBox active={classRevealed}>{classRevealed ? `Used by: ${usedBy}` : `Class clue in ${Math.max(COSMETIC_CLASS_REVEAL_GUESS - guesses, 0)} tries`}</ClueBox>
    </Box>
  );
}

function ClueBox({ children, active }: { children: ReactNode; active: boolean }) {
  return (
    <Box
      sx={{
        minHeight: 54,
        display: "grid",
        placeItems: "center",
        borderRadius: 1,
        border: "1px solid rgba(255,255,255,0.14)",
        bgcolor: active ? "rgba(61,188,85,0.18)" : "rgba(255,255,255,0.04)",
        color: active ? "text.primary" : "text.secondary",
        px: 1,
        py: 0.75,
        fontWeight: 900,
        fontSize: { xs: 12, sm: 13 },
        lineHeight: 1.15,
      }}
    >
      {children}
    </Box>
  );
}

async function celebrateWin() {
  const { default: confetti } = await import("canvas-confetti");
  confetti({ particleCount: 120, spread: 72, origin: { y: 0.62 }, scalar: 0.95 });
  confetti({ particleCount: 60, spread: 120, origin: { x: 0.2, y: 0.72 }, scalar: 0.8 });
  confetti({ particleCount: 60, spread: 120, origin: { x: 0.8, y: 0.72 }, scalar: 0.8 });
}

function readCachedCosmeticGuesses(answer: string, cosmetics: Cosmetic[]): CosmeticGuessEntry[] {
  try {
    const parsed = readCachedGuessNames("cosmetic", answer) as unknown;
    if (!Array.isArray(parsed)) return [];

    const byName = new Map(cosmetics.map((cosmetic) => [cosmetic.name, cosmetic]));
    return parsed
      .filter((name): name is string => typeof name === "string")
      .map((name, index) => byName.get(name) ? { id: `cosmetic-${answer}-${name}-${index}`, cosmetic: byName.get(name)! } : null)
      .filter((entry): entry is CosmeticGuessEntry => Boolean(entry));
  } catch {
    return [];
  }
}

function writeCachedCosmeticGuesses(answer: string, guesses: CosmeticGuessEntry[]) {
  writeCachedGuessNames("cosmetic", answer, guesses.map((entry) => entry.cosmetic.name));
}

function getDailyCosmeticRotation(name: string) {
  const rotations = [90, 180, 270];
  return rotations[hashString(`tc2dle-cosmetic-rotation-${name}`) % rotations.length];
}
