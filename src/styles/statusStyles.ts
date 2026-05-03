import type { SxProps, Theme } from "@mui/material";
import type { ComparisonStatus } from "../types";

export const statusStyles: Record<ComparisonStatus, SxProps<Theme>> = {
  correct: { bgcolor: "success.main", color: "#ffffff" },
  partial: { bgcolor: "warning.main", color: "#111111" },
  "partial-light": { bgcolor: "#d97706", color: "#111111" },
  wrong: { bgcolor: "error.main", color: "#ffffff" },
  higher: { bgcolor: "#2563eb", color: "#ffffff" },
  lower: { bgcolor: "#7c3aed", color: "#ffffff" },
  neutral: { bgcolor: "#2b3038", color: "#ffffff" },
  header: { bgcolor: "#111827", color: "#d1d5db" },
};
