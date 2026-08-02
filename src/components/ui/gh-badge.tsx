"use client";

import { Box, type BoxProps } from "@chakra-ui/react";

export type GhBadgeTone =
  | "default"
  | "brand"
  | "prize"
  | "attr"
  | "live"
  | "success"
  | "danger"
  | "muted";

export type GhBadgeProps = BoxProps & {
  tone?: GhBadgeTone;
  pulse?: boolean;
};

const tones: Record<GhBadgeTone, BoxProps> = {
  default: {
    bg: "whiteAlpha.100",
    color: "fg.default",
    borderColor: "border.default",
  },
  brand: {
    bg: "brand.muted",
    color: "brand.fg",
    borderColor: "border.brand",
  },
  prize: {
    bg: "prize.muted",
    color: "prize.fg",
    borderColor: "prize.solid",
  },
  attr: {
    bg: "attr.muted",
    color: "attr.fg",
    borderColor: "attr.solid",
  },
  live: {
    bg: "live.muted",
    color: "live.fg",
    borderColor: "live.solid",
  },
  success: {
    bg: "rgba(34, 197, 94, 0.14)",
    color: "success.solid",
    borderColor: "rgba(34, 197, 94, 0.35)",
  },
  danger: {
    bg: "rgba(244, 63, 94, 0.14)",
    color: "danger.solid",
    borderColor: "rgba(244, 63, 94, 0.35)",
  },
  muted: {
    bg: "bg.muted",
    color: "fg.muted",
    borderColor: "border.default",
  },
};

export function GhBadge({
  tone = "default",
  pulse,
  children,
  ...rest
}: GhBadgeProps) {
  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      gap="1.5"
      px="2.5"
      py="0.5"
      borderRadius="full"
      borderWidth="1px"
      fontSize="xs"
      fontWeight="bold"
      letterSpacing="0.02em"
      textTransform="uppercase"
      {...tones[tone]}
      {...rest}
    >
      {pulse ? (
        <Box
          as="span"
          w="1.5"
          h="1.5"
          borderRadius="full"
          bg="currentColor"
          className="gh-fab-glow"
        />
      ) : null}
      {children}
    </Box>
  );
}
