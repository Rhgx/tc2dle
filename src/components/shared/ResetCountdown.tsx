import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import { getNextResetText } from "../../lib/date";

export function ResetCountdown() {
  const [remaining, setRemaining] = useState(() => getNextResetText());

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(getNextResetText()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <Box component="span">
      Next reset in{" "}
      <Box
        component="span"
        sx={{
          fontVariantNumeric: "tabular-nums",
          fontFeatureSettings: '"tnum"',
        }}
      >
        {remaining}
      </Box>
    </Box>
  );
}
