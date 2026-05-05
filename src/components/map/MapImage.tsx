import { Box, Typography } from "@mui/material";
import type { ResponsiveStyleValue } from "@mui/system";
import type { Tc2Map } from "../../types";

type MapImageProps = {
  map?: Tc2Map;
  width?: ResponsiveStyleValue<number | string>;
  height?: ResponsiveStyleValue<number | string>;
  fit?: "cover" | "contain";
};

export function MapImage({ map, width = "100%", height = 72, fit = "cover" }: MapImageProps) {
  return (
    <Box
      onContextMenu={(event) => event.preventDefault()}
      sx={{
        width,
        height,
        borderRadius: 1,
        overflow: "hidden",
        bgcolor: "#111111",
        border: "1px solid rgba(255,255,255,0.12)",
        display: "grid",
        placeItems: "center",
      }}
    >
      {map?.imageUrl ? (
        <Box
          component="img"
          src={map.imageUrl}
          alt=""
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
          loading="eager"
          decoding="async"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: fit,
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      ) : (
        <Typography sx={{ fontWeight: 900, color: "primary.main", fontSize: 22 }}>
          {map?.name?.slice(0, 1) || "?"}
        </Typography>
      )}
    </Box>
  );
}
