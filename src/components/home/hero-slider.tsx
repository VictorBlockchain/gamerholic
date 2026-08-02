"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Box, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Joystick,
  Swords,
  Trophy,
} from "lucide-react";
import { GhBadge, GhButton } from "@/components/ui";
import { ART } from "@/lib/art";

const SLIDES = [
  {
    id: "host",
    kicker: "Different by design",
    title: (
      <>
        Esports where{" "}
        <Text as="span" className="gh-text-prize">
          hosts get paid
        </Text>
        .
      </>
    ),
    /** Short mobile blurb */
    bodyMobile:
      "Operators earn host fees & room takes when events settle on ICP.",
    body: "Tournaments and game rooms aren’t just prize pools for players — operators earn host fees and room takes when events settle on ICP. Run the arena. Take your cut.",
    badges: ["Host fee bps", "Room take", "Non-custodial"],
    cta: { label: "Start hosting", href: "/host", icon: Trophy },
    secondary: { label: "How hosting works", href: "#why" },
    image: ART.teamWin,
    imageLabel: "Squads · tournaments · payouts",
  },
  {
    id: "arcade",
    kicker: "High Score Arcade",
    title: (
      <>
        Skill is content.{" "}
        <Text as="span" className="gh-text-attr">
          Fails pay you
        </Text>
        .
      </>
    ),
    bodyMobile: "Post a high score. Challengers pay to try — fails bank to you.",
    body: "Post a high score and a try fee. Challengers pay to attempt. Every miss banks ICP to you. When they beat the crown — they take the throne. Difficulty is the product.",
    badges: ["Try fee", "Fail bank", "Defend the crown"],
    cta: { label: "Defend your crown", href: "/arcade", icon: Joystick },
    secondary: { label: "See boards", href: "/arcade" },
    image: ART.arcadeFriends,
    imageLabel: "Arcade · friends · competition",
  },
  {
    id: "battle",
    kicker: "Dexsta × Gamerholic",
    title: (
      <>
        XFTs that{" "}
        <Text as="span" className="gh-text-brand">
          fight
        </Text>
        .
      </>
    ),
    bodyMobile: "Equip Attribute tokens on Dexsta XFTs — battlers with real stats.",
    body: "Equip Power, Speed, Attack, Defense and more Attribute tokens onto Dexsta XFTs. Collectibles become Pokémon-style battlers with real on-chain stats — not just JPEGs.",
    badges: ["Attribute tokens", "Loadouts", "VS duels"],
    cta: { label: "Enter battle", href: "/battle", icon: Crosshair },
    secondary: { label: "Attributes", href: "/attributes" },
    image: ART.battle,
    imageLabel: "Attribute fighters · loadouts",
  },
  {
    id: "play",
    kicker: "Heads-up · ICP",
    title: (
      <>
        Money matches.{" "}
        <Text as="span" className="gh-text-brand">
          Tonight
        </Text>
        .
      </>
    ),
    bodyMobile: "1v1 escrow: deposit, play, report, claim. Wallet is your ID.",
    body: "1v1 escrow challenges: deposit, play, report, claim. Built for a stake tonight — not next season’s whitepaper. Wallet is your gamer ID.",
    badges: ["Escrow", "1v1", "ICP native"],
    cta: { label: "Find a match", href: "/challenges", icon: Swords },
    secondary: { label: "Connect wallet", href: "/wallet" },
    image: ART.headsUp,
    imageLabel: "Heads-up · stakes · friends",
  },
] as const;

const AUTO_MS = 7500;

/**
 * Product carousel — compact native stack on mobile, wide desktop split.
 */
export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((i: number) => {
    setIndex(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTO_MS);
    return () => window.clearInterval(t);
  }, [paused, index]);

  const slide = SLIDES[index];
  const CtaIcon = slide.cta.icon;
  const ctaVariant =
    slide.id === "host" ? "prize" : slide.id === "arcade" ? "attr" : "primary";

  return (
    <Box
      position="relative"
      borderRadius={{ base: "2xl", md: "3xl" }}
      overflow="hidden"
      borderWidth="1px"
      borderColor="border.default"
      bg="bg.glass"
      backdropFilter="blur(20px)"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="gh-game-panel"
      aria-roledescription="carousel"
      aria-label="Product highlights"
    >
      <Box className="gh-brand-bar" h="1" />
      <Box
        position="absolute"
        inset="0"
        opacity={0.5}
        backgroundImage="
          radial-gradient(ellipse 70% 60% at 0% 0%, rgba(163,255,61,0.12), transparent 50%),
          radial-gradient(ellipse 50% 50% at 100% 100%, rgba(244,63,168,0.1), transparent 45%)
        "
        pointerEvents="none"
      />

      {/* ── Mobile: media-first card (native app hero) ── */}
      <Box display={{ base: "block", lg: "none" }}>
        {/* Compact art strip */}
        <Box
          key={slide.id + "-m-art"}
          position="relative"
          h="9.5rem"
          mx="phi2"
          mt="phi2"
          borderRadius="xl"
          overflow="hidden"
          borderWidth="1px"
          borderColor="border.default"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.image}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <Box
            position="absolute"
            inset="0"
            bg="linear-gradient(180deg, transparent 35%, rgba(7,9,13,0.9) 100%)"
          />
          <HStack
            position="absolute"
            bottom="2"
            left="2"
            right="2"
            justify="space-between"
            align="flex-end"
          >
            <Box>
              <GhBadge tone="live" pulse mb="1">
                ICP · live
              </GhBadge>
              <Text
                fontFamily="heading"
                fontWeight="bold"
                fontSize="2xs"
                letterSpacing="0.04em"
                lineClamp={1}
              >
                {slide.imageLabel}
              </Text>
            </Box>
            <Text fontFamily="mono" fontSize="2xs" color="fg.subtle">
              {String(index + 1).padStart(2, "0")}/{String(SLIDES.length).padStart(2, "0")}
            </Text>
          </HStack>
        </Box>

        {/* Tight copy stack */}
        <VStack
          key={slide.id + "-m-copy"}
          align="stretch"
          gap="phi2"
          px="phi3"
          pt="phi3"
          pb="phi3"
        >
          <GhBadge tone="prize" pulse alignSelf="flex-start">
            {slide.kicker}
          </GhBadge>

          <Box
            as="h1"
            fontFamily="heading"
            fontSize="xl"
            fontWeight="extrabold"
            letterSpacing="0.02em"
            lineHeight="1.15"
          >
            {slide.title}
          </Box>

          <Text fontSize="sm" color="fg.muted" lineHeight="1.45">
            {slide.bodyMobile}
          </Text>

          <Link href={slide.cta.href} style={{ width: "100%" }}>
            <GhButton
              variant={ctaVariant}
              size="md"
              w="100%"
              leftIcon={<CtaIcon size={16} />}
            >
              {slide.cta.label}
            </GhButton>
          </Link>
          <Link href={slide.secondary.href} style={{ width: "100%" }}>
            <GhButton
              variant="outline"
              size="sm"
              w="100%"
              rightIcon={<ArrowRight size={14} />}
            >
              {slide.secondary.label}
            </GhButton>
          </Link>

          {/* Compact pager */}
          <HStack justify="space-between" pt="1">
            <HStack gap="1.5" role="tablist" aria-label="Slides">
              {SLIDES.map((s, i) => (
                <Box
                  key={s.id}
                  as="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => go(i)}
                  h="1.5"
                  w={i === index ? "6" : "1.5"}
                  borderRadius="full"
                  bg={i === index ? "brand.solid" : "border.strong"}
                  transition="all 0.2s"
                  cursor="pointer"
                />
              ))}
            </HStack>
            <HStack gap="1">
              <PagerBtn onClick={prev} label="Previous">
                <ChevronLeft size={15} />
              </PagerBtn>
              <PagerBtn onClick={next} label="Next">
                <ChevronRight size={15} />
              </PagerBtn>
            </HStack>
          </HStack>
        </VStack>
      </Box>

      {/* ── Desktop / large: side-by-side (unchanged spirit) ── */}
      <Flex
        display={{ base: "none", lg: "flex" }}
        direction="row"
        align="stretch"
        minH="28rem"
        position="relative"
      >
        <VStack
          key={slide.id + "-copy"}
          align="flex-start"
          gap="phi3"
          p="phi5"
          flex="1"
          minW="0"
          justify="center"
        >
          <HStack gap="2" flexWrap="wrap">
            <GhBadge tone="prize" pulse>
              {slide.kicker}
            </GhBadge>
            {slide.badges.map((b) => (
              <GhBadge key={b} tone="muted">
                {b}
              </GhBadge>
            ))}
          </HStack>

          <Box
            as="h1"
            fontFamily="heading"
            fontSize={{ lg: "3.25rem" }}
            fontWeight="extrabold"
            letterSpacing="0.02em"
            lineHeight="1.1"
          >
            {slide.title}
          </Box>

          <Text fontSize="md" color="fg.muted" lineHeight="1.65" maxW="32rem">
            {slide.body}
          </Text>

          <HStack gap="phi2" flexWrap="wrap" pt="phi1">
            <Link href={slide.cta.href}>
              <GhButton
                variant={ctaVariant}
                size="lg"
                leftIcon={<CtaIcon size={18} />}
              >
                {slide.cta.label}
              </GhButton>
            </Link>
            <Link href={slide.secondary.href}>
              <GhButton
                variant="outline"
                size="lg"
                rightIcon={<ArrowRight size={16} />}
              >
                {slide.secondary.label}
              </GhButton>
            </Link>
          </HStack>

          <HStack gap="phi3" pt="phi2" w="100%" flexWrap="wrap">
            <HStack gap="1.5" role="tablist" aria-label="Slides">
              {SLIDES.map((s, i) => (
                <Box
                  key={s.id}
                  as="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => go(i)}
                  h="1.5"
                  w={i === index ? "8" : "1.5"}
                  borderRadius="full"
                  bg={i === index ? "brand.solid" : "border.strong"}
                  transition="all 0.2s"
                  cursor="pointer"
                  _hover={{ bg: i === index ? "brand.solid" : "fg.subtle" }}
                />
              ))}
            </HStack>
            <HStack gap="1">
              <PagerBtn onClick={prev} label="Previous" size="md">
                <ChevronLeft size={16} />
              </PagerBtn>
              <PagerBtn onClick={next} label="Next" size="md">
                <ChevronRight size={16} />
              </PagerBtn>
            </HStack>
            <Text fontFamily="mono" fontSize="xs" color="fg.subtle">
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(SLIDES.length).padStart(2, "0")}
            </Text>
          </HStack>
        </VStack>

        <Box
          key={slide.id + "-art"}
          flex="0 0 42%"
          position="relative"
          m="phi4"
          ml={0}
          borderRadius="2xl"
          overflow="hidden"
          borderWidth="1px"
          borderColor="border.default"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.image}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              minHeight: "100%",
              position: "absolute",
              inset: 0,
            }}
          />
          <Box
            position="absolute"
            inset="0"
            bg="linear-gradient(180deg, transparent 40%, rgba(7,9,13,0.88) 100%)"
          />
          <Box
            className="gh-hud-corner gh-hud-tl"
            style={{ borderColor: "rgba(163,255,61,0.55)" }}
          />
          <Box className="gh-hud-corner gh-hud-br" />
          <Box position="absolute" bottom="0" left="0" right="0" p="phi3">
            <GhBadge tone="live" pulse mb="2">
              ICP · live
            </GhBadge>
            <Text
              fontFamily="heading"
              fontWeight="bold"
              fontSize="sm"
              letterSpacing="0.04em"
            >
              {slide.imageLabel}
            </Text>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}

function PagerBtn({
  onClick,
  label,
  children,
  size = "sm",
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  size?: "sm" | "md";
}) {
  const dim = size === "md" ? "9" : "8";
  return (
    <Box
      as="button"
      onClick={onClick}
      aria-label={label}
      w={dim}
      h={dim}
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border.default"
      bg="bg.surface"
      display="flex"
      alignItems="center"
      justifyContent="center"
      color="fg.muted"
      cursor="pointer"
      _hover={{ color: "fg.default", borderColor: "border.brand" }}
    >
      {children}
    </Box>
  );
}
