import { Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { getNextResetText } from "../lib/date";

export function ResetCountdown() {
  const [remaining, setRemaining] = useState(() => getNextResetText());

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(getNextResetText()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75, fontWeight: 800 }}>
      Next reset in {remaining}
    </Typography>
  );
}
