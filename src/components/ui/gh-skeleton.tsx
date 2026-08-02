"use client";

import { Box, type BoxProps } from "@chakra-ui/react";

export type GhSkeletonProps = BoxProps & {
  /** Circle avatar placeholder */
  circle?: boolean;
};

/**
 * Loading bone — subtle pulse on night canvas.
 */
export function GhSkeleton({
  circle,
  h = "4",
  w = "100%",
  borderRadius,
  ...rest
}: GhSkeletonProps) {
  return (
    <Box
      h={circle ? w : h}
      w={w}
      borderRadius={circle ? "full" : borderRadius ?? "lg"}
      bg="whiteAlpha.100"
      position="relative"
      overflow="hidden"
      _after={{
        content: '""',
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
        animation: "gh-shimmer 1.6s ease-in-out infinite",
      }}
      {...rest}
    />
  );
}

export function GhSkeletonCard() {
  return (
    <Box
      p="phi3"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="border.default"
      bg="bg.glass"
    >
      <Box display="flex" gap="phi2" mb="phi3">
        <GhSkeleton circle w="10" />
        <Box flex="1">
          <GhSkeleton h="3" w="40%" mb="2" />
          <GhSkeleton h="3" w="70%" />
        </Box>
      </Box>
      <GhSkeleton h="16" mb="phi3" borderRadius="xl" />
      <GhSkeleton h="9" borderRadius="xl" />
    </Box>
  );
}
