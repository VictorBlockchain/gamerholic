"use client";

import { Progress, Box, HStack, Text } from "@chakra-ui/react";

export type GhProgressProps = {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  tone?: "brand" | "prize" | "attr" | "live" | "success";
  size?: "sm" | "md" | "lg";
};

const RANGE: Record<NonNullable<GhProgressProps["tone"]>, string> = {
  brand: "brand.solid",
  prize: "prize.solid",
  attr: "attr.solid",
  live: "live.solid",
  success: "success.solid",
};

const H: Record<NonNullable<GhProgressProps["size"]>, string> = {
  sm: "1.5",
  md: "2.5",
  lg: "3.5",
};

export function GhProgress({
  value,
  max = 100,
  label,
  showValue = true,
  tone = "brand",
  size = "md",
}: GhProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <Progress.Root value={value} max={max} w="100%">
      {(label || showValue) && (
        <HStack justify="space-between" mb="1.5">
          {label ? (
            <Progress.Label
              fontFamily="heading"
              fontSize="2xs"
              fontWeight="bold"
              letterSpacing="0.12em"
              textTransform="uppercase"
              color="fg.subtle"
            >
              {label}
            </Progress.Label>
          ) : (
            <Box />
          )}
          {showValue ? (
            <Progress.ValueText
              fontFamily="mono"
              fontSize="xs"
              color="fg.muted"
            >
              {Math.round(pct)}%
            </Progress.ValueText>
          ) : null}
        </HStack>
      )}
      <Progress.Track
        bg="blackAlpha.500"
        borderRadius="full"
        h={H[size]}
        overflow="hidden"
        borderWidth="1px"
        borderColor="border.default"
      >
        <Progress.Range bg={RANGE[tone]} borderRadius="full" transition="width 0.3s ease" />
      </Progress.Track>
    </Progress.Root>
  );
}

/** Simple bar without Progress primitive (fallback) */
export function GhMeter({
  value,
  tone = "brand",
  h = "2",
}: {
  value: number;
  tone?: "brand" | "prize" | "attr" | "live";
  h?: string;
}) {
  const bg =
    tone === "prize"
      ? "prize.solid"
      : tone === "attr"
        ? "attr.solid"
        : tone === "live"
          ? "live.solid"
          : "brand.solid";
  return (
    <Box
      h={h}
      borderRadius="full"
      bg="blackAlpha.500"
      borderWidth="1px"
      borderColor="border.default"
      overflow="hidden"
    >
      <Box
        h="100%"
        w={`${Math.min(100, Math.max(0, value))}%`}
        bg={bg}
        borderRadius="full"
        transition="width 0.3s ease"
      />
    </Box>
  );
}
