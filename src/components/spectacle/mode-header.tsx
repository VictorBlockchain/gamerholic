"use client";

import { Box, Flex, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { GhBadge } from "@/components/ui";

export type ArenaMode = "host" | "arcade" | "battle" | "play" | "default";

const MODE_SKIN: Record<
  ArenaMode,
  {
    kicker: string;
    rail: string;
    glow: string;
    badge: "prize" | "attr" | "brand" | "live";
    gridClass: string;
  }
> = {
  host: {
    kicker: "Director booth",
    rail: "linear-gradient(90deg, #d97706, #f59e0b, #b45309)",
    glow: "radial-gradient(ellipse 80% 80% at 10% 0%, rgba(217,119,6,0.28), transparent 55%)",
    badge: "prize",
    gridClass: "gh-mode-grid-host",
  },
  arcade: {
    kicker: "High Score Arcade",
    rail: "linear-gradient(90deg, #4f46e5, #6366f1, #2563eb)",
    glow: "radial-gradient(ellipse 80% 80% at 90% 0%, rgba(99,102,241,0.28), transparent 55%)",
    badge: "attr",
    gridClass: "gh-mode-grid-arcade",
  },
  battle: {
    kicker: "XFT Battle arena",
    rail: "linear-gradient(90deg, #4f46e5, #2563eb, #0d9488)",
    glow: "radial-gradient(ellipse 70% 70% at 50% 0%, rgba(37,99,235,0.22), transparent 55%)",
    badge: "brand",
    gridClass: "gh-mode-grid-battle",
  },
  play: {
    kicker: "Matchmaking",
    rail: "linear-gradient(90deg, #2563eb, #3b82f6)",
    glow: "radial-gradient(ellipse 70% 70% at 0% 0%, rgba(37,99,235,0.2), transparent 50%)",
    badge: "brand",
    gridClass: "gh-mode-grid-play",
  },
  default: {
    kicker: "Arena",
    rail: "linear-gradient(90deg, #2563eb, #d97706)",
    glow: "none",
    badge: "brand",
    gridClass: "",
  },
};

/**
 * Mode-skinned page hero — each product loop feels like its own micro-world.
 */
export function ModeHeader({
  mode = "default",
  icon: Icon,
  title,
  description,
  badge,
  action,
  children,
}: {
  mode?: ArenaMode;
  icon?: LucideIcon;
  title: string;
  description?: string;
  badge?: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  const skin = MODE_SKIN[mode];

  return (
    <Box
      position="relative"
      overflow="hidden"
      borderRadius="3xl"
      borderWidth="1px"
      borderColor="border.default"
      bg="bg.elevated"
      mb="phi4"
      className={skin.gridClass}
    >
      <Box h="1" bg={skin.rail} />
      <Box
        position="absolute"
        inset="0"
        backgroundImage={skin.glow}
        pointerEvents="none"
      />
      {mode === "arcade" ? <Box className="gh-crt-scan" pointerEvents="none" /> : null}

      <Flex
        position="relative"
        direction={{ base: "column", md: "row" }}
        align={{ md: "flex-start" }}
        justify="space-between"
        gap="phi3"
        p={{ base: "phi3", md: "phi4" }}
      >
        <VStack align="flex-start" gap="phi2" maxW="40rem">
          <HStack gap="2" flexWrap="wrap">
            {Icon ? (
              <Box
                w="10"
                h="10"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="blackAlpha.400"
                borderWidth="1px"
                borderColor="border.default"
                color={
                  skin.badge === "prize"
                    ? "prize.fg"
                    : skin.badge === "attr"
                      ? "attr.fg"
                      : skin.badge === "live"
                        ? "live.fg"
                        : "brand.fg"
                }
              >
                <Icon size={20} />
              </Box>
            ) : null}
            <GhBadge tone={skin.badge}>{skin.kicker}</GhBadge>
            {badge ? <GhBadge tone="muted">{badge}</GhBadge> : null}
          </HStack>
          <Heading
            as="h1"
            fontFamily="heading"
            fontSize={{ base: "xl", md: "2xl", lg: "3xl" }}
            fontWeight="extrabold"
            letterSpacing="0.02em"
            lineHeight="1.15"
          >
            {title}
          </Heading>
          {description ? (
            <Text fontSize="sm" color="fg.muted" lineHeight="1.65">
              {description}
            </Text>
          ) : null}
          {children}
        </VStack>
        {action ? <Box flexShrink={0}>{action}</Box> : null}
      </Flex>
    </Box>
  );
}
