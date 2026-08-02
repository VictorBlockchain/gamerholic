"use client";

import { Box, HStack, Text } from "@chakra-ui/react";
import { Radio } from "lucide-react";

const DEFAULT_ITEMS = [
  "@ace hosted SF6 night · +1.2 ICP host fee",
  "Neon Track defended · 3 fails · bank +0.45 ICP",
  "Warzone room settled · host cut 0.6 ICP",
  "Neon Fang beat Iron Chorus · Power edge",
  "@nova posted 9.8M combo · try fee 0.25 ICP",
  "Friday Bracket filled 24/32 · host fee live",
];

/** Horizontal marquee — social proof as spectacle */
export function LiveTicker({
  items = DEFAULT_ITEMS,
  label = "Arena feed",
}: {
  items?: string[];
  label?: string;
}) {
  const loop = [...items, ...items];

  return (
    <Box
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="border.default"
      bg="bg.glass"
      backdropFilter="blur(14px)"
      overflow="hidden"
      position="relative"
    >
      <HStack
        position="absolute"
        left="0"
        top="0"
        bottom="0"
        zIndex={2}
        px="3"
        bg="linear-gradient(90deg, var(--gh-colors-bg-elevated) 55%, transparent)"
        gap="1.5"
        minW="7.5rem"
        pointerEvents="none"
      >
        <Box color="live.fg" className="gh-live-dot">
          <Radio size={14} />
        </Box>
        <Text
          fontFamily="heading"
          fontSize="2xs"
          fontWeight="bold"
          letterSpacing="0.14em"
          textTransform="uppercase"
          color="live.fg"
        >
          {label}
        </Text>
      </HStack>
      <Box
        className="gh-ticker-track"
        display="flex"
        gap="phi4"
        py="2.5"
        pl="8rem"
        whiteSpace="nowrap"
      >
        {loop.map((line, i) => (
          <Text
            key={`${line}-${i}`}
            fontSize="xs"
            color="fg.muted"
            flexShrink={0}
          >
            <Text as="span" color="fg.subtle" mx="2">
              ◆
            </Text>
            {line}
          </Text>
        ))}
      </Box>
    </Box>
  );
}
