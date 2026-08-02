"use client";

import { Box, Flex, Text, type BoxProps } from "@chakra-ui/react";

export type GhSpinnerProps = Omit<BoxProps, "direction"> & {
  size?: "sm" | "md" | "lg";
  tone?: "brand" | "prize" | "attr" | "live";
  label?: string;
};

const S = { sm: "4", md: "8", lg: "12" } as const;
const C = {
  brand: "brand.solid",
  prize: "prize.solid",
  attr: "attr.solid",
  live: "live.solid",
} as const;

export function GhSpinner({
  size = "md",
  tone = "brand",
  label,
  ...rest
}: GhSpinnerProps) {
  return (
    <Flex flexDirection="column" align="center" gap="phi2" {...rest}>
      <Box
        w={S[size]}
        h={S[size]}
        borderRadius="full"
        borderWidth="2px"
        borderColor="border.default"
        borderTopColor={C[tone]}
        animation="gh-spin 0.7s linear infinite"
      />
      {label ? (
        <Text
          fontFamily="heading"
          fontSize="2xs"
          fontWeight="bold"
          letterSpacing="0.14em"
          textTransform="uppercase"
          color="fg.subtle"
        >
          {label}
        </Text>
      ) : null}
    </Flex>
  );
}
