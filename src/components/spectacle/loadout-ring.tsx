"use client";

import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import { ATTRIBUTES, type AttributeId } from "@/lib/attributes";
import { GhBadge } from "@/components/ui";

const SLOT_IDS: AttributeId[] = [
  "power",
  "speed",
  "attack",
  "defense",
  "luck",
  "focus",
  "vitality",
  "crit",
];

/**
 * Attribute orbs around a Dexsta XFT core — Pokémon-style loadout board.
 */
export function LoadoutRing({
  equipped = {
    power: 72,
    speed: 88,
    attack: 81,
    defense: 54,
  },
  xftName = "Neon Fang",
  xftSub = "Dexsta Lead · AURORA",
}: {
  equipped?: Partial<Record<AttributeId, number>>;
  xftName?: string;
  xftSub?: string;
}) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = 108;

  return (
    <Box
      position="relative"
      w="100%"
      maxW={`${size}px`}
      mx="auto"
      aspectRatio="1"
    >
      {/* Orbit ring */}
      <Box
        position="absolute"
        inset="12%"
        borderRadius="full"
        borderWidth="1px"
        borderColor="border.default"
        borderStyle="dashed"
        opacity={0.6}
        className="gh-orbit-spin-slow"
      />

      {/* Center XFT */}
      <Flex
        position="absolute"
        left="50%"
        top="50%"
        transform="translate(-50%, -50%)"
        w="7.5rem"
        h="7.5rem"
        borderRadius="2xl"
        bg="bg.elevated"
        borderWidth="2px"
        borderColor="attr.solid"
        boxShadow="glow-attr"
        direction="column"
        align="center"
        justify="center"
        zIndex={2}
        p="2"
        textAlign="center"
      >
        <Text
          fontFamily="heading"
          fontSize="2xl"
          fontWeight="extrabold"
          className="gh-text-attr"
          lineHeight="1"
        >
          {xftName.slice(0, 1)}
        </Text>
        <Text fontFamily="heading" fontSize="2xs" fontWeight="bold" mt="1" lineClamp={1}>
          {xftName}
        </Text>
        <Text fontSize="2xs" color="fg.subtle" lineClamp={1}>
          {xftSub}
        </Text>
      </Flex>

      {/* Attribute orbs */}
      {SLOT_IDS.map((id, i) => {
        const meta = ATTRIBUTES.find((a) => a.id === id)!;
        const val = equipped[id];
        const active = val != null && val > 0;
        const a = (-Math.PI / 2) + (i * 2 * Math.PI) / SLOT_IDS.length;
        const x = 50 + (r / size) * 100 * Math.cos(a);
        const y = 50 + (r / size) * 100 * Math.sin(a);

        return (
          <VStack
            key={id}
            position="absolute"
            left={`${x}%`}
            top={`${y}%`}
            transform="translate(-50%, -50%)"
            zIndex={3}
            gap="0.5"
            className={active ? "gh-orb-active" : undefined}
          >
            <Box
              w="2.75rem"
              h="2.75rem"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg={active ? `${meta.color}28` : "bg.muted"}
              borderWidth="2px"
              borderColor={active ? meta.color : "border.default"}
              boxShadow={active ? `0 0 16px ${meta.color}55` : "none"}
              transition="all 0.2s"
            >
              <Text
                fontFamily="heading"
                fontSize="2xs"
                fontWeight="extrabold"
                color={active ? meta.color : "fg.subtle"}
              >
                {meta.short}
              </Text>
            </Box>
            {active ? (
              <GhBadge tone="muted" fontSize="2xs" px="1.5" py="0">
                {val}
              </GhBadge>
            ) : (
              <Text fontSize="2xs" color="fg.subtle">
                empty
              </Text>
            )}
          </VStack>
        );
      })}
    </Box>
  );
}
