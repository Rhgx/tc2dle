import { Box, Typography } from "@mui/material";
import type { ResponsiveStyleValue } from "@mui/system";
import type { Cosmetic } from "../../types";

type CosmeticImageProps = {
  cosmetic?: Cosmetic;
  size?: ResponsiveStyleValue<number | string>;
  grayscale?: boolean;
  rotation?: number;
  animate?: boolean;
};

export function CosmeticImage({ cosmetic, size = 96, grayscale = false, rotation = 0, animate = true }: CosmeticImageProps) {
  return (
    <Box
      onContextMenu={(event) => event.preventDefault()}
      sx={{
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
        overflow: "visible",
      }}
    >
      {cosmetic?.imageUrl ? (
        <Box
          component="img"
          src={cosmetic.imageUrl}
          alt=""
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
          loading="eager"
          decoding="async"
          sx={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            userSelect: "none",
            filter: grayscale ? "grayscale(1) contrast(1.08)" : "none",
            transform: `rotate(${rotation}deg)`,
            transition: animate ? "filter 500ms ease, transform 500ms ease" : "none",
          }}
        />
      ) : (
        <Typography sx={{ fontWeight: 900, color: "primary.main", fontSize: 28 }}>
          {cosmetic?.name?.slice(0, 1) || "?"}
        </Typography>
      )}
    </Box>
  );
}
