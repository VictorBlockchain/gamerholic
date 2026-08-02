"use client";

import { Box, Flex, Text, type BoxProps } from "@chakra-ui/react";

type Tone = "brand" | "prize" | "attr" | "live" | "neutral";

const LINE: Record<Tone, string> = {
  brand: "linear-gradient(90deg, transparent, rgba(163,255,61,0.55), transparent)",
  prize: "linear-gradient(90deg, transparent, rgba(244,63,168,0.55), transparent)",
  attr: "linear-gradient(90deg, transparent, rgba(139,92,246,0.55), transparent)",
  live: "linear-gradient(90deg, transparent, rgba(34,211,238,0.55), transparent)",
  neutral:
    "linear-gradient(90deg, transparent, rgba(148,163,184,0.28), transparent)",
};

const GEM: Record<Tone, string> = {
  brand: "brand.fg",
  prize: "prize.fg",
  attr: "attr.fg",
  live: "live.fg",
  neutral: "fg.subtle",
};

/**
 * Section break using golden-ratio vertical padding.
 * Optional label sits in a gem/chevron motif.
 */
export function SectionDivider({
  label,
  tone = "neutral",
  my,
  ...rest
}: BoxProps & { label?: string; tone?: Tone }) {
  return (
    <Box
      as="div"
      role="separator"
      my={my ?? { base: "phi4", md: "phi5" }}
      py={{ base: "phi3", md: "phi4" }}
      {...rest}
    >
      <Flex align="center" gap="phi3">
        <Box flex="1" h="1px" bgImage={LINE[tone]} bgRepeat="no-repeat" bgSize="100% 1px" />
        {label ? (
          <Flex align="center" gap="2" flexShrink={0}>
            <Box
              w="1.5"
              h="1.5"
              transform="rotate(45deg)"
              bg={GEM[tone]}
              opacity={0.9}
              boxShadow={`0 0 12px var(--gh-colors-${tone === "neutral" ? "fg-subtle" : tone + "-fg"})`}
            />
            <Text
              fontFamily="heading"
              fontSize="2xs"
              fontWeight="bold"
              letterSpacing="0.2em"
              textTransform="uppercase"
              color={GEM[tone]}
              whiteSpace="nowrap"
            >
              {label}
            </Text>
            <Box
              w="1.5"
              h="1.5"
              transform="rotate(45deg)"
              bg={GEM[tone]}
              opacity={0.9}
            />
          </Flex>
        ) : (
          <Box
            w="2"
            h="2"
            transform="rotate(45deg)"
            borderWidth="1px"
            borderColor={GEM[tone]}
            opacity={0.7}
            flexShrink={0}
          />
        )}
        <Box flex="1" h="1px" bgImage={LINE[tone]} bgRepeat="no-repeat" bgSize="100% 1px" />
      </Flex>
    </Box>
  );
}
