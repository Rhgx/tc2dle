import { Box, Typography } from "@mui/material";

export function Header() {
  return (
    <Box component="header" sx={{ textAlign: "center", mb: { xs: 2, sm: 3 } }}>
      <Typography variant="h1" sx={{ fontSize: { xs: 36, sm: 56 }, color: "primary.main", textShadow: "0 2px 0 #000" }}>
        TC2DLE
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5, fontWeight: 700, fontSize: { xs: 13, sm: 16 } }}>
        Daily Typical Colors 2 weapon guessing game
      </Typography>
    </Box>
  );
}
