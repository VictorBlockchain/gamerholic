"use client";

import { Box, type BoxProps } from "@chakra-ui/react";

export type GhSurfaceVariant =
  | "panel"
  | "elevated"
  | "muted"
  | "glass"
  | "brand"
  | "prize"
  | "attr"
  | "live";

export type GhSurfaceProps = BoxProps & {
  variant?: GhSurfaceVariant;
};

const map: Record<GhSurfaceVariant, BoxProps> = {
  panel: {
    bg: "bg.surface",
    borderWidth: "1px",
    borderColor: "border.default",
    boxShadow: "card",
  },
  elevated: {
    bg: "bg.elevated",
    borderWidth: "1px",
    borderColor: "border.default",
    boxShadow: "card",
  },
  muted: {
    bg: "bg.muted",
    borderWidth: "1px",
    borderColor: "border.default",
  },
  /** Hero-like translucent panel */
  glass: {
    bg: "bg.glass",
    borderWidth: "1px",
    borderColor: "border.default",
    backdropFilter: "blur(18px)",
    boxShadow: "card",
  },
  brand: {
    bg: "brand.muted",
    borderWidth: "1px",
    borderColor: "border.brand",
    boxShadow: "glow",
  },
  prize: {
    bg: "prize.muted",
    borderWidth: "1px",
    borderColor: "prize.solid",
    boxShadow: "glow-prize",
  },
  attr: {
    bg: "attr.muted",
    borderWidth: "1px",
    borderColor: "attr.solid",
    boxShadow: "glow-attr",
  },
  live: {
    bg: "live.muted",
    borderWidth: "1px",
    borderColor: "live.solid",
    boxShadow: "glow-live",
  },
};

export function GhSurface({
  variant = "panel",
  borderRadius = "2xl",
  p = "phi3",
  children,
  ...rest
}: GhSurfaceProps) {
  return (
    <Box borderRadius={borderRadius} p={p} {...map[variant]} {...rest}>
      {children}
    </Box>
  );
}
