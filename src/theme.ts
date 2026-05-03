import { createTheme } from "@mui/material";

export const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0b0b0b",
      paper: "#1f1f1f",
    },
    primary: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#b45309",
      contrastText: "#111111",
    },
    secondary: { main: "#3b82f6" },
    success: { main: "#3fb950" },
    warning: { main: "#f2cc60" },
    error: { main: "#da3633" },
    text: {
      primary: "#f5f5f5",
      secondary: "#c9c9c9",
    },
    divider: "rgba(255,255,255,0.12)",
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "Inter, Roboto, Arial, sans-serif",
    h1: { fontWeight: 900, letterSpacing: "0.03em" },
    h2: { fontWeight: 800 },
    button: { fontWeight: 800, textTransform: "none" },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(255,255,255,0.12)",
        },
      },
    },
  },
});
