"use client";

import Link from "next/link";
import {
  Box,
  Flex,
  Grid,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  ChartCandlestick,
  Eye,
  Percent,
  Swords,
  Trophy,
  Users,
  Gamepad2,
} from "lucide-react";
import { ModeHeader } from "@/components/spectacle/mode-header";
import { LiveTicker } from "@/components/spectacle/live-ticker";
import {
  GhBadge,
  GhButton,
  GhEmptyState,
  GhSurface,
  SectionDivider,
} from "@/components/ui";

/**
 * Esports prediction markets — coming soon (no mock listings).
 */
export default function MarketsPage() {
  return (
    <VStack align="stretch" gap="0" pb="phi5">
      <ModeHeader
        mode="play"
        icon={ChartCandlestick}
        title="Esports betable markets"
        description="Prediction markets on heads-up, brackets, and room outcomes — settle with the arena."
        badge="Coming soon"
        action={
          <GhBadge tone="muted" fontSize="xs" letterSpacing="0.08em" textTransform="uppercase">
            Coming soon
          </GhBadge>
        }
      />

      {/* Explainer — same pattern as rooms / challenges / moderators */}
      <GhSurface
        variant="elevated"
        p={{ base: "phi3", md: "phi4" }}
        mb="phi4"
        borderColor="prize.solid"
        boxShadow="glow-prize"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          inset="0"
          opacity={0.85}
          backgroundImage="
            radial-gradient(ellipse 55% 70% at 95% 10%, rgba(244,63,168,0.18), transparent 50%),
            radial-gradient(ellipse 40% 50% at 5% 90%, rgba(163,255,61,0.08), transparent 45%)
          "
          pointerEvents="none"
        />
        <Box position="relative">
          <HStack gap="2" mb="phi3" flexWrap="wrap" align="flex-start">
            <Box
              w="10"
              h="10"
              borderRadius="xl"
              bg="prize.muted"
              color="prize.fg"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
              borderWidth="1px"
              borderColor="prize.solid"
            >
              <ChartCandlestick size={20} />
            </Box>
            <Box minW="0" flex="1">
              <HStack gap="2" mb="1" flexWrap="wrap">
                <Text
                  fontFamily="heading"
                  fontWeight="extrabold"
                  fontSize="md"
                  letterSpacing="0.03em"
                >
                  Prediction markets for esports
                </Text>
                <GhBadge tone="muted" letterSpacing="0.08em" textTransform="uppercase">
                  Coming soon
                </GhBadge>
              </HStack>
              <Text fontSize="xs" color="fg.subtle">
                Moneyline · outright · room books · winner cut of volume
              </Text>
            </Box>
          </HStack>

          <Text
            fontSize="sm"
            color="fg.muted"
            lineHeight="1.6"
            maxW="40rem"
            mb="phi4"
          >
            Trade outcomes on live Gamerholic events. Spectators wager on
            heads-up money matches, tournament brackets, and room games —
            markets settle with the on-chain result, and the winner can earn a
            cut of betable volume.
          </Text>

          <Grid
            templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
            gap="phi3"
          >
            {[
              {
                icon: Swords,
                t: "Heads-up moneylines",
                d: "Pick a side on 1v1 escrow matches. Odds track the board until the match settles.",
              },
              {
                icon: Trophy,
                t: "Tournament outrights",
                d: "Bracket markets on host events — volume follows the pot and the final path.",
              },
              {
                icon: Gamepad2,
                t: "Room books",
                d: "Lobby outcomes and squad winners. Hosts open the book when the feature ships.",
              },
            ].map((x) => {
              const Icon = x.icon;
              return (
                <Box
                  key={x.t}
                  p="phi3"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="border.default"
                  bg="bg.glass"
                >
                  <Box color="prize.fg" mb="2">
                    <Icon size={18} />
                  </Box>
                  <Text
                    fontFamily="heading"
                    fontWeight="bold"
                    fontSize="sm"
                    mb="1"
                  >
                    {x.t}
                  </Text>
                  <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
                    {x.d}
                  </Text>
                </Box>
              );
            })}
          </Grid>
        </Box>
      </GhSurface>

      <Box mb="phi4">
        <LiveTicker label="Markets" />
      </Box>

      {/* How it pays — muted coming-soon flow */}
      <GhSurface
        variant="glass"
        p={{ base: "phi3", md: "phi4" }}
        mb="phi4"
        borderColor="border.default"
      >
        <HStack gap="2" mb="phi3" flexWrap="wrap">
          <Percent size={16} color="var(--gh-colors-prize-fg)" />
          <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
            How settlement will work
          </Text>
          <GhBadge tone="muted">Preview</GhBadge>
        </HStack>
        <Grid
          templateColumns={{ base: "1fr", sm: "repeat(3, 1fr)" }}
          gap="phi3"
        >
          {[
            {
              icon: Users,
              t: "Spectators wager",
              d: "Open a book on a linked challenge, bracket, or room outcome.",
            },
            {
              icon: Eye,
              t: "Match settles",
              d: "Arena escrow and scores are source of truth — no shadow books.",
            },
            {
              icon: Trophy,
              t: "Winner cut",
              d: "Policy share of market volume can flow to the match winner.",
            },
          ].map((x) => {
            const Icon = x.icon;
            return (
              <HStack key={x.t} align="flex-start" gap="phi2">
                <Box
                  w="8"
                  h="8"
                  borderRadius="lg"
                  bg="prize.muted"
                  color="prize.fg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Icon size={14} />
                </Box>
                <Box>
                  <Text
                    fontFamily="heading"
                    fontWeight="bold"
                    fontSize="xs"
                    mb="0.5"
                  >
                    {x.t}
                  </Text>
                  <Text fontSize="xs" color="fg.muted" lineHeight="1.45">
                    {x.d}
                  </Text>
                </Box>
              </HStack>
            );
          })}
        </Grid>
      </GhSurface>

      <SectionDivider label="Open books" tone="prize" my="0" />

      <Box mt="phi3">
        <GhEmptyState
          icon={ChartCandlestick}
          title="Markets coming soon"
          description="Prediction markets for esports aren’t live yet. Create challenges and tournaments now — betable books will attach when this surface ships."
          action={
            <HStack gap="2" flexWrap="wrap" justify="center">
              <Link href="/challenges">
                <GhButton variant="primary" leftIcon={<Swords size={16} />}>
                  Heads-up board
                </GhButton>
              </Link>
              <Link href="/tournaments">
                <GhButton variant="prize" leftIcon={<Trophy size={16} />}>
                  Tournaments
                </GhButton>
              </Link>
            </HStack>
          }
        />
      </Box>

      <GhSurface variant="muted" p="phi3" mt="phi5">
        <HStack gap="2" align="flex-start">
          <ChartCandlestick
            size={16}
            color="var(--gh-colors-prize-fg)"
            style={{ marginTop: 2, flexShrink: 0 }}
          />
          <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
            No demo markets are listed here. When betable goes live, open books
            from challenges and brackets will appear on this board with live
            volume and settlement status.
          </Text>
        </HStack>
      </GhSurface>
    </VStack>
  );
}
