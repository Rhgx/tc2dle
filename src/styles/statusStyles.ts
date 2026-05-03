import type { SxProps, Theme } from "@mui/material";
import type { ComparisonStatus } from "../types";

type StatusPlacement = "cell" | "legend";

const patternScale = {
  cell: {
    partial: [8, 16],
    wrong: [7, 14],
    directional: [6, 14],
  },
  legend: {
    partial: [3, 6],
    wrong: [3, 6],
    directional: [3, 7],
  },
} satisfies Record<StatusPlacement, Record<"partial" | "wrong" | "directional", [number, number]>>;

export function getStatusStyles(status: ComparisonStatus, placement: StatusPlacement = "cell"): SxProps<Theme> {
  const scale = patternScale[placement];
  const partialBorder = placement === "cell" ? "rgba(17,17,17,0.82)" : "rgba(17,17,17,0.72)";
  const partialBorderWidth = placement === "cell" ? 2 : 1;

  const styles: Record<ComparisonStatus, SxProps<Theme>> = {
    correct: {
      bgcolor: "success.main",
      color: "#ffffff",
      borderColor: "rgba(255,255,255,0.72)",
      boxShadow: placement === "cell" ? "inset 0 0 0 2px rgba(255,255,255,0.24)" : "inset 0 0 0 1px rgba(255,255,255,0.34)",
    },
    partial: {
      bgcolor: "warning.main",
      color: "#111111",
      borderStyle: "dashed",
      borderWidth: partialBorderWidth,
      borderColor: partialBorder,
      backgroundImage: stripe(135, "rgba(255,255,255,0.22)", scale.partial),
    },
    "partial-light": {
      bgcolor: "#d97706",
      color: "#111111",
      borderStyle: "dashed",
      borderColor: partialBorder,
    },
    wrong: {
      bgcolor: "error.main",
      color: "#ffffff",
      backgroundImage: stripe(45, "rgba(0,0,0,0.16)", scale.wrong),
    },
    higher: {
      bgcolor: "#2563eb",
      color: "#ffffff",
      backgroundImage: stripe(0, "rgba(255,255,255,0.18)", scale.directional),
    },
    lower: {
      bgcolor: "#7c3aed",
      color: "#ffffff",
      backgroundImage: stripe(90, "rgba(255,255,255,0.18)", scale.directional),
    },
    neutral: { bgcolor: "#2b3038", color: "#ffffff" },
    header: { bgcolor: "#111827", color: "#d1d5db" },
  };

  return styles[status];
}

function stripe(degrees: number, color: string, [mark, space]: [number, number]) {
  return `repeating-linear-gradient(${degrees}deg, ${color} 0 ${mark}px, transparent ${mark}px ${space}px)`;
}
