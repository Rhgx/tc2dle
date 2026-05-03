import { Box, Typography } from "@mui/material";
import type { ResponsiveStyleValue } from "@mui/system";
import type { Weapon } from "../types";

type WeaponIconProps = {
  weapon?: Weapon;
  size?: ResponsiveStyleValue<number | string>;
  bare?: boolean;
};

export function WeaponIcon({ weapon, size = 44, bare = false }: WeaponIconProps) {
  return (
    <Box
      onContextMenu={(event) => event.preventDefault()}
      sx={{
        width: size,
        height: size,
        borderRadius: bare ? 0 : 1,
        bgcolor: bare ? "transparent" : "#111111",
        border: bare ? 0 : "1px solid rgba(255,255,255,0.12)",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        flex: "0 0 auto",
      }}
    >
      {weapon?.iconUrl ? (
        <Box
          component="img"
          src={weapon.iconUrl}
          alt=""
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
          loading="eager"
          decoding="async"
          sx={{ width: "100%", height: "100%", objectFit: "contain", imageRendering: "auto", pointerEvents: "none", userSelect: "none" }}
        />
      ) : (
        <Typography sx={{ fontWeight: 900, color: "primary.main", fontSize: 22 }}>
          {weapon?.name?.slice(0, 1) || "?"}
        </Typography>
      )}
    </Box>
  );
}
