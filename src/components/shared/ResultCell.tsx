import { Box, Tooltip } from "@mui/material";
import type { PropsWithChildren } from "react";
import type { ComparisonStatus } from "../../types";
import { getStatusStyles } from "../../styles/statusStyles";

type ResultCellProps = PropsWithChildren<{
  status?: ComparisonStatus;
  title?: string;
}>;

export function ResultCell({ children, status = "neutral", title }: ResultCellProps) {
  return (
    <Tooltip title={title || ""} disableHoverListener={!title}>
      <Box
        component="span"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          aspectRatio: { xs: "auto", md: "1 / 1" },
          minHeight: { xs: 64, md: 118, lg: 152, xl: 178 },
          width: "100%",
          p: { xs: 1, lg: 1.5 },
          borderRadius: 1,
          fontWeight: 900,
          fontSize: { xs: 12, md: 13, lg: 15, xl: 16 },
          textAlign: "center",
          border: "1px solid rgba(255,255,255,0.14)",
          lineHeight: 1.15,
          overflow: "hidden",
          transition: "background-color 700ms ease, color 700ms ease, border-color 700ms ease, box-shadow 700ms ease",
          willChange: "background-color, color, border-color",
          ...getStatusStyles(status, "cell"),
        }}
      >
        {children}
      </Box>
    </Tooltip>
  );
}

export function HeaderCell({ children }: PropsWithChildren) {
  return <ResultCell status="header">{children}</ResultCell>;
}

export function HiddenCell() {
  return (
    <Box
      component="span"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        aspectRatio: { xs: "auto", md: "1 / 1" },
        minHeight: { xs: 64, md: 118, lg: 152, xl: 178 },
        width: "100%",
        p: 1,
        borderRadius: 1,
        border: "1px solid rgba(255,255,255,0.08)",
        bgcolor: "rgba(255,255,255,0.035)",
        color: "rgba(255,255,255,0.18)",
        fontWeight: 900,
        fontSize: { xs: 28, lg: 32 },
      }}
    >
      ?
    </Box>
  );
}

export function FadeCell({ visible, children, status, title }: ResultCellProps & { visible: boolean }) {
  if (!visible) return <HiddenCell />;
  return (
    <Box sx={{ animation: "tc2dleFadeIn 420ms ease both" }}>
      <ResultCell status={status} title={title}>
        {children}
      </ResultCell>
    </Box>
  );
}
