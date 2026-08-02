"use client";

import Link from "next/link";
import { Box, Flex, Grid, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import {
  Gift,
  Landmark,
  Trophy,
  ArrowRight,
  Ticket,
  Sparkles,
  Coins,
} from "lucide-react";
import { GhBadge, GhButton } from "@/components/ui";
import { CountUp } from "@/components/spectacle/count-up";
import { ART } from "@/lib/art";

/**
 * Free Tournament + Community Vault —
 * compact mobile card · full desktop split.
 */
export function FreeTournamentVault({
  freeTournamentIcp = 12840,
  treasuryIcp = 48200,
  cycles = 2_450_000,
  platformIcp = 9100,
}: {
  freeTournamentIcp?: number;
  treasuryIcp?: number;
  cycles?: number;
  platformIcp?: number;
}) {
  return (
    <Box
      position="relative"
      overflow="hidden"
      borderRadius={{ base: "2xl", md: "3xl" }}
      borderWidth="1px"
      borderColor="attr.solid"
      minH={{ base: "auto", lg: "22rem" }}
      boxShadow="glow-attr"
    >
      {/* Background art */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ART.teamWin}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "brightness(0.28) saturate(1.1)",
        }}
      />
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(105deg, rgba(13,11,26,0.92) 0%, rgba(13,11,26,0.78) 45%, rgba(139,92,246,0.25) 100%)"
      />
      <Box
        position="absolute"
        inset="0"
        opacity={0.4}
        backgroundImage="
          radial-gradient(ellipse 60% 70% at 90% 20%, rgba(163,255,61,0.15), transparent 50%),
          radial-gradient(ellipse 40% 50% at 10% 80%, rgba(244,63,168,0.12), transparent 45%)
        "
        pointerEvents="none"
      />

      {/* ── Mobile layout ── */}
      <Box display={{ base: "block", lg: "none" }} position="relative" p="phi3">
        <HStack gap="2" flexWrap="wrap" mb="phi2">
          <GhBadge tone="attr" pulse>
            Community powered
          </GhBadge>
          <GhBadge tone="brand">Free entry</GhBadge>
        </HStack>

        <HStack gap="phi2" align="center" mb="phi2">
          <Box
            w="10"
            h="10"
            borderRadius="xl"
            bg="attr.muted"
            borderWidth="1px"
            borderColor="attr.solid"
            color="attr.fg"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Gift size={20} />
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
            Free{" "}
            <Text as="span" className="gh-text-attr">
              Tournaments
            </Text>
          </Heading>
        </HStack>

        <Text fontSize="sm" color="fg.muted" lineHeight="1.45" mb="phi3">
          Vault-funded brackets — play free, no entry stake.
        </Text>

        {/* Vault metric strip — first-class on mobile */}
        <Box
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.brand"
          bg="bg.glass-strong"
          backdropFilter="blur(16px)"
          p="phi3"
          mb="phi3"
        >
          <HStack justify="space-between" mb="phi1">
            <HStack gap="1.5">
              <Landmark size={14} color="var(--gh-colors-brand-fg)" />
              <Text
                fontFamily="heading"
                fontSize="2xs"
                fontWeight="bold"
                letterSpacing="0.12em"
                textTransform="uppercase"
                color="brand.fg"
              >
                Free fund
              </Text>
            </HStack>
            <GhBadge tone="live" pulse>
              Live
            </GhBadge>
          </HStack>
          <HStack align="baseline" gap="1.5" mb="phi2">
            <CountUp
              value={freeTournamentIcp}
              decimals={0}
              fontFamily="heading"
              fontSize="2xl"
              fontWeight="extrabold"
              className="gh-text-volt"
              lineHeight="1"
            />
            <Text fontFamily="heading" fontWeight="bold" color="brand.fg" fontSize="sm">
              ICP
            </Text>
          </HStack>
          <Grid templateColumns="repeat(3, 1fr)" gap="1.5">
            <FundCell label="Treasury" value={treasuryIcp} tone="attr" compactMobile />
            <FundCell label="Cycles" value={cycles} tone="live" compact />
            <FundCell label="Platform" value={platformIcp} tone="prize" compactMobile />
          </Grid>
        </Box>

        <VStack align="stretch" gap="2" mb="phi2">
          <Link href="/tournaments" style={{ width: "100%" }}>
            <GhButton variant="attr" size="md" w="100%" leftIcon={<Trophy size={16} />}>
              Browse free brackets
            </GhButton>
          </Link>
          <Link href="/create?type=tournament" style={{ width: "100%" }}>
            <GhButton
              variant="outline"
              size="sm"
              w="100%"
              rightIcon={<ArrowRight size={14} />}
            >
              Request allocation
            </GhButton>
          </Link>
        </VStack>

        <HStack
          gap="2"
          p="2"
          borderRadius="lg"
          bg="blackAlpha.500"
          borderWidth="1px"
          borderColor="attr.solid"
        >
          <Ticket size={14} color="var(--gh-colors-attr-fg)" />
          <Text fontSize="2xs" color="fg.muted" lineHeight="1.4">
            <strong style={{ color: "var(--gh-colors-fg-default)" }}>
              Multi Pass
            </strong>{" "}
            — up to 10 free brackets / mo
          </Text>
        </HStack>
      </Box>

      {/* ── Desktop layout (unchanged structure) ── */}
      <Flex
        display={{ base: "none", lg: "flex" }}
        position="relative"
        direction="row"
        gap="phi5"
        align="stretch"
        p="phi5"
      >
        <VStack align="flex-start" gap="phi3" flex="1.1" justify="center">
          <HStack gap="2" flexWrap="wrap">
            <GhBadge tone="attr" pulse>
              Community powered
            </GhBadge>
            <GhBadge tone="brand">Free entry</GhBadge>
            <GhBadge tone="prize">Sponsored pots</GhBadge>
          </HStack>

          <HStack gap="phi2" align="flex-start">
            <Box
              w="14"
              h="14"
              borderRadius="2xl"
              bg="attr.muted"
              borderWidth="1px"
              borderColor="attr.solid"
              color="attr.fg"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
              boxShadow="glow-attr"
            >
              <Gift size={28} />
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
                Free{" "}
                <Text as="span" className="gh-text-attr">
                  Tournaments
                </Text>
              </Heading>
              <Text
                fontSize="md"
                color="fg.muted"
                mt="phi2"
                lineHeight="1.65"
                maxW="28rem"
              >
                Platform-sponsored brackets funded by the community vault. Rake
                and donations fuel free entries — play without staking your own ICP.
              </Text>
            </Box>
          </HStack>

          <HStack gap="phi2" flexWrap="wrap" pt="phi1">
            <Link href="/tournaments">
              <GhButton variant="attr" size="lg" leftIcon={<Trophy size={18} />}>
                Browse free brackets
              </GhButton>
            </Link>
            <Link href="/create?type=tournament">
              <GhButton
                variant="outline"
                size="lg"
                rightIcon={<ArrowRight size={16} />}
              >
                Request allocation
              </GhButton>
            </Link>
          </HStack>

          <HStack
            gap="2"
            p="phi2"
            borderRadius="xl"
            bg="blackAlpha.500"
            borderWidth="1px"
            borderColor="attr.solid"
            maxW="md"
          >
            <Ticket size={16} color="var(--gh-colors-attr-fg)" />
            <Text fontSize="xs" color="fg.muted" lineHeight="1.45">
              <strong style={{ color: "var(--gh-colors-fg-default)" }}>
                Multi Tournament Pass
              </strong>{" "}
              holders get priority free seats — up to 10 free tournaments / month.
            </Text>
          </HStack>
        </VStack>

        <Box
          flex="1"
          maxW="26rem"
          w="100%"
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="border.brand"
          bg="bg.glass-strong"
          backdropFilter="blur(20px)"
          p="phi4"
          alignSelf="center"
        >
          <HStack justify="space-between" mb="phi3" flexWrap="wrap" gap="2">
            <HStack gap="2">
              <Landmark size={18} color="var(--gh-colors-brand-fg)" />
              <Text
                fontFamily="heading"
                fontSize="xs"
                fontWeight="bold"
                letterSpacing="0.14em"
                textTransform="uppercase"
                color="brand.fg"
              >
                Community vault
              </Text>
            </HStack>
            <GhBadge tone="live" pulse>
              Live demo
            </GhBadge>
          </HStack>

          <Text
            fontSize="2xs"
            color="fg.subtle"
            mb="1"
            fontFamily="heading"
            letterSpacing="0.1em"
            textTransform="uppercase"
          >
            Free tournament fund
          </Text>
          <HStack align="baseline" gap="2" mb="phi1">
            <CountUp
              value={freeTournamentIcp}
              decimals={0}
              fontFamily="heading"
              fontSize="4xl"
              fontWeight="extrabold"
              className="gh-text-volt"
              lineHeight="1"
            />
            <Text fontFamily="heading" fontWeight="bold" color="brand.fg" fontSize="lg">
              ICP
            </Text>
          </HStack>
          <Text fontSize="xs" color="fg.muted" mb="phi4" lineHeight="1.5">
            Available for free-entry allocations (≤10% of treasury policy).
          </Text>

          <Grid templateColumns="repeat(3, 1fr)" gap="phi2">
            <FundCell label="Treasury" value={treasuryIcp} tone="attr" suffix=" ICP" />
            <FundCell label="Cycles" value={cycles} tone="live" compact />
            <FundCell label="Platform" value={platformIcp} tone="prize" suffix=" ICP" />
          </Grid>

          <HStack mt="phi3" gap="phi2" color="fg.subtle" fontSize="2xs">
            <Coins size={12} />
            <Text>Rake · donations · host surplus → free play</Text>
            <Sparkles size={12} />
          </HStack>
        </Box>
      </Flex>
    </Box>
  );
}

function FundCell({
  label,
  value,
  tone,
  compact,
  compactMobile,
  suffix,
}: {
  label: string;
  value: number;
  tone: "attr" | "live" | "prize";
  compact?: boolean;
  compactMobile?: boolean;
  suffix?: string;
}) {
  const color =
    tone === "live" ? "live.fg" : tone === "prize" ? "prize.fg" : "attr.fg";
  const short =
    compact || compactMobile
      ? value > 999_999
        ? `${(value / 1_000_000).toFixed(2)}M`
        : value > 999
          ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
          : value.toLocaleString()
      : value.toLocaleString();

  return (
    <Box
      p={compactMobile ? "1.5" : "phi2"}
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border.default"
      bg="blackAlpha.400"
    >
      <Text
        fontSize="2xs"
        color="fg.subtle"
        mb="0.5"
        fontFamily="heading"
        letterSpacing="0.06em"
      >
        {label}
      </Text>
      <Text
        fontFamily="heading"
        fontWeight="extrabold"
        fontSize={compact || compactMobile ? "xs" : "md"}
        color={color}
        fontVariantNumeric="tabular-nums"
      >
        {short}
        {suffix && !compact && !compactMobile ? (
          <Text as="span" fontSize="2xs" ml="0.5" fontWeight="bold">
            {suffix.trim()}
          </Text>
        ) : null}
      </Text>
    </Box>
  );
}
