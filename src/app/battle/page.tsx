"use client";

import {
  Box,
  Flex,
  Grid,
  Text,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { ModeHeader } from "@/components/spectacle/mode-header";
import { StatRadar } from "@/components/spectacle/stat-radar";
import { StatCompare } from "@/components/spectacle/stat-compare";
import {
  GhBadge,
  GhButton,
  GhSurface,
  SectionDivider,
} from "@/components/ui";
import {
  BATTLE_EDGE_META,
  BATTLE_EDGE_ORDER,
  DEMO_FIGHTERS,
  type AttributeId,
  type BattleFighter,
} from "@/lib/attributes";
import { Crosshair, Swords, Sparkles, Hexagon } from "lucide-react";

/**
 * NFT-style XFT fighter card — fierce creature art + Tokens As Attributes edges.
 */
function NftFighterCard({
  fighter,
  side,
}: {
  fighter: BattleFighter;
  side: "left" | "right";
}) {
  const accent = side === "left" ? "#a3ff3d" : "#f43fa8";
  const rail =
    side === "left"
      ? "linear-gradient(90deg, #7dd41f, #a3ff3d, #22d3ee)"
      : "linear-gradient(90deg, #db2777, #f43fa8, #8b5cf6)";

  return (
    <Box
      position="relative"
      borderRadius="2xl"
      overflow="hidden"
      borderWidth="1px"
      borderColor={side === "left" ? "border.brand" : "prize.solid"}
      bg="bg.elevated"
      boxShadow={side === "left" ? "glow" : "glow-prize"}
      h="100%"
      transition="transform 0.15s, box-shadow 0.15s"
      _hover={{ transform: "translateY(-3px)" }}
    >
      {/* Holofoil rail */}
      <Box h="1.5" bg={rail} />

      {/* Portrait */}
      <Box position="relative" aspectRatio="1" bg="black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fighter.imageUrl || "/art/xft-battle.jpg"}
          alt={fighter.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "saturate(1.15) contrast(1.05)",
          }}
        />
        <Box
          position="absolute"
          inset="0"
          bg="linear-gradient(180deg, transparent 45%, rgba(7,6,18,0.95) 100%)"
        />
        {/* Corner NFT frame ticks */}
        <Box
          position="absolute"
          top="2"
          left="2"
          w="5"
          h="5"
          borderTopWidth="2px"
          borderLeftWidth="2px"
          borderColor={accent}
          opacity={0.85}
        />
        <Box
          position="absolute"
          top="2"
          right="2"
          w="5"
          h="5"
          borderTopWidth="2px"
          borderRightWidth="2px"
          borderColor={accent}
          opacity={0.85}
        />
        <Box
          position="absolute"
          bottom="2"
          left="2"
          w="5"
          h="5"
          borderBottomWidth="2px"
          borderLeftWidth="2px"
          borderColor={accent}
          opacity={0.85}
        />
        <Box
          position="absolute"
          bottom="2"
          right="2"
          w="5"
          h="5"
          borderBottomWidth="2px"
          borderRightWidth="2px"
          borderColor={accent}
          opacity={0.85}
        />

        <HStack
          position="absolute"
          top="3"
          left="3"
          right="3"
          justify="space-between"
        >
          <GhBadge tone={side === "left" ? "brand" : "prize"}>
            Lv {fighter.level}
          </GhBadge>
          {fighter.tokenId != null ? (
            <GhBadge tone="muted">#{fighter.tokenId}</GhBadge>
          ) : null}
        </HStack>

        <Box position="absolute" bottom="3" left="3" right="3">
          <Text
            fontFamily="heading"
            fontWeight="extrabold"
            fontSize={{ base: "lg", md: "xl" }}
            color="white"
            letterSpacing="0.04em"
            textShadow="0 2px 12px rgba(0,0,0,0.9)"
          >
            {fighter.name}
          </Text>
          <Text fontSize="xs" color="whiteAlpha.800" mt="0.5">
            {fighter.xftLabel}
            {fighter.element ? ` · ${fighter.element}` : ""}
          </Text>
        </Box>
      </Box>

      {/* Tokens As Attributes edge strip */}
      <Box p="phi3" bg="rgba(7,6,18,0.92)">
        <HStack gap="1.5" mb="phi2">
          <Hexagon size={12} color={accent} />
          <Text
            fontFamily="heading"
            fontSize="2xs"
            fontWeight="bold"
            letterSpacing="0.12em"
            textTransform="uppercase"
            color="fg.subtle"
          >
            Tokens As Attributes
          </Text>
        </HStack>
        <VStack align="stretch" gap="1.5">
          {BATTLE_EDGE_ORDER.map((id) => {
            const meta = BATTLE_EDGE_META[id];
            const val = Number(fighter.stats[id] ?? 0);
            return (
              <Box key={id}>
                <HStack justify="space-between" mb="0.5">
                  <Text
                    fontSize="2xs"
                    fontWeight="extrabold"
                    fontFamily="heading"
                    color={meta.color}
                    letterSpacing="0.06em"
                  >
                    {meta.short} · {meta.name}
                  </Text>
                  <Text
                    fontSize="2xs"
                    fontFamily="mono"
                    color="fg.muted"
                    fontWeight="bold"
                  >
                    {val}
                    <Text as="span" color="fg.subtle" ml="1">
                      {meta.token}
                    </Text>
                  </Text>
                </HStack>
                <Box
                  h="1"
                  borderRadius="full"
                  bg="blackAlpha.500"
                  overflow="hidden"
                >
                  <Box
                    h="100%"
                    w={`${Math.min(100, val)}%`}
                    bg={meta.color}
                    opacity={0.85}
                    boxShadow={`0 0 8px ${meta.color}`}
                  />
                </Box>
              </Box>
            );
          })}
        </VStack>
      </Box>
    </Box>
  );
}

function ComingSoonCta({
  label,
  icon: Icon,
  variant = "prize",
}: {
  label: string;
  icon: typeof Swords;
  variant?: "prize" | "outline" | "attr";
}) {
  return (
    <VStack gap="1" align="center">
      <GhButton
        variant={variant}
        size="lg"
        leftIcon={<Icon size={18} />}
        disabled
        opacity={0.72}
        cursor="not-allowed"
      >
        {label}
      </GhButton>
      <Text
        fontSize="2xs"
        color="fg.subtle"
        textAlign="center"
        maxW="14rem"
        lineHeight="1.4"
      >
        Coming soon — Dexsta XFT integration
      </Text>
    </VStack>
  );
}

export default function BattlePage() {
  const a = DEMO_FIGHTERS[0]!;
  const b = DEMO_FIGHTERS[1]!;

  const edgeStatsA: Partial<Record<AttributeId, number>> = {
    power: a.stats.power,
    speed: a.stats.speed,
    attack: a.stats.attack,
    defense: a.stats.defense,
  };
  const edgeStatsB: Partial<Record<AttributeId, number>> = {
    power: b.stats.power,
    speed: b.stats.speed,
    attack: b.stats.attack,
    defense: b.stats.defense,
  };

  return (
    <VStack align="stretch" gap="0" pb="phi4">
      <ModeHeader
        mode="battle"
        icon={Crosshair}
        title="XFT battles · Tokens As Attributes"
        description="Fierce Dexsta XFT (NFT 2.0) fighters. Edges are bag tokens — Speed, Power, Flight, Defense, Attack — equip from Attributes, then duel."
        badge="Fight HUD"
        action={
          <ComingSoonCta label="Equip loadout" icon={Sparkles} variant="attr" />
        }
      />

      <GhSurface variant="glass" p="phi3" mb="phi4" borderColor="attr.solid">
        <Text fontSize="sm" color="fg.muted" lineHeight="1.55">
          <Text as="span" color="attr.fg" fontWeight="bold">
            How it works:
          </Text>{" "}
          Each fighter is a Dexsta XFT.{" "}
          <strong>Tokens As Attributes</strong> in the bag set the card edges
          (SPD · PWR · FLT · DEF · ATK). Full loadout & on-chain duel settle —
          Dexsta integration coming soon.
        </Text>
      </GhSurface>

      <Grid
        templateColumns={{ base: "1fr", lg: "1fr auto 1fr" }}
        gap="phi3"
        alignItems="stretch"
        mb="phi4"
      >
        <NftFighterCard fighter={a} side="left" />

        <VStack
          justify="center"
          gap="phi3"
          py={{ base: "phi2", lg: 0 }}
          minW={{ lg: "11rem" }}
        >
          <Box
            w="16"
            h="16"
            borderRadius="full"
            bg="prize.muted"
            borderWidth="2px"
            borderColor="prize.solid"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="prize.fg"
            boxShadow="glow-prize"
            className="gh-crown-glow"
          >
            <Swords size={28} />
          </Box>
          <Text
            fontFamily="heading"
            fontSize="sm"
            fontWeight="extrabold"
            className="gh-text-prize"
            letterSpacing="0.2em"
          >
            VS
          </Text>
          <ComingSoonCta label="Start duel" icon={Swords} variant="prize" />
        </VStack>

        <NftFighterCard fighter={b} side="right" />
      </Grid>

      <SectionDivider label="Stat edge · Tokens As Attributes" tone="brand" my="0" />

      <Box mt="phi3" mb="phi4">
        <StatCompare
          left={edgeStatsA}
          right={edgeStatsB}
          leftName={a.name}
          rightName={b.name}
        />
      </Box>

      {/* Flight callout row */}
      <SimpleEdgeRow a={a} b={b} />

      <GhSurface variant="elevated" p="phi4" mb="phi4">
        <Text
          fontFamily="heading"
          fontSize="xs"
          fontWeight="bold"
          letterSpacing="0.14em"
          textTransform="uppercase"
          color="fg.subtle"
          mb="phi3"
          textAlign="center"
        >
          Overlay radar · core bag
        </Text>
        <StatRadar
          stats={edgeStatsA}
          compare={edgeStatsB}
          color="#a3ff3d"
          compareColor="#f43fa8"
          size={200}
        />
        <HStack justify="center" gap="phi4" mt="phi2">
          <HStack gap="1.5">
            <Box w="2" h="2" borderRadius="full" bg="#a3ff3d" />
            <Text fontSize="2xs" color="fg.muted">
              {a.name}
            </Text>
          </HStack>
          <HStack gap="1.5">
            <Box w="2" h="2" borderRadius="full" bg="#f43fa8" />
            <Text fontSize="2xs" color="fg.muted">
              {b.name}
            </Text>
          </HStack>
        </HStack>
      </GhSurface>

      <SectionDivider label="Attribute legend" tone="attr" my="0" />

      <Grid
        templateColumns={{ base: "1fr 1fr", md: "repeat(5, 1fr)" }}
        gap="phi2"
        mt="phi3"
        mb="phi4"
      >
        {BATTLE_EDGE_ORDER.map((id) => {
          const m = BATTLE_EDGE_META[id];
          return (
            <GhSurface key={id} variant="muted" py="phi2" px="phi2">
              <Text
                fontSize="xs"
                fontWeight="extrabold"
                fontFamily="heading"
                color={m.color}
              >
                {m.short} · {m.name}
              </Text>
              <Text fontSize="2xs" color="fg.subtle" mt="0.5">
                Token {m.token} · bag power on XFT
              </Text>
            </GhSurface>
          );
        })}
      </Grid>

      <Flex gap="phi4" flexWrap="wrap" justify="center" mt="phi2">
        <ComingSoonCta label="Start duel" icon={Swords} variant="prize" />
        <ComingSoonCta label="Change loadout" icon={Sparkles} variant="outline" />
      </Flex>
    </VStack>
  );
}

function SimpleEdgeRow({
  a,
  b,
}: {
  a: BattleFighter;
  b: BattleFighter;
}) {
  return (
    <GhSurface variant="glass" p="phi3" mb="phi4">
      <Text
        fontFamily="heading"
        fontSize="2xs"
        fontWeight="bold"
        letterSpacing="0.12em"
        textTransform="uppercase"
        color="attr.fg"
        mb="phi2"
      >
        Flight edge (aerial)
      </Text>
      <Grid templateColumns="1fr auto 1fr" gap="phi3" alignItems="center">
        <Box>
          <Text fontSize="xs" color="fg.muted">
            {a.name}
          </Text>
          <Text
            fontFamily="heading"
            fontWeight="extrabold"
            color={BATTLE_EDGE_META.flight.color}
            fontSize="xl"
          >
            {a.stats.flight ?? 0}
          </Text>
        </Box>
        <Text fontSize="2xs" color="fg.subtle" fontWeight="bold">
          FLT
        </Text>
        <Box textAlign="right">
          <Text fontSize="xs" color="fg.muted">
            {b.name}
          </Text>
          <Text
            fontFamily="heading"
            fontWeight="extrabold"
            color={BATTLE_EDGE_META.flight.color}
            fontSize="xl"
          >
            {b.stats.flight ?? 0}
          </Text>
        </Box>
      </Grid>
    </GhSurface>
  );
}
