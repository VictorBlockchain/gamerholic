"use client";

import { Box, Flex, Grid, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import {
  ArrowRight,
  ChartCandlestick,
  Eye,
  Percent,
  Swords,
  Trophy,
  Gamepad2,
  Sparkles,
  Users,
} from "lucide-react";
import { GhBadge, GhButton } from "@/components/ui";
import { CountUp } from "@/components/spectacle/count-up";
import { ART } from "@/lib/art";

const SURFACES = [
  {
    icon: Swords,
    title: "Challenge",
    body: "Turn a 1v1 money match into a moneyline. Spectators pick a side.",
    short: "1v1 moneyline",
    tone: "brand" as const,
  },
  {
    icon: Trophy,
    title: "Tournament",
    body: "Outright or round markets on host brackets — volume follows the pot.",
    short: "Bracket markets",
    tone: "prize" as const,
  },
  {
    icon: Gamepad2,
    title: "Room",
    body: "Lobby outcomes, squad winners, custom room games — open a book.",
    short: "Lobby books",
    tone: "live" as const,
  },
] as const;

/**
 * Betable markets pitch — compact on mobile, full on desktop.
 */
export function BetableMarketsSection() {
  return (
    <Box
      id="betable"
      className="gh-home-section"
      scrollMarginTop="6rem"
      position="relative"
      overflow="hidden"
      borderRadius={{ base: "2xl", md: "3xl" }}
      borderWidth="1px"
      borderColor="prize.solid"
      minH={{ base: "auto", lg: "24rem" }}
      boxShadow="glow-prize"
    >
      {/* Background art */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ART.headsUp}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "brightness(0.26) saturate(1.15)",
        }}
      />
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(115deg, rgba(13,11,26,0.94) 0%, rgba(13,11,26,0.82) 42%, rgba(244,63,168,0.28) 100%)"
      />
      <Box
        position="absolute"
        inset="0"
        opacity={0.45}
        backgroundImage="
          radial-gradient(ellipse 55% 65% at 92% 15%, rgba(244,63,168,0.22), transparent 50%),
          radial-gradient(ellipse 40% 50% at 8% 85%, rgba(163,255,61,0.1), transparent 45%)
        "
        pointerEvents="none"
      />

      {/* ── Mobile ── */}
      <Box display={{ base: "block", lg: "none" }} position="relative" p="phi3">
        <HStack gap="2" flexWrap="wrap" mb="phi2">
          <GhBadge tone="prize" pulse>
            <ChartCandlestick size={11} /> Betable
          </GhBadge>
          <GhBadge tone="brand">Esports</GhBadge>
        </HStack>

        <HStack gap="phi2" align="center" mb="phi2">
          <Box
            w="10"
            h="10"
            borderRadius="xl"
            bg="prize.muted"
            borderWidth="1px"
            borderColor="prize.solid"
            color="prize.fg"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <ChartCandlestick size={20} />
          </Box>
          <Heading
            as="h2"
            fontFamily="heading"
            fontSize="lg"
            fontWeight="extrabold"
            letterSpacing="0.03em"
            lineHeight="1.15"
            textTransform="uppercase"
          >
            Betable{" "}
            <Text as="span" className="gh-text-prize">
              your challenge
            </Text>
          </Heading>
        </HStack>

        <Text fontSize="sm" color="fg.muted" lineHeight="1.45" mb="phi3">
          Prediction markets on challenges, brackets & rooms. Spectators wager —
          winner takes a cut.
        </Text>

        {/* Surface chips — horizontal, not 3 stacked cards */}
        <HStack
          gap="1.5"
          mb="phi3"
          overflowX="auto"
          overflowY="hidden"
          className="gh-scroll-hide"
          css={{ WebkitOverflowScrolling: "touch" }}
        >
          {SURFACES.map(({ icon: Icon, title, short, tone }) => (
            <HStack
              key={title}
              gap="1.5"
              px="2.5"
              py="1.5"
              borderRadius="full"
              borderWidth="1px"
              borderColor={
                tone === "prize"
                  ? "prize.solid"
                  : tone === "live"
                    ? "live.solid"
                    : "border.brand"
              }
              bg="blackAlpha.500"
              flexShrink={0}
            >
              <Icon
                size={12}
                color={
                  tone === "prize"
                    ? "var(--gh-colors-prize-fg)"
                    : tone === "live"
                      ? "var(--gh-colors-live-fg)"
                      : "var(--gh-colors-brand-fg)"
                }
              />
              <Text fontFamily="heading" fontSize="2xs" fontWeight="bold">
                {title}
              </Text>
              <Text fontSize="2xs" color="fg.subtle">
                {short}
              </Text>
            </HStack>
          ))}
        </HStack>

        {/* Winner cut — compact card */}
        <Box
          borderRadius="xl"
          borderWidth="1px"
          borderColor="prize.solid"
          bg="bg.glass-strong"
          backdropFilter="blur(16px)"
          p="phi3"
          mb="phi3"
          boxShadow="glow-prize"
        >
          <HStack justify="space-between" mb="phi1">
            <HStack gap="1.5">
              <Percent size={14} color="var(--gh-colors-prize-fg)" />
              <Text
                fontFamily="heading"
                fontSize="2xs"
                fontWeight="bold"
                letterSpacing="0.12em"
                textTransform="uppercase"
                color="prize.fg"
              >
                Winner cut
              </Text>
            </HStack>
            <GhBadge tone="prize">Demo</GhBadge>
          </HStack>
          <HStack align="baseline" gap="2" mb="phi2">
            <CountUp
              value={8}
              decimals={0}
              fontFamily="heading"
              fontSize="2xl"
              fontWeight="extrabold"
              className="gh-text-prize"
              lineHeight="1"
              suffix="%"
            />
            <Text fontSize="xs" color="fg.muted" fontWeight="bold">
              of betable wagers
            </Text>
          </HStack>
          <HStack gap="2" fontSize="2xs" color="fg.muted" flexWrap="wrap">
            <HStack gap="1">
              <Users size={11} />
              <Text>Spectators bet</Text>
            </HStack>
            <Text opacity={0.5}>·</Text>
            <HStack gap="1">
              <Trophy size={11} />
              <Text>Winner earns</Text>
            </HStack>
            <Text opacity={0.5}>·</Text>
            <Text color="prize.fg" fontWeight="bold">
              e.g. 42.8 ICP vol
            </Text>
          </HStack>
        </Box>

        <VStack align="stretch" gap="2">
          <Box position="relative" w="100%">
            <GhButton
              variant="prize"
              size="md"
              w="100%"
              disabled
              opacity={0.45}
              cursor="not-allowed"
              leftIcon={<ChartCandlestick size={16} />}
              rightIcon={<ArrowRight size={14} />}
              _hover={{ filter: "none" }}
              _disabled={{ opacity: 0.45, cursor: "not-allowed" }}
            >
              Browse markets
            </GhButton>
            <GhBadge
              tone="muted"
              position="absolute"
              top="-0.4rem"
              right="0.5rem"
              fontSize="2xs"
              letterSpacing="0.08em"
              textTransform="uppercase"
            >
              Coming soon
            </GhBadge>
          </Box>
          <Box position="relative" w="100%">
            <GhButton
              variant="outline"
              size="sm"
              w="100%"
              disabled
              opacity={0.45}
              cursor="not-allowed"
              leftIcon={<Sparkles size={14} />}
              _hover={{ filter: "none", bg: "transparent", borderColor: "border.strong", color: "fg.default" }}
              _disabled={{ opacity: 0.45, cursor: "not-allowed" }}
            >
              Open a market
            </GhButton>
            <GhBadge
              tone="muted"
              position="absolute"
              top="-0.35rem"
              right="0.5rem"
              fontSize="2xs"
              letterSpacing="0.08em"
              textTransform="uppercase"
            >
              Coming soon
            </GhBadge>
          </Box>
        </VStack>
      </Box>

      {/* ── Desktop ── */}
      <Flex
        display={{ base: "none", lg: "flex" }}
        position="relative"
        direction="row"
        gap="phi5"
        align="stretch"
        p="phi5"
      >
        <VStack align="flex-start" gap="phi3" flex="1.15" justify="center">
          <HStack gap="2" flexWrap="wrap">
            <GhBadge tone="prize" pulse>
              <ChartCandlestick size={11} /> Betable
            </GhBadge>
            <GhBadge tone="brand">Esports markets</GhBadge>
            <GhBadge tone="muted">Spectators welcome</GhBadge>
          </HStack>

          <HStack gap="phi2" align="flex-start">
            <Box
              w="14"
              h="14"
              borderRadius="2xl"
              bg="prize.muted"
              borderWidth="1px"
              borderColor="prize.solid"
              color="prize.fg"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
              boxShadow="glow-prize"
            >
              <ChartCandlestick size={28} />
            </Box>
            <Box>
              <Heading
                as="h2"
                fontFamily="heading"
                fontSize="3xl"
                fontWeight="extrabold"
                letterSpacing="0.03em"
                lineHeight="1.1"
                textTransform="uppercase"
              >
                Betable{" "}
                <Text as="span" className="gh-text-prize">
                  your challenge
                </Text>
              </Heading>
              <Text
                fontSize="md"
                color="fg.muted"
                mt="phi2"
                lineHeight="1.65"
                maxW="32rem"
              >
                Create a prediction market on your challenge, tournament, or room
                game. Spectators wager on the outcome — when the arena settles,
                the winner earns a cut of betable volume.
              </Text>
            </Box>
          </HStack>

          <Grid templateColumns="repeat(3, 1fr)" gap="phi2" w="100%" maxW="36rem">
            {SURFACES.map(({ icon: Icon, title, body, tone }) => (
              <Box
                key={title}
                p="phi3"
                borderRadius="xl"
                borderWidth="1px"
                borderColor={
                  tone === "prize"
                    ? "prize.solid"
                    : tone === "live"
                      ? "live.solid"
                      : "border.brand"
                }
                bg="blackAlpha.500"
                backdropFilter="blur(12px)"
              >
                <Box
                  w="8"
                  h="8"
                  borderRadius="lg"
                  mb="phi2"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg={
                    tone === "prize"
                      ? "prize.muted"
                      : tone === "live"
                        ? "live.muted"
                        : "brand.muted"
                  }
                  color={
                    tone === "prize"
                      ? "prize.fg"
                      : tone === "live"
                        ? "live.fg"
                        : "brand.fg"
                  }
                >
                  <Icon size={15} />
                </Box>
                <Text
                  fontFamily="heading"
                  fontWeight="extrabold"
                  fontSize="sm"
                  letterSpacing="0.04em"
                  mb="1"
                >
                  {title}
                </Text>
                <Text fontSize="xs" color="fg.muted" lineHeight="1.45">
                  {body}
                </Text>
              </Box>
            ))}
          </Grid>

          <HStack gap="phi2" flexWrap="wrap" pt="phi1" align="center">
            <Box position="relative">
              <GhButton
                variant="prize"
                size="lg"
                disabled
                opacity={0.45}
                cursor="not-allowed"
                leftIcon={<ChartCandlestick size={18} />}
                rightIcon={<ArrowRight size={16} />}
                _hover={{ filter: "none" }}
                _disabled={{ opacity: 0.45, cursor: "not-allowed" }}
              >
                Browse markets
              </GhButton>
              <GhBadge
                tone="muted"
                position="absolute"
                top="-0.45rem"
                right="-0.35rem"
                fontSize="2xs"
                letterSpacing="0.08em"
                textTransform="uppercase"
                boxShadow="md"
              >
                Coming soon
              </GhBadge>
            </Box>
            <Box position="relative">
              <GhButton
                variant="outline"
                size="lg"
                disabled
                opacity={0.45}
                cursor="not-allowed"
                leftIcon={<Sparkles size={16} />}
                _hover={{
                  filter: "none",
                  bg: "transparent",
                  borderColor: "border.strong",
                  color: "fg.default",
                }}
                _disabled={{ opacity: 0.45, cursor: "not-allowed" }}
              >
                Open a market
              </GhButton>
              <GhBadge
                tone="muted"
                position="absolute"
                top="-0.45rem"
                right="-0.35rem"
                fontSize="2xs"
                letterSpacing="0.08em"
                textTransform="uppercase"
                boxShadow="md"
              >
                Coming soon
              </GhBadge>
            </Box>
          </HStack>
        </VStack>

        <Box
          flex="1"
          maxW="26rem"
          w="100%"
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="prize.solid"
          bg="bg.glass-strong"
          backdropFilter="blur(20px)"
          p="phi4"
          alignSelf="center"
          boxShadow="glow-prize"
        >
          <HStack justify="space-between" mb="phi3" flexWrap="wrap" gap="2">
            <HStack gap="2">
              <Percent size={18} color="var(--gh-colors-prize-fg)" />
              <Text
                fontFamily="heading"
                fontSize="xs"
                fontWeight="bold"
                letterSpacing="0.14em"
                textTransform="uppercase"
                color="prize.fg"
              >
                Winner cut
              </Text>
            </HStack>
            <GhBadge tone="prize">Demo policy</GhBadge>
          </HStack>

          <Text
            fontSize="2xs"
            color="fg.subtle"
            mb="1"
            fontFamily="heading"
            letterSpacing="0.1em"
            textTransform="uppercase"
          >
            Share of betable wagers
          </Text>
          <HStack align="baseline" gap="2" mb="phi1">
            <CountUp
              value={8}
              decimals={0}
              fontFamily="heading"
              fontSize="4xl"
              fontWeight="extrabold"
              className="gh-text-prize"
              lineHeight="1"
              suffix="%"
            />
            <Text fontSize="sm" color="fg.muted" fontWeight="bold">
              to the winner
            </Text>
          </HStack>
          <Text fontSize="xs" color="fg.muted" mb="phi4" lineHeight="1.5">
            Policy-bounded split of market volume settles with the match — play
            the arena, earn from the book.
          </Text>

          <VStack align="stretch" gap="phi2" mb="phi3">
            <FlowRow
              icon={<Users size={14} />}
              label="Spectators"
              value="Wager on outcome"
            />
            <FlowRow
              icon={<Eye size={14} />}
              label="Market"
              value="Moneyline · outright · custom"
            />
            <FlowRow
              icon={<Trophy size={14} />}
              label="Winner"
              value="Earns % of betable pool"
              highlight
            />
          </VStack>

          <Box
            p="phi2"
            borderRadius="xl"
            bg="blackAlpha.400"
            borderWidth="1px"
            borderColor="border.default"
          >
            <Text
              fontSize="2xs"
              color="fg.subtle"
              mb="1"
              fontFamily="heading"
              letterSpacing="0.08em"
              textTransform="uppercase"
            >
              Example volume
            </Text>
            <HStack justify="space-between" align="baseline">
              <Text
                fontFamily="heading"
                fontWeight="extrabold"
                fontSize="lg"
                color="prize.fg"
              >
                42.8 ICP
              </Text>
              <Text fontSize="xs" color="fg.muted">
                Winner share ~3.4 ICP
              </Text>
            </HStack>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}

function FlowRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <HStack
      gap="phi2"
      p="phi2"
      borderRadius="xl"
      borderWidth="1px"
      borderColor={highlight ? "prize.solid" : "border.default"}
      bg={highlight ? "prize.muted" : "blackAlpha.400"}
      align="center"
    >
      <Box
        color={highlight ? "prize.fg" : "fg.subtle"}
        display="flex"
        flexShrink={0}
      >
        {icon}
      </Box>
      <Box minW="0" flex="1">
        <Text
          fontFamily="heading"
          fontSize="2xs"
          fontWeight="bold"
          letterSpacing="0.1em"
          textTransform="uppercase"
          color={highlight ? "prize.fg" : "fg.subtle"}
        >
          {label}
        </Text>
        <Text
          fontSize="xs"
          color={highlight ? "fg.default" : "fg.muted"}
          lineClamp={1}
        >
          {value}
        </Text>
      </Box>
    </HStack>
  );
}
