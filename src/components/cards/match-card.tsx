"use client";

import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import {
  Swords,
  Trophy,
  Gamepad2,
  Users,
  Joystick,
  ExternalLink,
  Monitor,
  Coins,
  Gem,
  UserPlus,
  ChartCandlestick,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import { GhBadge, GhButton, GhSurface } from "@/components/ui";
import { useSession } from "@/components/providers/session-context";
import { marketHref } from "@/lib/deep-links";

export type MatchKind =
  | "challenge"
  | "tournament"
  | "room"
  | "group_game"
  | "arcade";

export type Challenger = {
  username: string;
  avatarUrl?: string;
  record?: string;
};

/** Esports prediction market linked from a match */
export type MatchMarket = {
  id: string;
  /** Defaults to `/markets/{id}` */
  href?: string;
  category?: "esports";
  /** Short line e.g. "Moneyline · +110 / -130" */
  label?: string;
};

export type MatchCardProps = {
  kind: MatchKind;
  title: string;
  game: string;
  console?: string;
  entryFee?: string;
  prizePot?: string;
  stake?: string;
  status: "open" | "live" | "settled" | "disputed";
  players?: string;
  meta?: string;
  hostEarn?: string;
  /** Primary host / board owner (legacy single identity) */
  username?: string;
  avatarUrl?: string;
  record?: string;
  recordLabel?: string;
  /** VS slots — empty seats show Open slot placeholders */
  challengers?: readonly Challenger[];
  /** How many seats to show (default 2 for challenge, up to 4) */
  seats?: number;
  /**
   * When true (or when `market` is set), show floating betable badge
   * linking to the esports market.
   */
  betable?: boolean;
  market?: MatchMarket;
  /**
   * Mock / visitor feed cards — primary CTA becomes Connect wallet
   * (triggers Internet Identity) instead of Accept / Join.
   */
  mock?: boolean;
  /** Override default kind CTA label (e.g. Open match) */
  ctaLabel?: string;
  /** Primary CTA click — when set, button is wired (Accept 1v1, etc.) */
  onCtaClick?: () => void;
  /** Mute / disable primary CTA (e.g. already seated) */
  ctaDisabled?: boolean;
  /** Optional href when CTA should navigate instead of custom handler */
  href?: string;
};

const KIND_META = {
  challenge: {
    Icon: Swords,
    label: "Heads-up",
    short: "1v1",
    bar: "linear-gradient(90deg, #a3ff3d, #7dd41f)",
    border: "border.brand",
    iconBg: "brand.muted",
    iconColor: "brand.fg",
    glow: "glow",
    cta: "Accept 1v1",
    ctaVariant: "primary" as const,
    feeLabel: "Stake",
    potLabel: "Winner takes",
    seat0: "Challenger A",
    seatN: "Challenger B",
  },
  tournament: {
    Icon: Trophy,
    label: "Tournament",
    short: "Bracket",
    bar: "linear-gradient(90deg, #f43fa8, #db2777)",
    border: "prize.solid",
    iconBg: "prize.muted",
    iconColor: "prize.fg",
    glow: "glow-prize",
    cta: "Join bracket",
    ctaVariant: "prize" as const,
    feeLabel: "Entry fee",
    potLabel: "Prize pool",
    seat0: "Host",
    seatN: "Next seed",
  },
  room: {
    Icon: Gamepad2,
    label: "Room",
    short: "Lobby",
    bar: "linear-gradient(90deg, #22d3ee, #06b6d4)",
    border: "live.solid",
    iconBg: "live.muted",
    iconColor: "live.fg",
    glow: "glow",
    cta: "Open group",
    ctaVariant: "primary" as const,
    feeLabel: "Buy-in",
    potLabel: "Room pot",
    seat0: "Host",
    seatN: "Seat",
  },
  /**
   * Multi-seat free-for-all inside a community group (poker table, COD FFA, etc.).
   * Not an elimination bracket — one winner when the table settles.
   */
  group_game: {
    Icon: Users,
    label: "Group game",
    short: "Free-for-all",
    bar: "linear-gradient(90deg, #fbbf24, #f59e0b 45%, #22d3ee)",
    border: "live.solid",
    iconBg: "live.muted",
    iconColor: "live.fg",
    glow: "glow",
    cta: "Join table",
    ctaVariant: "live" as const,
    feeLabel: "Buy-in",
    potLabel: "Table pot",
    seat0: "Host seat",
    seatN: "Seat",
  },
  arcade: {
    Icon: Joystick,
    label: "Arcade",
    short: "High score",
    bar: "linear-gradient(90deg, #8b5cf6, #a3ff3d)",
    border: "attr.solid",
    iconBg: "attr.muted",
    iconColor: "attr.fg",
    glow: "glow-attr",
    cta: "Challenge score",
    ctaVariant: "attr" as const,
    feeLabel: "Try fee",
    potLabel: "Fail bank",
    seat0: "Crown",
    seatN: "Challenger",
  },
} as const;

const STATUS_TONE = {
  open: "brand" as const,
  live: "live" as const,
  settled: "success" as const,
  disputed: "danger" as const,
};

function initials(name: string) {
  return (
    name
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/**
 * Challenge / tournament card — kind-differentiated chrome + optional betable market.
 */
export function MatchCard({
  kind,
  title,
  game,
  console: consoleName = "PC",
  entryFee,
  prizePot,
  stake,
  status,
  players,
  meta,
  hostEarn,
  username,
  avatarUrl,
  record,
  recordLabel,
  challengers,
  seats,
  betable,
  market,
  mock = false,
  ctaLabel: ctaLabelProp,
  onCtaClick,
  ctaDisabled = false,
  href,
}: MatchCardProps) {
  const { login } = useSession();
  const km = KIND_META[kind];
  const Icon = km.Icon;
  const ctaLabel = mock
    ? "Connect wallet"
    : ctaLabelProp || km.cta;
  const ctaVariant = mock ? ("primary" as const) : km.ctaVariant;
  const fee = entryFee ?? stake ?? "—";
  const pot =
    prizePot ??
    (kind === "challenge" && stake
      ? `~${stake.replace(/entry|ICP/gi, "").trim() || stake}×2`
      : fee);

  const showBetable = Boolean(betable || market);
  const marketUrl =
    market?.href ?? (market?.id ? marketHref(market.id) : "/markets");
  const marketLabel = market?.label ?? "Esports market";

  const seatCount =
    seats ??
    (kind === "room" || kind === "group_game"
      ? 4
      : kind === "tournament"
        ? 2
        : 2);
  const filled: (Challenger | null)[] = (() => {
    // Explicit seat list (including all-open via [])
    if (challengers !== undefined) {
      const arr: (Challenger | null)[] = [...challengers];
      while (arr.length < seatCount) arr.push(null);
      return arr.slice(0, seatCount);
    }
    // Group FFA: never invent a mock host — open slots only until join data is passed
    if (kind === "group_game") {
      return Array.from({ length: seatCount }, () => null);
    }
    // Other kinds: only seed seat 0 when a real username is provided
    const name = (username || "").trim();
    if (!name || name.toLowerCase() === "gamerholic") {
      return Array.from({ length: seatCount }, () => null);
    }
    const host: Challenger = {
      username: name,
      avatarUrl,
      record: record || undefined,
    };
    const arr: (Challenger | null)[] = [host];
    while (arr.length < seatCount) arr.push(null);
    return arr;
  })();

  const seatLabel = (i: number) => {
    if (kind === "challenge") {
      return i === 0 ? km.seat0 : km.seatN;
    }
    if (kind === "room" || kind === "group_game") {
      return `Seat ${i + 1}`;
    }
    return i === 0 ? km.seat0 : km.seatN;
  };

  const recordFor = (i: number) => {
    const seat = filled[i];
    // Never show fake W–L; only real record on a filled seat
    if (seat?.record) return seat.record;
    if (!seat) return kind === "group_game" ? "Open slot" : "Open";
    if (recordLabel) return recordLabel;
    if (kind === "tournament") return "Host";
    if (kind === "challenge") return "Seated";
    if (kind === "arcade") return "Crown";
    if (kind === "group_game") return "Seated";
    return "Seated";
  };

  const showVs = kind === "challenge" || kind === "arcade";

  return (
    <Box position="relative" h="100%">
      {/* Floating betable market badge */}
      {showBetable ? (
        <Box
          position="absolute"
          top="-0.55rem"
          right="-0.45rem"
          zIndex={3}
          className="gh-betable-float"
        >
          <Link
            href={marketUrl}
            title={`Open betable market — ${marketLabel}`}
            style={{ textDecoration: "none" }}
          >
            <Flex
              align="center"
              gap="1.5"
              pl="2"
              pr="2.5"
              py="1.5"
              borderRadius="full"
              borderWidth="1px"
              borderColor="prize.solid"
              bg="bg.glass-strong"
              backdropFilter="blur(12px)"
              boxShadow="0 0 0 1px rgba(244,63,168,0.35), 0 8px 24px -6px rgba(244,63,168,0.55)"
              color="prize.fg"
              transition="transform 0.15s, box-shadow 0.15s"
              _hover={{
                transform: "translateY(-2px) scale(1.03)",
                boxShadow:
                  "0 0 0 1px rgba(244,63,168,0.55), 0 12px 28px -4px rgba(244,63,168,0.65)",
              }}
            >
              <Box
                w="6"
                h="6"
                borderRadius="full"
                bg="prize.muted"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <ChartCandlestick size={13} strokeWidth={2.5} />
              </Box>
              <Box lineHeight="1.1" display={{ base: "none", sm: "block" }}>
                <Text
                  fontFamily="heading"
                  fontSize="2xs"
                  fontWeight="extrabold"
                  letterSpacing="0.1em"
                  textTransform="uppercase"
                >
                  Betable
                </Text>
                <Text fontSize="2xs" color="fg.muted" maxW="7rem" lineClamp={1}>
                  {marketLabel}
                </Text>
              </Box>
              <ArrowUpRight size={12} strokeWidth={2.5} />
            </Flex>
          </Link>
        </Box>
      ) : null}

      <GhSurface
        variant="glass"
        p="0"
        overflow="hidden"
        h="100%"
        display="flex"
        flexDirection="column"
        borderWidth="1px"
        borderColor={km.border}
        transition="transform 0.15s, box-shadow 0.15s"
        _hover={{ boxShadow: km.glow, transform: "translateY(-2px)" }}
      >
        <Box h="1.5" bg={km.bar} flexShrink={0} />

        <Flex direction="column" flex="1" p="phi3" gap="0" minH="0">
          {/* Kind identity + title + status — compact single block */}
          <HStack justify="space-between" mb="phi2" gap="2" align="center">
            <HStack gap="2" minW="0" flex="1" align="center">
              <Box
                w="8"
                h="8"
                borderRadius="lg"
                flexShrink={0}
                bg={km.iconBg}
                color={km.iconColor}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderWidth="1px"
                borderColor={km.border}
              >
                <Icon size={14} />
              </Box>
              <Box minW="0" flex="1">
                <HStack gap="1.5" minW="0" align="center">
                  <Text
                    fontFamily="heading"
                    fontWeight="extrabold"
                    fontSize="sm"
                    lineClamp={1}
                    lineHeight="1.2"
                    minW="0"
                  >
                    {title}
                  </Text>
                  <GhBadge
                    tone={STATUS_TONE[status]}
                    pulse={status === "live"}
                    flexShrink={0}
                  >
                    {status}
                  </GhBadge>
                </HStack>
                <Text
                  fontSize="2xs"
                  color="fg.subtle"
                  fontFamily="heading"
                  fontWeight="bold"
                  letterSpacing="0.06em"
                  textTransform="uppercase"
                  lineClamp={1}
                  mt="0.5"
                >
                  {km.label}
                  <Text as="span" color="fg.muted" fontWeight="semibold" mx="1">
                    ·
                  </Text>
                  {km.short}
                </Text>
              </Box>
            </HStack>
          </HStack>

          {/* Kind-specific frame note */}
          {kind === "tournament" ? (
            <Text
              fontSize="2xs"
              color="prize.fg"
              fontFamily="heading"
              fontWeight="bold"
              letterSpacing="0.12em"
              textTransform="uppercase"
              mb="phi2"
            >
              Bracket event · host fee on settle
            </Text>
          ) : kind === "group_game" ? (
            <Text
              fontSize="2xs"
              color="live.fg"
              fontFamily="heading"
              fontWeight="bold"
              letterSpacing="0.08em"
              textTransform="uppercase"
              mb="phi2"
            >
              Free-for-all · one winner · not a bracket
            </Text>
          ) : (
            <Box mb="phi1" />
          )}

          {/* Challenger / field slots */}
          <Flex gap="2" mb="phi3" align="stretch" flexWrap="wrap">
            {filled.map((c, i) => (
              <Fragment key={`seat-${i}`}>
                {showVs && seatCount === 2 && i === 1 ? (
                  <Flex align="center" justify="center" flexShrink={0} px="0.5">
                    <Text
                      fontFamily="heading"
                      fontSize="2xs"
                      fontWeight="extrabold"
                      letterSpacing="0.16em"
                      color="brand.fg"
                    >
                      VS
                    </Text>
                  </Flex>
                ) : null}
                <ChallengerSlot
                  challenger={c}
                  seatLabel={seatLabel(i)}
                  recordLabel={recordFor(i)}
                  accent={
                    kind === "tournament"
                      ? "prize"
                      : kind === "challenge"
                        ? "brand"
                        : kind === "group_game"
                          ? "live"
                          : "default"
                  }
                />
              </Fragment>
            ))}
          </Flex>

          {/* Game economics */}
          <Box
            borderRadius="xl"
            borderWidth="1px"
            borderColor={
              kind === "tournament"
                ? "prize.solid"
                : kind === "challenge"
                  ? "border.brand"
                  : kind === "group_game"
                    ? "live.solid"
                    : "border.default"
            }
            bg="blackAlpha.400"
            p="phi3"
            mb="phi3"
          >
            <HStack justify="space-between" gap="2" mb="phi2" align="flex-start">
              <Box minW="0" flex="1">
                <Text
                  fontSize="2xs"
                  color="fg.subtle"
                  fontFamily="heading"
                  letterSpacing="0.12em"
                  textTransform="uppercase"
                  mb="0.5"
                >
                  Game
                </Text>
                <Text
                  fontFamily="heading"
                  fontWeight="extrabold"
                  fontSize="lg"
                  lineClamp={1}
                  lineHeight="1.15"
                >
                  {game}
                </Text>
              </Box>
              <HStack
                gap="1"
                px="2.5"
                py="1.5"
                borderRadius="lg"
                bg="live.muted"
                borderWidth="1px"
                borderColor="live.solid"
                flexShrink={0}
              >
                <Monitor size={14} color="var(--gh-colors-live-fg)" />
                <Text
                  fontSize="sm"
                  fontWeight="extrabold"
                  fontFamily="heading"
                  color="live.fg"
                >
                  {consoleName}
                </Text>
              </HStack>
            </HStack>

            <Flex gap="2">
              <StatBlock
                icon={<Coins size={15} />}
                label={km.feeLabel}
                value={fee}
                tone={kind === "tournament" ? "prize" : "brand"}
              />
              <StatBlock
                icon={<Gem size={15} />}
                label={km.potLabel}
                value={pot}
                tone="prize"
              />
            </Flex>

            {(players || meta || showBetable) && (
              <HStack gap="2" flexWrap="wrap" mt="phi2">
                {players ? (
                  <GhBadge tone="muted">
                    <Users size={11} /> {players}
                  </GhBadge>
                ) : null}
                {meta ? <GhBadge tone="default">{meta}</GhBadge> : null}
                {showBetable ? (
                  <GhBadge tone="prize">
                    <ChartCandlestick size={11} /> Market
                  </GhBadge>
                ) : null}
              </HStack>
            )}
          </Box>

          {hostEarn && kind === "tournament" ? (
            <Box
              w="100%"
              px="3"
              py="2"
              borderRadius="xl"
              bg="prize.muted"
              borderWidth="1px"
              borderColor="prize.solid"
              mb="phi3"
            >
              <Text fontSize="xs" fontWeight="bold" color="prize.fg">
                Host earns {hostEarn}
              </Text>
            </Box>
          ) : hostEarn ? (
            <Box
              w="100%"
              px="3"
              py="2"
              borderRadius="xl"
              bg="blackAlpha.400"
              borderWidth="1px"
              borderColor="border.default"
              mb="phi3"
            >
              <Text fontSize="xs" fontWeight="bold" color="fg.muted">
                {hostEarn}
              </Text>
            </Box>
          ) : null}

          <Flex gap="phi2" mt="auto" flexShrink={0} direction="column">
            {href && !mock && !onCtaClick && !ctaDisabled ? (
              <Link href={href} style={{ textDecoration: "none", width: "100%" }}>
                <GhButton
                  size="sm"
                  variant={ctaVariant}
                  w="100%"
                  leftIcon={<ExternalLink size={14} strokeWidth={2.5} />}
                >
                  {ctaLabel}
                </GhButton>
              </Link>
            ) : (
              <GhButton
                size="sm"
                variant={ctaDisabled ? "soft" : ctaVariant}
                w="100%"
                disabled={ctaDisabled || (!mock && !onCtaClick && !href)}
                opacity={ctaDisabled ? 0.55 : 1}
                leftIcon={
                  mock ? (
                    <Wallet size={14} strokeWidth={2.5} />
                  ) : (
                    <ExternalLink size={14} strokeWidth={2.5} />
                  )
                }
                onClick={
                  ctaDisabled
                    ? undefined
                    : mock
                      ? () => {
                          void login();
                        }
                      : onCtaClick
                }
              >
                {ctaLabel}
              </GhButton>
            )}
            {showBetable ? (
              <Link href={marketUrl} style={{ textDecoration: "none", width: "100%" }}>
                <GhButton
                  size="sm"
                  variant="soft"
                  w="100%"
                  leftIcon={<ChartCandlestick size={14} strokeWidth={2.5} />}
                  rightIcon={<ArrowUpRight size={14} />}
                >
                  Open betable market
                </GhButton>
              </Link>
            ) : null}
          </Flex>
        </Flex>
      </GhSurface>
    </Box>
  );
}

function ChallengerSlot({
  challenger,
  seatLabel,
  recordLabel,
  accent = "default",
}: {
  challenger: Challenger | null;
  seatLabel: string;
  recordLabel: string;
  accent?: "brand" | "prize" | "live" | "default";
}) {
  const filledBorder =
    accent === "prize"
      ? "prize.solid"
      : accent === "live"
        ? "live.solid"
        : accent === "brand"
          ? "border.brand"
          : "border.brand";
  const filledBg =
    accent === "prize"
      ? "prize.muted"
      : accent === "live"
        ? "live.muted"
        : accent === "brand"
          ? "brand.muted"
          : "brand.muted";
  const filledColor =
    accent === "prize"
      ? "prize.fg"
      : accent === "live"
        ? "live.fg"
      : accent === "brand"
        ? "brand.fg"
        : "brand.fg";

  if (!challenger) {
    return (
      <Box
        flex="1"
        minW="0"
        p="phi2"
        borderRadius="xl"
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="border.strong"
        bg="blackAlpha.300"
        textAlign="center"
      >
        <Box
          mx="auto"
          mb="phi1"
          w="10"
          h="10"
          borderRadius="full"
          borderWidth="2px"
          borderStyle="dashed"
          borderColor="fg.subtle"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="fg.subtle"
        >
          <UserPlus size={16} />
        </Box>
        <Text
          fontFamily="heading"
          fontSize="2xs"
          fontWeight="bold"
          color="fg.subtle"
          letterSpacing="0.08em"
          textTransform="uppercase"
        >
          Open slot
        </Text>
        <Text fontSize="2xs" color="fg.subtle" opacity={0.8}>
          {seatLabel}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      flex="1"
      minW="0"
      p="phi2"
      borderRadius="xl"
      borderWidth="1px"
      borderColor={filledBorder}
      bg={filledBg}
      textAlign="center"
    >
      <Box
        mx="auto"
        mb="phi1"
        w="10"
        h="10"
        borderRadius="full"
        overflow="hidden"
        borderWidth="2px"
        borderColor={filledBorder}
        bg="bg.elevated"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {challenger.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={challenger.avatarUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Text
            fontFamily="heading"
            fontSize="xs"
            fontWeight="extrabold"
            color={filledColor}
          >
            {initials(challenger.username)}
          </Text>
        )}
      </Box>
      <Text fontFamily="heading" fontWeight="bold" fontSize="xs" lineClamp={1}>
        {challenger.username}
      </Text>
      <Text fontSize="2xs" color="fg.subtle">
        {recordLabel}{" "}
        <Text as="span" color={filledColor} fontWeight="bold">
          {challenger.record ?? "0–0"}
        </Text>
      </Text>
    </Box>
  );
}

function StatBlock({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "brand" | "prize";
}) {
  return (
    <Box
      flex="1"
      p="2.5"
      borderRadius="lg"
      borderWidth="1px"
      borderColor={tone === "prize" ? "prize.solid" : "border.brand"}
      bg={tone === "prize" ? "prize.muted" : "brand.muted"}
    >
      <HStack gap="1" mb="1" color={tone === "prize" ? "prize.fg" : "brand.fg"}>
        {icon}
        <Text
          fontSize="2xs"
          fontFamily="heading"
          fontWeight="bold"
          letterSpacing="0.1em"
          textTransform="uppercase"
        >
          {label}
        </Text>
      </HStack>
      <Text
        fontFamily="heading"
        fontWeight="extrabold"
        fontSize="md"
        color={tone === "prize" ? "prize.fg" : "brand.fg"}
        lineClamp={1}
      >
        {value}
      </Text>
    </Box>
  );
}

export function MatchCardSkeleton() {
  return (
    <GhSurface variant="muted" h="100%" minH="16rem" opacity={0.55} p="phi3">
      <Box h="4" w="50%" bg="whiteAlpha.100" borderRadius="md" mb="phi2" />
      <Box h="3" w="70%" bg="whiteAlpha.50" borderRadius="md" mb="phi4" />
      <Box h="9" w="100%" bg="whiteAlpha.50" borderRadius="lg" mt="auto" />
    </GhSurface>
  );
}
