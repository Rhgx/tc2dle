import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Divider, IconButton, Pagination, Paper, Stack, Tooltip, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import type { ChangelogBlock, ChangelogListItem } from "../../lib/changelog";
import { changelogEntries, currentSiteVersion } from "../../lib/changelog";

type UpdateLogProps = {
  onBack: () => void;
};

const UPDATES_PER_PAGE = 4;

export function UpdateLog({ onBack }: UpdateLogProps) {
  const [page, setPage] = useState(1);
  const [pageMotion, setPageMotion] = useState<"forward" | "backward">("forward");
  const previousPageRef = useRef(page);
  const pageCount = Math.max(1, Math.ceil(changelogEntries.length / UPDATES_PER_PAGE));
  const visibleEntries = useMemo(() => {
    const start = (page - 1) * UPDATES_PER_PAGE;
    return changelogEntries.slice(start, start + UPDATES_PER_PAGE);
  }, [page]);

  function changePage(nextPage: number) {
    setPageMotion(nextPage > previousPageRef.current ? "forward" : "backward");
    previousPageRef.current = nextPage;
    setPage(nextPage);
  }

  return (
    <Paper elevation={4} sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: "background.paper", borderRadius: { xs: 1, sm: 1.25 } }}>
      <Stack spacing={{ xs: 1.75, sm: 2.25 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, alignItems: { xs: "flex-start", sm: "baseline" }, justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h2" sx={{ fontSize: { xs: 22, sm: 26 } }}>Update Log</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.4, fontWeight: 800, fontSize: { xs: 12, sm: 13 } }}>
              Current site version v{currentSiteVersion}
            </Typography>
          </Box>
          <Tooltip title="Back to game">
            <IconButton
              aria-label="Back to game"
              onClick={onBack}
              sx={{
                alignSelf: { xs: "flex-end", sm: "center" },
                width: 40,
                height: 40,
                border: "1px solid rgba(255,255,255,0.18)",
                color: "text.secondary",
                bgcolor: "rgba(255,255,255,0.03)",
                "&:hover": {
                  color: "primary.light",
                  borderColor: "rgba(245,158,11,0.54)",
                  bgcolor: "rgba(245,158,11,0.12)",
                },
              }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider />

        <Box
          sx={{
            minHeight: { xs: 620, sm: 560, md: 520 },
            overflow: "hidden",
            "@keyframes tc2dleUpdatePageForward": {
              from: { opacity: 0, transform: "translateX(10px)" },
              to: { opacity: 1, transform: "translateX(0)" },
            },
            "@keyframes tc2dleUpdatePageBackward": {
              from: { opacity: 0, transform: "translateX(-10px)" },
              to: { opacity: 1, transform: "translateX(0)" },
            },
          }}
        >
          <Stack
            key={page}
            component="ol"
            spacing={1.5}
            sx={{
              m: 0,
              p: 0,
              listStyle: "none",
              animation: `${pageMotion === "forward" ? "tc2dleUpdatePageForward" : "tc2dleUpdatePageBackward"} 180ms ease-out both`,
              "@media (prefers-reduced-motion: reduce)": {
                animation: "none",
              },
            }}
          >
            {visibleEntries.map((entry) => (
              <Box
                key={entry.version}
                component="li"
                sx={{
                  borderLeft: "3px solid",
                  borderColor: entry.version === currentSiteVersion ? "primary.main" : "rgba(255,255,255,0.16)",
                  pl: { xs: 1.25, sm: 1.5 },
                  py: 0.25,
                }}
              >
                <Typography sx={{ fontWeight: 950, fontSize: { xs: 16, sm: 18 }, lineHeight: 1.2 }}>
                  v{entry.version}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.25, fontWeight: 800, fontSize: 12 }}>
                  {formatDate(entry.date)}
                </Typography>
                <Stack spacing={0.85} sx={{ mt: 1 }}>
                  {entry.blocks.map((block, index) => (
                    <ChangelogBlockView key={`${entry.version}-${index}`} block={block} />
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>

        {pageCount > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 0.5 }}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(_event, nextPage) => changePage(nextPage)}
              color="primary"
              size="small"
              siblingCount={0}
            />
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

function ChangelogBlockView({ block }: { block: ChangelogBlock }) {
  if (block.type === "heading") {
    return (
      <Typography sx={{ color: "primary.light", fontWeight: 950, fontSize: { xs: 13, sm: 14 }, lineHeight: 1.2 }}>
        {renderInlineMarkdown(block.text)}
      </Typography>
    );
  }

  if (block.type === "paragraph") {
    return (
      <Typography color="text.secondary" sx={{ fontSize: { xs: 13, sm: 14 }, lineHeight: 1.45 }}>
        {renderInlineMarkdown(block.text)}
      </Typography>
    );
  }

  return <ChangelogList items={block.items} />;
}

function ChangelogList({ items, nested = false }: { items: ChangelogListItem[]; nested?: boolean }) {
  return (
    <Box component="ul" sx={{ m: 0, pl: nested ? 2.4 : 2.2, color: "text.secondary" }}>
      {items.map((item) => (
        <Box key={item.text} component="li" sx={{ mb: 0.45, "&::marker": { color: nested ? "rgba(255,255,255,0.46)" : "primary.main" } }}>
          <Typography component="span" sx={{ fontSize: { xs: 13, sm: 14 }, lineHeight: 1.4 }}>
            {renderInlineMarkdown(item.text)}
          </Typography>
          {item.children.length > 0 && <ChangelogList items={item.children} nested />}
        </Box>
      ))}
    </Box>
  );
}

function renderInlineMarkdown(text: string): ReactNode[] {
  return text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part) => {
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <Box
          key={part}
          component="a"
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          sx={{ color: "primary.light", fontWeight: 900, textDecoration: "underline", textUnderlineOffset: "3px" }}
        >
          {linkMatch[1]}
        </Box>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <Box key={part} component="strong" sx={{ color: "text.primary", fontWeight: 950 }}>{part.slice(2, -2)}</Box>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <Box key={part} component="code" sx={{ px: 0.4, py: 0.1, borderRadius: 0.5, bgcolor: "rgba(255,255,255,0.08)", color: "primary.light", fontSize: "0.92em" }}>
          {part.slice(1, -1)}
        </Box>
      );
    }
    return part;
  });
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(new Date(`${date}T00:00:00.000Z`));
}
