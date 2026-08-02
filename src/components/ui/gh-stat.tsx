"use client";

import { Box, Text, type BoxProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

export type GhStatProps = BoxProps & {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "brand" | "prize" | "attr" | "live" | "default";
};

const VALUE_COLOR = {
  brand: "brand.fg",
  prize: "prize.fg",
  attr: "attr.fg",
  live: "live.fg",
  default: "fg.default",
} as const;

/**
 * HUD stat tile — volume, bank, host cut, etc.
 */
export function GhStat({
  label,
  value,
  hint,
  tone = "default",
  ...rest
}: GhStatProps) {
  return (
    <Box
      p="phi3"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      bg="blackAlpha.400"
      {...rest}
    >
      <Text
        fontFamily="heading"
        fontSize="2xs"
        fontWeight="bold"
        letterSpacing="0.12em"
        textTransform="uppercase"
        color="fg.subtle"
        mb="1"
      >
        {label}
      </Text>
      <Text
        fontFamily="heading"
        fontWeight="extrabold"
        fontSize="xl"
        color={VALUE_COLOR[tone]}
        lineHeight="1.1"
        fontVariantNumeric="tabular-nums"
      >
        {value}
      </Text>
      {hint ? (
        <Text fontSize="xs" color="fg.muted" mt="1">
          {hint}
        </Text>
      ) : null}
    </Box>
  );
}
