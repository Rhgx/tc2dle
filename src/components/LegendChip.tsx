import { Box, Typography } from "@mui/material";
import type { ComparisonStatus } from "../types";
import { getStatusStyles } from "../styles/statusStyles";

type LegendChipProps = {
  label: string;
  status: ComparisonStatus;
};

export function LegendChip({ label, status }: LegendChipProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.35, sm: 1 }, minWidth: 0, flex: "0 1 auto" }}>
      <Box sx={{ width: { xs: 10, sm: 14 }, height: { xs: 10, sm: 14 }, borderRadius: "3px", flex: "0 0 auto", ...getStatusStyles(status, "legend") }} />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 700, fontSize: { xs: 10, sm: 12 }, lineHeight: 1, whiteSpace: "nowrap" }}
      >
        {label}
      </Typography>
    </Box>
  );
}
