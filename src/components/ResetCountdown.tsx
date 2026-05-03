import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { getNextResetText } from "../lib/date";

export function ResetCountdown() {
  const [remaining, setRemaining] = useState(() => getNextResetText());

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(getNextResetText()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
      Next reset in{" "}
      <Box
        component="span"
        sx={{
          display: "inline-block",
          minWidth: "8ch",
          textAlign: "left",
          fontVariantNumeric: "tabular-nums",
          fontFeatureSettings: '"tnum"',
        }}
      >
        {remaining}
      </Box>
    </Typography>
  );
}
