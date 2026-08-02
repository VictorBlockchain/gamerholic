"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  Flex,
  Grid,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  CalendarClock,
  ChartCandlestick,
  Check,
  Coins,
  ExternalLink,
  FileText,
  Gavel,
  Info,
  Lock,
  MessageCircle,
  Monitor,
  Play,
  Radio,
  Share2,
  Shield,
  Swords,
  Trophy,
  UserMinus,
  Users,
  Unlock,
} from "lucide-react";
import {
  GhAlert,
  GhAvatar,
  GhBadge,
  GhButton,
  GhEmptyState,
  GhField,
  GhInput,
  GhSurface,
  GhSwitch,
  GhTabs,
  GhSpinner,
  GhTextarea,
  ghToast,
} from "@/components/ui";
import { useChat } from "@/components/chat/chat-context";
import {
  entrantStreamMap,
  filledLabel,
  formatIcp,
  formatWhen,
  hostCutFrom,
  hostStatsFor,
  isGroupPotTournament,
  matchesByRound,
  minBetableStart,
  potFrom,
  prizePoolFrom,
  roundLabel,
  statusLabel,
  statusTone,
  totalRounds,
  tournamentKindLabel,
  type BracketMatch,
  type TournamentDetail,
  type TournamentEntrant,
  type TournamentStatus,
} from "@/lib/tournaments";
import {
  loadTournament,
  setTournamentBetable,
} from "@/lib/ic/tournament-service";
import { isCanisterConfigured } from "@/lib/ic/canisters";
import { challengeHref } from "@/lib/challenges";
import { useSession } from "@/components/providers/session-context";
import { ClaimPayoutPanel } from "@/components/tournaments/claim-payout-panel";
import { marketHref, tournamentShareUrl } from "@/lib/deep-links";

/**
 * Tournament detail — overview, entrants, bracket, host controls (incl. open betable).
 * Loads from canister (no mock catalog).
 */
export function TournamentDetailView({ tournamentId }: { tournamentId: string }) {
  const [t, setT] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { principal, profile } = useSession();
  const who = profile?.username || principal;

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (!isCanisterConfigured()) {
        setLoadError(
          "Canister not configured. Deploy gh_backend and set NEXT_PUBLIC_GH_BACKEND_CANISTER_ID.",
        );
        setT(null);
        return;
      }
      const data = await loadTournament(tournamentId);
      setT(data);
      if (!data) setLoadError("Tournament not found on canister.");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
      setT(null);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (loading) {
    return (
      <VStack py="phi6" gap="phi3">
        <GhSpinner />
        <Text fontSize="sm" color="fg.muted">
          Loading tournament from canister…
        </Text>
      </VStack>
    );
  }

  if (!t) {
    return (
      <VStack align="stretch" gap="phi4" pb="phi4">
        <GhEmptyState
          icon={Trophy}
          title={loadError ? "Load failed" : "Tournament not found"}
          description={
            loadError ?? "This bracket does not exist on the canister yet."
          }
          action={
            <HStack gap="2">
              <Link href="/tournaments">
                <GhButton variant="prize" leftIcon={<ArrowLeft size={16} />}>
                  Back to brackets
                </GhButton>
              </Link>
              <GhButton variant="outline" onClick={() => void reload()}>
                Retry
              </GhButton>
            </HStack>
          }
        />
      </VStack>
    );
  }

  const isHost = t.hostUsername === who || t.hostUsername === profile?.username;
  const pot = potFrom(t);
  const hostCut = hostCutFrom(t);
  const prize = prizePoolFrom(t);

  const patch = (partial: Partial<TournamentDetail>) => {
    setT((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  const openBetableOnChain = async (opts: {
    marketId?: string;
    closeDate?: Date;
    outcomes?: string[];
  }) => {
    try {
      const { isBetableConfigured } = await import("@/lib/ic/betable-service");
      const { openTournamentBetableMarket } = await import(
        "@/lib/ic/tournament-service"
      );

      // Prefer real betable market creation (esports external outcomes → escrow)
      if (isBetableConfigured() && opts.outcomes && opts.outcomes.length >= 2) {
        const close =
          opts.closeDate ??
          (t.scheduledAt
            ? new Date(t.scheduledAt)
            : new Date(Date.now() + 2 * 3600_000));
        const { marketId } = await openTournamentBetableMarket({
          tournamentId: t.id,
          hostWho: who,
          title: `${t.title} — Winner`,
          description: t.description || t.rules || undefined,
          game: t.game,
          console: t.console,
          outcomes: opts.outcomes,
          closeDate: close,
          liveStreamUrl: t.streamUrl,
        });
        ghToast({
          title: "Betable market created",
          description: `Market #${marketId} · 1% creator fee to host · escrow = tournament pot`,
          type: "success",
        });
        await reload();
        return;
      }

      // Fallback: link a pre-known market id (manual / env not set)
      const marketId = opts.marketId ?? `${t.id}-market`;
      const ok = await setTournamentBetable(t.id, who, true, marketId);
      if (!ok) throw new Error("setTournamentBetable returned false");
      ghToast({
        title: "Betable linked on-chain",
        description: isBetableConfigured()
          ? "Provide ≥2 outcome labels to create a live market"
          : `Linked ${marketId} (set NEXT_PUBLIC_BETABLE_MARKET_FACTORY_ID to create)`,
        type: "success",
      });
      await reload();
    } catch (e) {
      ghToast({
        title: "Open betable failed",
        description: e instanceof Error ? e.message : String(e),
        type: "error",
      });
    }
  };

  const share = () => {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : tournamentShareUrl(t.id);
    void navigator.clipboard?.writeText(url);
    ghToast({ title: "Link copied", description: url, type: "success" });
  };

  return (
    <VStack align="stretch" gap={{ base: "phi4", md: "phi5" }} pb="phi4">
      {/* ── Hero ── */}
      <Box
        position="relative"
        borderRadius="3xl"
        borderWidth="1px"
        borderColor="prize.solid"
        overflow="hidden"
        boxShadow="glow-prize"
      >
        <Box position="relative" h={{ base: "10rem", md: "13rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={t.coverUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.48) saturate(1.15)",
            }}
          />
          <Box
            position="absolute"
            inset="0"
            bg="linear-gradient(180deg, rgba(7,6,18,0.2) 0%, rgba(7,6,18,0.55) 40%, rgba(7,6,18,0.96) 100%)"
          />
          <HStack
            position="absolute"
            top="phi3"
            left="phi3"
            right="phi3"
            justify="space-between"
            flexWrap="wrap"
            gap="2"
          >
            <Link href="/tournaments">
              <GhButton size="sm" variant="soft" leftIcon={<ArrowLeft size={14} />}>
                Brackets
              </GhButton>
            </Link>
            <HStack gap="2" flexWrap="wrap">
              <GhButton
                size="sm"
                variant="outline"
                leftIcon={<Share2 size={14} />}
                onClick={share}
              >
                Share
              </GhButton>
              {t.betable && t.marketId ? (
                <Link href={marketHref(t.marketId)}>
                  <GhButton
                    size="sm"
                    variant="prize"
                    leftIcon={<ChartCandlestick size={14} />}
                  >
                    Betable market
                  </GhButton>
                </Link>
              ) : null}
              {t.registrationOpen && t.status === "open" ? (
                <GhButton
                  size="sm"
                  variant="primary"
                  leftIcon={<Trophy size={14} />}
                  onClick={() => {
                    if (t.entrants.some((e) => e.username === "you")) {
                      ghToast({ title: "Already registered", type: "info" });
                      return;
                    }
                    const entrant: TournamentEntrant = {
                      id: `e-${Date.now()}`,
                      username: "you",
                      seed: t.entrants.length + 1,
                      checkedIn: false,
                      paid: true,
                      record: "0–0",
                    };
                    patch({
                      entrants: [...t.entrants, entrant],
                      prizePotIcp: pot + t.entryFeeIcp,
                    });
                    ghToast({
                      title: "Registered",
                      description: `${formatIcp(t.entryFeeIcp)} escrowed`,
                      type: "success",
                    });
                  }}
                >
                  {isGroupPotTournament(t) ? "Take a seat" : "Join bracket"}
                </GhButton>
              ) : null}
            </HStack>
          </HStack>
        </Box>

        <Box px={{ base: "phi3", md: "phi5" }} pb="phi4" mt="-1.5rem" position="relative">
          <HStack gap="2" mb="phi2" flexWrap="wrap">
            <GhBadge tone={statusTone(t.status)} pulse={t.status === "live"}>
              {statusLabel(t.status)}
            </GhBadge>
            <GhBadge tone={isGroupPotTournament(t) ? "live" : "prize"}>
              {tournamentKindLabel(t)}
            </GhBadge>
            <GhBadge tone="muted">
              {t.format === "single_elim"
                ? "Single elim"
                : t.format === "double_elim"
                  ? "Double elim"
                  : "Round robin / FFA"}
            </GhBadge>
            <GhBadge tone="live">{t.console}</GhBadge>
            {t.teamEntry ? <GhBadge tone="brand">Team entry</GhBadge> : null}
            {t.betable ? (
              <GhBadge tone="prize">
                <ChartCandlestick size={10} /> Betable
              </GhBadge>
            ) : null}
            {isHost ? <GhBadge tone="attr">You host</GhBadge> : null}
          </HStack>
          <Heading
            as="h1"
            fontFamily="heading"
            fontSize={{ base: "xl", md: "3xl" }}
            fontWeight="extrabold"
            letterSpacing="0.03em"
            textTransform="uppercase"
            lineHeight="1.1"
          >
            {t.title}
          </Heading>
          <Text fontSize="sm" color="fg.muted" mt="phi2" maxW="40rem" lineHeight="1.55">
            {t.description}
          </Text>
          <HStack gap="phi3" mt="phi3" flexWrap="wrap" fontSize="xs" color="fg.subtle">
            <Text>
              Host{" "}
              <Text as="span" color="prize.fg" fontWeight="bold">
                {t.hostUsername}
              </Text>
            </Text>
            <Text>·</Text>
            <Text>{t.game}</Text>
            <Text>·</Text>
            <Text>Start {formatWhen(t.scheduledAt)}</Text>
          </HStack>
        </Box>
      </Box>

      {/* ── Economics HUD ── */}
      <SimpleGrid columns={{ base: 2, md: 5 }} gap="phi2">
        <HudTile label="Entry" value={formatIcp(t.entryFeeIcp)} tone="prize" />
        <HudTile label="Pot" value={formatIcp(pot)} hint="Paid entrants" tone="prize" />
        <HudTile
          label="Prize pool"
          value={formatIcp(prize)}
          hint={`After ${t.hostFeePct}% host`}
          tone="brand"
        />
        <HudTile
          label="Host cut"
          value={formatIcp(hostCut)}
          hint={`${t.hostFeePct}% of pot`}
          tone="attr"
        />
        <HudTile
          label="Lobby"
          value={filledLabel(t)}
          hint={t.registrationOpen ? "Open" : "Locked"}
          tone="live"
        />
      </SimpleGrid>

      {/* Claim payout (team split explained when teamEntry) */}
      {(t.status === "live" || t.status === "settled") && isHost ? (
        <ClaimPayoutPanel
          tournament={t}
          isHost={isHost}
          hostPrincipal={who}
          onClaimed={() => void reload()}
        />
      ) : null}

      {/* ── Tabs ── */}
      <GhTabs
        tone="prize"
        fitted
        size="sm"
        defaultValue="overview"
        items={[
          {
            value: "overview",
            label: "Overview",
            icon: <Trophy size={13} />,
            content: <OverviewPanel t={t} />,
          },
          {
            value: "players",
            label: `Players (${t.entrants.length})`,
            icon: <Users size={13} />,
            content: (
              <PlayersPanel
                t={t}
                isHost={isHost}
                onKick={(id) => {
                  patch({
                    entrants: t.entrants.filter((e) => e.id !== id),
                  });
                  ghToast({ title: "Player removed", type: "info" });
                }}
                onCheckIn={(id) => {
                  patch({
                    entrants: t.entrants.map((e) =>
                      e.id === id ? { ...e, checkedIn: true } : e,
                    ),
                  });
                }}
              />
            ),
          },
          {
            value: "bracket",
            label: isGroupPotTournament(t) ? "Table" : "Bracket",
            icon: <Swords size={13} />,
            content: (
              <BracketPanel
                t={t}
                isHost={isHost}
                onReportWinner={(matchId, winner) => {
                  patch({
                    matches: t.matches.map((m) => {
                      if (m.id !== matchId) return m;
                      return {
                        ...m,
                        winner,
                        score: "2–1",
                        status: "done" as const,
                      };
                    }),
                  });
                  ghToast({
                    title: isGroupPotTournament(t)
                      ? "Result reported"
                      : "Match reported",
                    description: isGroupPotTournament(t)
                      ? `${winner} takes the seat pot`
                      : `${winner} advances`,
                    type: "success",
                  });
                }}
              />
            ),
          },
          {
            value: "host",
            label: "Host",
            icon: <Shield size={13} />,
            content: (
              <HostControlsPanel
                t={t}
                isHost={isHost}
                onPatch={patch}
                onOpenBetable={openBetableOnChain}
                hostPrincipal={who}
              />
            ),
          },
        ]}
      />
    </VStack>
  );
}

function HudTile({
  label,
  value,
  hint,
  tone = "prize",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "prize" | "brand" | "live" | "attr";
}) {
  const border =
    tone === "brand"
      ? "border.brand"
      : tone === "live"
        ? "live.solid"
        : tone === "attr"
          ? "attr.solid"
          : "prize.solid";
  return (
    <GhSurface variant="glass" p="phi3" borderColor={border} minH="5.25rem">
      <Text
        fontFamily="heading"
        fontSize="2xs"
        fontWeight="bold"
        letterSpacing="0.12em"
        textTransform="uppercase"
        color="fg.subtle"
        mb="1"
      >
        {label}
      </Text>
      <Text
        fontFamily="heading"
        fontSize={{ base: "md", md: "xl" }}
        fontWeight="extrabold"
        lineHeight="1.1"
        className={tone === "prize" ? "gh-text-prize" : undefined}
      >
        {value}
      </Text>
      {hint ? (
        <Text fontSize="2xs" color="fg.muted" mt="1">
          {hint}
        </Text>
      ) : null}
    </GhSurface>
  );
}

function OverviewPanel({ t }: { t: TournamentDetail }) {
  const formatLabel =
    t.format === "single_elim"
      ? "Single elimination"
      : t.format === "double_elim"
        ? "Double elimination"
        : "Round robin";

  return (
    <VStack align="stretch" gap="phi4" pt="phi2">
      {/* Event details + Rules first; betable sits underneath */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="phi3" alignItems="stretch">
        <FeaturedPanel
          tone="brand"
          eyebrow="Bracket info"
          title="Event details"
          icon={<Info size={18} />}
          subtitle={`${t.game} · ${filledLabel(t)} lobby · host ${t.hostUsername}`}
        >
          <SimpleGrid columns={2} gap="phi2" mb="phi3">
            <BetStat label="Game" value={t.game} />
            <BetStat label="Console" value={t.console} />
            <BetStat label="Format" value={formatLabel} />
            <BetStat
              label="Entry type"
              value={t.teamEntry ? "Team" : "Solo"}
            />
          </SimpleGrid>
          <VStack align="stretch" gap="2">
            <DetailRow label="Scheduled" value={formatWhen(t.scheduledAt)} />
            <DetailRow label="Created" value={formatWhen(t.createdAt)} />
            <DetailRow
              label="Registration"
              value={t.registrationOpen ? "Open" : "Closed"}
            />
            <DetailRow label="Status" value={statusLabel(t.status)} />
            <DetailRow label="Host" value={t.hostUsername} />
            <DetailRow
              label="Entry / host fee"
              value={`${formatIcp(t.entryFeeIcp)} · ${t.hostFeePct}%`}
            />
          </VStack>
        </FeaturedPanel>

        <FeaturedPanel
          tone="live"
          eyebrow="Broadcast"
          title="Rules & host stream"
          icon={<Radio size={18} />}
          subtitle="House rules and the desk cast for this bracket"
          action={
            t.streamUrl ? (
              <a href={t.streamUrl} target="_blank" rel="noreferrer">
                <GhButton
                  size="sm"
                  variant="live"
                  leftIcon={<Radio size={14} />}
                  rightIcon={<ExternalLink size={14} />}
                >
                  Watch host
                </GhButton>
              </a>
            ) : undefined
          }
        >
          <Box
            p="phi3"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.default"
            bg="blackAlpha.500"
            mb="phi3"
          >
            <HStack gap="2" mb="phi2">
              <FileText size={14} color="var(--gh-colors-live-fg)" />
              <Text
                fontFamily="heading"
                fontSize="2xs"
                fontWeight="bold"
                letterSpacing="0.12em"
                textTransform="uppercase"
                color="fg.subtle"
              >
                Rules
              </Text>
            </HStack>
            <Text fontSize="sm" color="fg.default" lineHeight="1.6">
              {t.rules ?? t.description}
            </Text>
          </Box>

          <Box
            p="phi3"
            borderRadius="xl"
            borderWidth="1px"
            borderColor={t.streamUrl ? "live.solid" : "border.default"}
            bg="blackAlpha.500"
          >
            <HStack justify="space-between" gap="2" flexWrap="wrap" mb="phi2">
              <HStack gap="2">
                <Box
                  w="9"
                  h="9"
                  borderRadius="lg"
                  bg="live.muted"
                  color="live.fg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderWidth="1px"
                  borderColor="live.solid"
                >
                  <Monitor size={16} />
                </Box>
                <Box>
                  <Text
                    fontFamily="heading"
                    fontSize="2xs"
                    fontWeight="bold"
                    letterSpacing="0.1em"
                    textTransform="uppercase"
                    color="live.fg"
                  >
                    Host desk
                  </Text>
                  <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
                    {t.hostUsername}
                  </Text>
                </Box>
              </HStack>
              {t.streamUrl ? (
                <GhBadge tone="live" pulse>
                  Live link
                </GhBadge>
              ) : (
                <GhBadge tone="muted">No stream</GhBadge>
              )}
            </HStack>
            {t.streamUrl ? (
              <VStack align="stretch" gap="2">
                <Text
                  fontFamily="mono"
                  fontSize="2xs"
                  color="fg.subtle"
                  lineClamp={1}
                >
                  {t.streamUrl}
                </Text>
                <a href={t.streamUrl} target="_blank" rel="noreferrer">
                  <GhButton
                    size="sm"
                    variant="live"
                    w="100%"
                    leftIcon={<Radio size={14} />}
                    rightIcon={<ExternalLink size={14} />}
                  >
                    Open host stream
                  </GhButton>
                </a>
              </VStack>
            ) : (
              <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
                Host hasn’t linked a desk stream yet. Player streams show on the
                bracket when each competitor sets theirs.
              </Text>
            )}
          </Box>

          <SimpleGrid columns={2} gap="phi2" mt="phi3">
            <BetStat label="Console" value={t.console} />
            <BetStat
              label="Lobby"
              value={filledLabel(t)}
            />
          </SimpleGrid>
        </FeaturedPanel>
      </SimpleGrid>

      {/* Betable under details + rules */}
      <TournamentBetableSection t={t} />
    </VStack>
  );
}

/** Shared featured card chrome (matches betable panel polish) */
function FeaturedPanel({
  tone,
  eyebrow,
  title,
  subtitle,
  icon,
  action,
  children,
}: {
  tone: "brand" | "live" | "prize";
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const border =
    tone === "prize"
      ? "prize.solid"
      : tone === "live"
        ? "live.solid"
        : "border.brand";
  const glow =
    tone === "prize"
      ? "glow-prize"
      : tone === "live"
        ? "glow"
        : "glow";
  const iconBg =
    tone === "prize"
      ? "prize.muted"
      : tone === "live"
        ? "live.muted"
        : "brand.muted";
  const iconColor =
    tone === "prize"
      ? "prize.fg"
      : tone === "live"
        ? "live.fg"
        : "brand.fg";
  const eyebrowColor = iconColor;
  const gradient =
    tone === "prize"
      ? "linear-gradient(125deg, rgba(244,63,168,0.16) 0%, rgba(13,11,26,0.92) 48%, rgba(163,255,61,0.06) 100%)"
      : tone === "live"
        ? "linear-gradient(125deg, rgba(34,211,238,0.14) 0%, rgba(13,11,26,0.93) 50%, rgba(139,92,246,0.1) 100%)"
        : "linear-gradient(125deg, rgba(163,255,61,0.12) 0%, rgba(13,11,26,0.93) 48%, rgba(139,92,246,0.12) 100%)";

  return (
    <Box
      position="relative"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={border}
      overflow="hidden"
      boxShadow={glow}
      h="100%"
    >
      <Box position="absolute" inset="0" bg={gradient} />
      <Box position="relative" p={{ base: "phi4", md: "phi5" }} h="100%">
        <Flex
          justify="space-between"
          gap="phi3"
          flexWrap="wrap"
          align="flex-start"
          mb="phi4"
        >
          <Box minW="0" flex="1">
            <HStack gap="2" mb="phi2" flexWrap="wrap">
              <Box
                w="10"
                h="10"
                borderRadius="xl"
                bg={iconBg}
                color={iconColor}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderWidth="1px"
                borderColor={border}
                flexShrink={0}
              >
                {icon}
              </Box>
              <Box minW="0">
                <Text
                  fontFamily="heading"
                  fontSize="2xs"
                  fontWeight="bold"
                  letterSpacing="0.12em"
                  textTransform="uppercase"
                  color={eyebrowColor}
                >
                  {eyebrow}
                </Text>
                <Text
                  fontFamily="heading"
                  fontWeight="extrabold"
                  fontSize="lg"
                  lineClamp={1}
                >
                  {title}
                </Text>
              </Box>
            </HStack>
            {subtitle ? (
              <Text fontSize="sm" color="fg.muted" lineHeight="1.5">
                {subtitle}
              </Text>
            ) : null}
          </Box>
          {action}
        </Flex>
        {children}
      </Box>
    </Box>
  );
}

function TournamentBetableSection({ t }: { t: TournamentDetail }) {
  if (!t.betable || !t.marketId) {
    return (
      <FeaturedPanel
        tone="prize"
        eyebrow="Esports market"
        title="Betable market"
        icon={<ChartCandlestick size={18} />}
        subtitle="No market on this bracket yet — host can open one later from the Host tab."
        action={<GhBadge tone="muted">Off</GhBadge>}
      >
        <Text fontSize="sm" color="fg.muted" lineHeight="1.55" mb="phi3">
          Schedule must be ≥ 1 hour out when opening. Spectators wager on result
          options; winner-path share is policy % of volume, separate from host fee
          on the entry pot.
        </Text>
        <SimpleGrid columns={{ base: 2, sm: 4 }} gap="phi2">
          <BetStat label="Volume" value="—" />
          <BetStat label="Liquidity" value="—" />
          <BetStat label="Options" value="—" />
          <BetStat label="Status" value="Closed" />
        </SimpleGrid>
      </FeaturedPanel>
    );
  }

  const lines = t.marketLines ?? [];
  const vol = t.marketVolumeIcp ?? 0;
  const liq = t.marketLiquidityIcp ?? 0;
  const mStatus = t.marketStatus ?? "open";

  return (
    <FeaturedPanel
      tone="prize"
      eyebrow="Esports market"
      title={`${t.title} — Winner`}
      icon={<ChartCandlestick size={18} />}
      subtitle="Outright market settles with this bracket. Pick a result option — winner path earns policy share of volume."
      action={
        <HStack gap="2" flexWrap="wrap">
          <GhBadge
            tone={
              mStatus === "live"
                ? "live"
                : mStatus === "settled"
                  ? "success"
                  : "prize"
            }
            pulse={mStatus === "live"}
          >
            {mStatus}
          </GhBadge>
          <Link href={marketHref(t.marketId)}>
            <GhButton
              size="sm"
              variant="prize"
              leftIcon={<ChartCandlestick size={14} />}
              rightIcon={<ExternalLink size={14} />}
            >
              Full market
            </GhButton>
          </Link>
        </HStack>
      }
    >
      <SimpleGrid columns={{ base: 2, sm: 4 }} gap="phi2" mb="phi4">
        <BetStat label="Volume" value={formatIcp(vol)} />
        <BetStat label="Liquidity" value={formatIcp(liq)} />
        <BetStat label="Options" value={String(lines.length || "—")} />
        <BetStat
          label="Settles with"
          value={t.status === "settled" ? "Final" : "Bracket"}
        />
      </SimpleGrid>

      <Text
        fontFamily="heading"
        fontSize="2xs"
        fontWeight="bold"
        letterSpacing="0.12em"
        textTransform="uppercase"
        color="fg.subtle"
        mb="phi2"
      >
        Result options
      </Text>
      {lines.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          Lines populate when the market opens.
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="phi2">
          {lines.map((line) => (
            <Box
              key={line.label}
              p="phi3"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="border.default"
              bg="blackAlpha.500"
            >
              <HStack justify="space-between" mb="2" gap="2">
                <Text
                  fontFamily="heading"
                  fontWeight="extrabold"
                  fontSize="sm"
                  lineClamp={1}
                >
                  {line.label}
                </Text>
                <Text
                  fontFamily="heading"
                  fontWeight="extrabold"
                  fontSize="lg"
                  color="prize.fg"
                  flexShrink={0}
                >
                  {line.odds}
                </Text>
              </HStack>
              <HStack justify="space-between" mb="1.5">
                <Text fontSize="2xs" color="fg.subtle">
                  Implied {line.pct}%
                </Text>
                {line.volumeIcp != null ? (
                  <Text fontSize="2xs" color="fg.muted">
                    {formatIcp(line.volumeIcp)} on option
                  </Text>
                ) : null}
              </HStack>
              <Box
                h="1.5"
                borderRadius="full"
                bg="blackAlpha.600"
                overflow="hidden"
              >
                <Box
                  h="100%"
                  w={`${Math.min(100, Math.max(4, line.pct))}%`}
                  bg="linear-gradient(90deg, #f43fa8, #a3ff3d)"
                  borderRadius="full"
                />
              </Box>
              <GhButton
                size="sm"
                variant="soft"
                w="100%"
                mt="phi2"
                onClick={() =>
                  ghToast({
                    title: "Demo stake",
                    description: `${line.label} @ ${line.odds}`,
                    type: "info",
                  })
                }
              >
                Back this outcome
              </GhButton>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </FeaturedPanel>
  );
}

function BetStat({ label, value }: { label: string; value: string }) {
  return (
    <Box
      p="phi3"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      bg="blackAlpha.500"
    >
      <Text
        fontSize="2xs"
        color="fg.subtle"
        fontFamily="heading"
        fontWeight="bold"
        letterSpacing="0.1em"
        textTransform="uppercase"
      >
        {label}
      </Text>
      <Text fontFamily="heading" fontWeight="extrabold" fontSize="md" mt="0.5">
        {value}
      </Text>
    </Box>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack
      justify="space-between"
      p="phi2"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border.default"
      bg="blackAlpha.400"
    >
      <Text fontSize="xs" color="fg.subtle">
        {label}
      </Text>
      <Text fontFamily="heading" fontSize="sm" fontWeight="bold">
        {value}
      </Text>
    </HStack>
  );
}

function PlayersPanel({
  t,
  isHost,
  onKick,
  onCheckIn,
}: {
  t: TournamentDetail;
  isHost: boolean;
  onKick: (id: string) => void;
  onCheckIn: (id: string) => void;
}) {
  const sorted = useMemo(
    () => [...t.entrants].sort((a, b) => a.seed - b.seed),
    [t.entrants],
  );

  if (sorted.length === 0) {
    return (
      <Box pt="phi3">
        <GhEmptyState
          icon={Users}
          title="No entrants yet"
          description="Be the first seed — entry escrow locks when you join."
        />
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap="phi2" pt="phi2">
      <Text fontSize="xs" color="fg.muted">
        {sorted.filter((e) => e.paid).length} paid ·{" "}
        {sorted.filter((e) => e.checkedIn).length} checked in · seeds by join order
      </Text>
      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="phi2">
        {sorted.map((e) => (
          <GhSurface
            key={e.id}
            variant={e.isHost ? "prize" : "elevated"}
            p="phi3"
            borderColor={e.isHost ? "prize.solid" : undefined}
          >
            <HStack gap="phi3" align="center">
              <Box position="relative">
                <GhAvatar name={e.username} size="md" tone="prize" />
                <Box
                  position="absolute"
                  bottom="-1"
                  right="-1"
                  bg="bg.elevated"
                  borderRadius="md"
                  px="1"
                  borderWidth="1px"
                  borderColor="border.default"
                >
                  <Text fontFamily="mono" fontSize="2xs" fontWeight="bold">
                    #{e.seed}
                  </Text>
                </Box>
              </Box>
              <Box flex="1" minW="0">
                <HStack gap="1" flexWrap="wrap" mb="0.5">
                  <Text
                    fontFamily="heading"
                    fontWeight="extrabold"
                    fontSize="sm"
                    lineClamp={1}
                  >
                    {e.username}
                  </Text>
                  {e.isHost ? <GhBadge tone="prize">Host</GhBadge> : null}
                  {e.teamTag ? (
                    <GhBadge tone="brand">[{e.teamTag}]</GhBadge>
                  ) : null}
                </HStack>
                <HStack gap="2" flexWrap="wrap">
                  <GhBadge tone={e.paid ? "success" : "muted"}>
                    {e.paid ? "Paid" : "Unpaid"}
                  </GhBadge>
                  <GhBadge tone={e.checkedIn ? "live" : "muted"}>
                    {e.checkedIn ? "Checked in" : "Not in"}
                  </GhBadge>
                  {e.record ? (
                    <Text fontSize="2xs" color="fg.subtle">
                      {e.record}
                    </Text>
                  ) : null}
                  {e.streamUrl ? (
                    <GhBadge tone="live">
                      <Radio size={10} /> Live
                    </GhBadge>
                  ) : null}
                </HStack>
              </Box>
              <VStack gap="1" flexShrink={0}>
                <Link href={`/profile?u=${encodeURIComponent(e.username)}`}>
                  <GhButton size="sm" variant="ghost">
                    Profile
                  </GhButton>
                </Link>
                {e.streamUrl ? (
                  <a href={e.streamUrl} target="_blank" rel="noreferrer">
                    <GhButton size="sm" variant="soft" leftIcon={<Radio size={12} />}>
                      Stream
                    </GhButton>
                  </a>
                ) : null}
                {isHost && t.status !== "settled" ? (
                  <>
                    {!e.checkedIn ? (
                      <GhButton
                        size="sm"
                        variant="soft"
                        leftIcon={<Check size={12} />}
                        onClick={() => onCheckIn(e.id)}
                      >
                        Check in
                      </GhButton>
                    ) : null}
                    {!e.isHost ? (
                      <GhButton
                        size="sm"
                        variant="ghost"
                        leftIcon={<UserMinus size={12} />}
                        onClick={() => onKick(e.id)}
                      >
                        Kick
                      </GhButton>
                    ) : null}
                  </>
                ) : null}
              </VStack>
            </HStack>
          </GhSurface>
        ))}
      </Grid>
    </VStack>
  );
}

function BracketPanel({
  t,
  isHost,
  onReportWinner,
}: {
  t: TournamentDetail;
  isHost: boolean;
  onReportWinner: (matchId: string, winner: string) => void;
}) {
  const groupPot = isGroupPotTournament(t);
  const byRound = matchesByRound(t.matches);
  const rounds = totalRounds(t.matches);
  const streams = entrantStreamMap(t.entrants);

  // Group pot / FFA — seat table, not elimination tree
  if (groupPot) {
    return (
      <VStack align="stretch" gap="phi4" pt="phi2">
        <GhSurface
          variant="elevated"
          p="phi4"
          borderColor="live.solid"
        >
          <HStack gap="2" mb="phi2" flexWrap="wrap">
            <GhBadge tone="live">Group pot</GhBadge>
            <GhBadge tone="muted">{t.format.replace("_", " ")}</GhBadge>
            <Text fontFamily="heading" fontWeight="extrabold">
              Multiplayer table
            </Text>
          </HStack>
          <Text fontSize="sm" color="fg.muted" lineHeight="1.55" mb="phi3">
            This event is a <strong>group pot</strong> — seats fill a shared
            table (poker, spades, dominoes, FFA, etc.), not a 1v1 elimination
            tree. Host finalizes the winner when the table ends; prize claim
            follows host fee + any linked betable settle.
          </Text>
          <SimpleGrid columns={{ base: 2, sm: 4 }} gap="phi2">
            <Box p="phi2" borderRadius="lg" borderWidth="1px" borderColor="border.default" bg="blackAlpha.400">
              <Text fontSize="2xs" color="fg.subtle" textTransform="uppercase" fontWeight="bold">Seats</Text>
              <Text fontFamily="heading" fontWeight="extrabold">{filledLabel(t)}</Text>
            </Box>
            <Box p="phi2" borderRadius="lg" borderWidth="1px" borderColor="border.default" bg="blackAlpha.400">
              <Text fontSize="2xs" color="fg.subtle" textTransform="uppercase" fontWeight="bold">Buy-in</Text>
              <Text fontFamily="heading" fontWeight="extrabold">{formatIcp(t.entryFeeIcp)}</Text>
            </Box>
            <Box p="phi2" borderRadius="lg" borderWidth="1px" borderColor="prize.solid" bg="prize.muted">
              <Text fontSize="2xs" color="prize.fg" textTransform="uppercase" fontWeight="bold">Pot</Text>
              <Text fontFamily="heading" fontWeight="extrabold" className="gh-text-prize">
                {formatIcp(potFrom(t))}
              </Text>
            </Box>
            <Box p="phi2" borderRadius="lg" borderWidth="1px" borderColor="border.default" bg="blackAlpha.400">
              <Text fontSize="2xs" color="fg.subtle" textTransform="uppercase" fontWeight="bold">Host take</Text>
              <Text fontFamily="heading" fontWeight="extrabold">{t.hostFeePct}%</Text>
            </Box>
          </SimpleGrid>
        </GhSurface>

        <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
          Seated players
        </Text>
        {t.entrants.length === 0 ? (
          <GhEmptyState
            icon={Users}
            title="No seats filled yet"
            description="Players join until max seats — then the table goes live."
          />
        ) : (
          <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap="phi2">
            {t.entrants.map((e, i) => (
              <GhSurface key={e.id} variant="glass" p="phi3">
                <HStack gap="phi2">
                  <Text
                    fontFamily="heading"
                    fontWeight="extrabold"
                    color="live.fg"
                    w="6"
                  >
                    #{i + 1}
                  </Text>
                  <GhAvatar name={e.username} size="sm" tone="live" />
                  <Box minW="0">
                    <Text fontFamily="heading" fontWeight="bold" fontSize="sm" lineClamp={1}>
                      {e.username}
                    </Text>
                    <Text fontSize="2xs" color="fg.subtle">
                      {e.paid ? "Buy-in paid" : "Pending buy-in"}
                      {e.checkedIn ? " · checked in" : ""}
                    </Text>
                  </Box>
                </HStack>
              </GhSurface>
            ))}
          </Grid>
        )}

        {t.matches.length > 0 ? (
          <Box>
            <Text fontSize="xs" color="fg.muted" mb="phi2">
              Optional heat results (if host tracks sub-matches)
            </Text>
            <VStack align="stretch" gap="2">
              {t.matches.map((m) => (
                <MatchSlot
                  key={m.id}
                  match={m}
                  streams={streams}
                  isHost={isHost}
                  canReport={
                    isHost &&
                    m.status !== "done" &&
                    Boolean(m.p1 && m.p2) &&
                    t.status !== "settled"
                  }
                  onPick={(w) => onReportWinner(m.id, w)}
                  groupPot
                />
              ))}
            </VStack>
          </Box>
        ) : null}
      </VStack>
    );
  }

  if (t.matches.length === 0) {
    return (
      <Box pt="phi3">
        <GhEmptyState
          icon={Swords}
          title="Bracket not generated"
          description={
            t.status === "open"
              ? "Host generates the bracket when registration locks / check-in starts."
              : "No matches for this event yet."
          }
        />
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap="phi3" pt="phi2">
      <HStack gap="2" flexWrap="wrap">
        <GhBadge tone="prize">Bracket</GhBadge>
        <Text fontSize="xs" color="fg.muted">
          {rounds} rounds · profile · challenge · stream · host reports winners
        </Text>
      </HStack>
      <Box
        overflowX="auto"
        pb="phi2"
        css={{
          "&::-webkit-scrollbar": { height: "6px" },
          scrollbarWidth: "thin",
        }}
      >
        <HStack align="flex-start" gap="phi4" minW="min-content" px="1">
          {Array.from({ length: rounds }, (_, r) => {
            const list = byRound.get(r) ?? [];
            return (
              <Box key={r} minW="16rem" w="16rem">
                <Text
                  fontFamily="heading"
                  fontSize="2xs"
                  fontWeight="bold"
                  letterSpacing="0.12em"
                  textTransform="uppercase"
                  color="prize.fg"
                  mb="phi2"
                  textAlign="center"
                >
                  {roundLabel(r, rounds)}
                </Text>
                <VStack
                  align="stretch"
                  gap="phi3"
                  justify="space-around"
                  minH={r === 0 ? undefined : `${list.length * 8.5}rem`}
                >
                  {list.map((m) => (
                    <MatchSlot
                      key={m.id}
                      match={m}
                      streams={streams}
                      isHost={isHost}
                      canReport={
                        isHost &&
                        m.status !== "done" &&
                        Boolean(m.p1 && m.p2) &&
                        t.status !== "settled"
                      }
                      onPick={(w) => onReportWinner(m.id, w)}
                    />
                  ))}
                </VStack>
              </Box>
            );
          })}
        </HStack>
      </Box>
    </VStack>
  );
}

function MatchSlot({
  match,
  streams,
  isHost,
  canReport,
  onPick,
  groupPot,
}: {
  match: BracketMatch;
  streams: Map<string, string>;
  isHost: boolean;
  canReport: boolean;
  onPick: (winner: string) => void;
  groupPot?: boolean;
}) {
  const live = match.status === "live";
  const done = match.status === "done";
  return (
    <Box
      borderRadius="xl"
      borderWidth="1px"
      borderColor={
        live
          ? "live.solid"
          : done
            ? groupPot
              ? "live.solid"
              : "border.brand"
            : groupPot
              ? "border.live"
              : "border.default"
      }
      bg="bg.elevated"
      overflow="hidden"
      boxShadow={live ? "glow" : undefined}
    >
      <HStack
        px="2"
        py="1"
        bg={groupPot ? "live.muted" : "blackAlpha.500"}
        justify="space-between"
        borderBottomWidth="1px"
        borderColor="border.default"
      >
        <Text fontFamily="mono" fontSize="2xs" color="fg.subtle">
          {groupPot ? "Heat" : "M"}
          {match.slot + 1}
        </Text>
        <HStack gap="1">
          {match.challengeId ? (
            <Link
              href={challengeHref(match.challengeId)}
              title="Open challenge"
              onClick={(e) => e.stopPropagation()}
            >
              <Box
                as="span"
                display="inline-flex"
                alignItems="center"
                gap="1"
                px="1.5"
                py="0.5"
                borderRadius="md"
                bg="brand.muted"
                color="brand.fg"
                fontSize="2xs"
                fontWeight="bold"
                _hover={{ opacity: 0.85 }}
              >
                <Swords size={10} /> Match
              </Box>
            </Link>
          ) : null}
          <GhBadge
            tone={
              live
                ? "live"
                : done
                  ? "success"
                  : match.status === "ready"
                    ? "brand"
                    : "muted"
            }
            pulse={live}
          >
            {match.status}
          </GhBadge>
        </HStack>
      </HStack>
      <PlayerLine
        name={match.p1}
        streamUrl={match.p1 ? streams.get(match.p1) : undefined}
        winner={match.winner === match.p1}
        canPick={canReport && !!match.p1}
        onPick={() => match.p1 && onPick(match.p1)}
      />
      <PlayerLine
        name={match.p2}
        streamUrl={match.p2 ? streams.get(match.p2) : undefined}
        winner={match.winner === match.p2}
        canPick={canReport && !!match.p2}
        onPick={() => match.p2 && onPick(match.p2)}
        last
      />
      <HStack
        px="2"
        py="1.5"
        borderTopWidth="1px"
        borderColor="border.default"
        justify="space-between"
        gap="1"
        flexWrap="wrap"
      >
        <Text fontSize="2xs" color="fg.subtle">
          {match.score
            ? match.score
            : canReport
              ? "Tap name → report"
              : "—"}
        </Text>
        {match.challengeId ? (
          <Link href={challengeHref(match.challengeId)}>
            <Text
              fontSize="2xs"
              color="brand.fg"
              fontWeight="bold"
              fontFamily="heading"
            >
              Open challenge →
            </Text>
          </Link>
        ) : null}
      </HStack>
    </Box>
  );
}

function PlayerLine({
  name,
  streamUrl,
  winner,
  canPick,
  onPick,
  last,
}: {
  name: string | null;
  streamUrl?: string;
  winner: boolean;
  canPick: boolean;
  onPick: () => void;
  last?: boolean;
}) {
  const empty = !name;
  return (
    <Flex
      w="100%"
      align="center"
      gap="1.5"
      px="2"
      py="2"
      bg={winner ? "brand.muted" : "transparent"}
      borderBottomWidth={last ? "0" : "1px"}
      borderColor="border.default"
    >
      <Box
        as={canPick ? "button" : "div"}
        onClick={canPick ? onPick : undefined}
        display="flex"
        alignItems="center"
        gap="2"
        flex="1"
        minW="0"
        cursor={canPick ? "pointer" : "default"}
        textAlign="left"
        _hover={canPick ? { opacity: 0.9 } : undefined}
      >
        <Box
          w="2"
          h="2"
          borderRadius="full"
          bg={winner ? "brand.solid" : empty ? "whiteAlpha.200" : "prize.solid"}
          flexShrink={0}
        />
        {name ? (
          <Link
            href={`/profile?u=${encodeURIComponent(name)}`}
            onClick={(e) => e.stopPropagation()}
            style={{ minWidth: 0, flex: 1 }}
          >
            <Text
              fontFamily="heading"
              fontSize="xs"
              fontWeight={winner ? "extrabold" : "bold"}
              color={winner ? "brand.fg" : "fg.default"}
              lineClamp={1}
              textDecoration="underline"
              textDecorationColor="whiteAlpha.300"
              _hover={{ color: "prize.fg" }}
            >
              {name}
            </Text>
          </Link>
        ) : (
          <Text
            fontFamily="heading"
            fontSize="xs"
            fontWeight="bold"
            color="fg.subtle"
            flex="1"
          >
            TBD
          </Text>
        )}
        {winner ? <Check size={12} color="var(--gh-colors-brand-fg)" /> : null}
      </Box>
      {streamUrl ? (
        <a
          href={streamUrl}
          target="_blank"
          rel="noreferrer"
          title="Watch stream"
          onClick={(e) => e.stopPropagation()}
          style={{ display: "inline-flex", flexShrink: 0 }}
        >
          <Box
            w="7"
            h="7"
            borderRadius="md"
            bg="live.muted"
            color="live.fg"
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderWidth="1px"
            borderColor="live.solid"
            _hover={{ bg: "live.solid", color: "bg.canvas" }}
          >
            <Radio size={12} />
          </Box>
        </a>
      ) : null}
    </Flex>
  );
}

function HostControlsPanel({
  t,
  isHost,
  onPatch,
  onOpenBetable,
  hostPrincipal,
}: {
  t: TournamentDetail;
  isHost: boolean;
  onPatch: (p: Partial<TournamentDetail>) => void;
  onOpenBetable?: (opts: {
    marketId?: string;
    closeDate?: Date;
    outcomes?: string[];
  }) => void | Promise<void>;
  hostPrincipal?: string;
}) {
  const { openDm } = useChat();
  const [betableDate, setBetableDate] = useState("");
  const [betableTime, setBetableTime] = useState("");
  /** Comma-separated free-text outcomes (teams) — non-users allowed on betable esports */
  const [outcomeLabels, setOutcomeLabels] = useState(
    t.teamEntry
      ? t.entrants.map((e) => e.username || e.id).filter(Boolean).join(", ")
      : t.entrants.map((e) => e.username || e.id).filter(Boolean).slice(0, 8).join(", "),
  );
  const [notes, setNotes] = useState(t.description);
  const [hostStream, setHostStream] = useState(t.streamUrl ?? "");
  const [playerStreams, setPlayerStreams] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        t.entrants.map((e) => [e.id, e.streamUrl ?? ""]),
      ),
  );
  const [stoppingBets, setStoppingBets] = useState(false);
  const minStart = useMemo(() => minBetableStart(), []);
  const stats = hostStatsFor(t);
  const pot = potFrom(t);
  const cut = hostCutFrom(t);
  const prize = prizePoolFrom(t);

  // Me as player (demo username "you") — can update own stream when not host
  const meEntrant = t.entrants.find((e) => e.username === "you");
  const isPlayer = Boolean(meEntrant);

  const chatHost = () => {
    openDm({
      id: `host-${t.hostUsername}`,
      username: t.hostUsername,
      status: "online",
      game: t.game,
      record: stats.record,
    });
    ghToast({
      title: "Chat opened",
      description: `DM · ${t.hostUsername}`,
      type: "info",
    });
  };

  const saveHostStream = () => {
    const raw = hostStream.trim();
    const normalized = raw
      ? /^https?:\/\//i.test(raw)
        ? raw
        : `https://${raw}`
      : "";
    onPatch({ streamUrl: normalized || undefined });
    setHostStream(normalized);
    ghToast({
      title: normalized ? "Host stream updated" : "Host stream cleared",
      type: "success",
    });
  };

  const savePlayerStream = (entrantId: string) => {
    const raw = (playerStreams[entrantId] ?? "").trim();
    const normalized = raw
      ? /^https?:\/\//i.test(raw)
        ? raw
        : `https://${raw}`
      : "";
    onPatch({
      entrants: t.entrants.map((e) =>
        e.id === entrantId
          ? { ...e, streamUrl: normalized || undefined }
          : e,
      ),
    });
    setPlayerStreams((prev) => ({ ...prev, [entrantId]: normalized }));
    ghToast({ title: "Player stream saved", type: "success" });
  };

  const parseOutcomes = () =>
    outcomeLabels
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const openBetable = () => {
    if (t.betable) {
      ghToast({
        title: "Already betable",
        description: t.marketId ? `Market ${t.marketId}` : "Market open",
        type: "info",
      });
      return;
    }
    const outcomes = parseOutcomes();
    if (outcomes.length < 2) {
      ghToast({
        title: "Need outcome labels",
        description:
          "Enter at least 2 team/player names (comma-separated). They do not need to be betable users.",
        type: "error",
      });
      return;
    }
    let closeDate: Date | undefined;
    if (!betableDate || !betableTime) {
      if (t.scheduledAt) {
        const at = new Date(t.scheduledAt);
        if (at.getTime() >= minStart.getTime()) {
          closeDate = at;
          void onOpenBetable?.({ closeDate, outcomes });
          return;
        }
      }
      ghToast({
        title: "Schedule required",
        description: "Set date + time ≥ 1 hour from now",
        type: "error",
      });
      return;
    }
    const at = new Date(`${betableDate}T${betableTime}:00`);
    if (Number.isNaN(at.getTime()) || at.getTime() < minStart.getTime()) {
      ghToast({
        title: "Invalid schedule",
        description: `Must start after ${minStart.toLocaleString()}`,
        type: "error",
      });
      return;
    }
    onPatch({ scheduledAt: at.toISOString() });
    void onOpenBetable?.({ closeDate: at, outcomes });
  };

  const stopBets = async () => {
    if (!t.marketId) return;
    setStoppingBets(true);
    try {
      const { stopBetableBets } = await import("@/lib/ic/betable-service");
      const ok = await stopBetableBets(t.marketId);
      if (!ok) throw new Error("stop_bets returned false (creator only while active)");
      ghToast({
        title: "Bets stopped",
        description: "Market closed for trading — not finalized. Resolve later.",
        type: "success",
      });
    } catch (e) {
      ghToast({
        title: "Stop bets failed",
        description: e instanceof Error ? e.message : String(e),
        type: "error",
      });
    } finally {
      setStoppingBets(false);
    }
  };

  const setStatus = (status: TournamentStatus) => {
    onPatch({
      status,
      registrationOpen:
        status === "open"
          ? true
          : status === "checkin" ||
              status === "live" ||
              status === "settled"
            ? false
            : t.registrationOpen,
    });
    ghToast({
      title: `Status → ${statusLabel(status)}`,
      type: "success",
    });
  };

  return (
    <VStack align="stretch" gap="phi4" pt="phi2">
      {/* Always-visible host card (for non-host players especially) */}
      <HostPublicCard
        t={t}
        stats={stats}
        isHost={isHost}
        onChat={chatHost}
      />

      {/* Non-host players: own stream + public payout peek */}
      {!isHost ? (
        <VStack align="stretch" gap="phi3">
          {isPlayer && meEntrant ? (
            <FeaturedPanel
              tone="live"
              eyebrow="Your broadcast"
              title="Player stream URL"
              icon={<Radio size={18} />}
              subtitle="Shown on the bracket next to your name when set."
            >
              <GhField
                label="Stream link"
                helperText="Twitch · YouTube Live · Kick"
              >
                <GhInput
                  value={playerStreams[meEntrant.id] ?? ""}
                  onChange={(e) =>
                    setPlayerStreams((prev) => ({
                      ...prev,
                      [meEntrant.id]: e.target.value,
                    }))
                  }
                  placeholder="https://twitch.tv/you"
                />
              </GhField>
              <HStack mt="phi3" gap="2" flexWrap="wrap">
                <GhButton
                  size="sm"
                  variant="live"
                  leftIcon={<Radio size={14} />}
                  onClick={() => savePlayerStream(meEntrant.id)}
                >
                  Save my stream
                </GhButton>
                <Link href={`/profile?u=${encodeURIComponent(t.hostUsername)}`}>
                  <GhButton size="sm" variant="outline">
                    Host profile
                  </GhButton>
                </Link>
              </HStack>
            </FeaturedPanel>
          ) : null}

          <PayoutSnapshot
            pot={pot}
            cut={cut}
            prize={prize}
            hostPct={t.hostFeePct}
            isHost={false}
          />

          <GhAlert tone="info" title="Host controls locked">
            Lifecycle, betable open, and description edits are available only to{" "}
            <strong>{t.hostUsername}</strong>. Use chat above for questions.
          </GhAlert>
        </VStack>
      ) : (
        <VStack align="stretch" gap="phi3">
          <GhAlert tone="prize" title="Host booth">
            You control registration, check-in, bracket flow, streams, and can
            open a betable market later if you skipped it at create time.
          </GhAlert>

          {/* Lifecycle */}
          <GhSurface variant="elevated" p="phi4">
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              fontSize="sm"
              mb="phi3"
            >
              Lifecycle
            </Text>
            <HStack gap="2" flexWrap="wrap" mb="phi3">
              <GhButton
                size="sm"
                variant={t.status === "open" ? "primary" : "outline"}
                leftIcon={<Unlock size={14} />}
                onClick={() => setStatus("open")}
                disabled={t.status === "settled"}
              >
                Open reg
              </GhButton>
              <GhButton
                size="sm"
                variant={t.status === "checkin" ? "primary" : "outline"}
                leftIcon={<Check size={14} />}
                onClick={() => setStatus("checkin")}
                disabled={t.status === "settled"}
              >
                Check-in
              </GhButton>
              <GhButton
                size="sm"
                variant={t.status === "live" ? "live" : "outline"}
                leftIcon={<Play size={14} />}
                onClick={() => setStatus("live")}
                disabled={t.status === "settled"}
              >
                Go live
              </GhButton>
              <GhButton
                size="sm"
                variant={t.status === "settled" ? "prize" : "outline"}
                leftIcon={<Trophy size={14} />}
                onClick={() => {
                  setStatus("settled");
                  onPatch({ registrationOpen: false });
                }}
              >
                Finalize & pay
              </GhButton>
            </HStack>
            <HStack justify="space-between" flexWrap="wrap" gap="2">
              <HStack gap="2">
                {t.registrationOpen ? <Unlock size={14} /> : <Lock size={14} />}
                <Text fontSize="sm" fontWeight="bold">
                  Registration {t.registrationOpen ? "open" : "locked"}
                </Text>
              </HStack>
              <GhSwitch
                checked={t.registrationOpen}
                onCheckedChange={(c) => onPatch({ registrationOpen: c })}
                disabled={t.status === "settled" || t.status === "live"}
                tone="brand"
              />
            </HStack>
          </GhSurface>

          {/* Open betable */}
          <GhSurface
            variant={t.betable ? "muted" : "prize"}
            p="phi4"
            borderColor={t.betable ? undefined : "prize.solid"}
          >
            <HStack gap="2" mb="phi2">
              <ChartCandlestick
                size={18}
                color="var(--gh-colors-prize-fg)"
              />
              <Text
                fontFamily="heading"
                fontWeight="extrabold"
                fontSize="sm"
                color="prize.fg"
              >
                Betable market
              </Text>
            </HStack>
            {t.betable ? (
              <VStack align="stretch" gap="phi2">
                <Text fontSize="sm" color="fg.muted" lineHeight="1.5">
                  Market is linked
                  {t.marketId ? (
                    <>
                      {" "}
                      · id{" "}
                      <Text as="span" fontFamily="mono" color="prize.fg">
                        {t.marketId}
                      </Text>
                    </>
                  ) : null}
                  {t.marketVolumeIcp != null ? (
                    <> · volume {formatIcp(t.marketVolumeIcp)}</>
                  ) : null}
                  . Winner fee share pays tournament escrow; 1% creator fee to host.
                  Prize claim stays locked until the market is resolved.
                </Text>
                <HStack gap="2" flexWrap="wrap">
                  {t.marketId ? (
                    <Link href={marketHref(t.marketId)}>
                      <GhButton
                        variant="prize"
                        leftIcon={<ChartCandlestick size={16} />}
                      >
                        Open market page
                      </GhButton>
                    </Link>
                  ) : null}
                  {t.marketId ? (
                    <GhButton
                      variant="outline"
                      size="sm"
                      disabled={stoppingBets}
                      onClick={() => void stopBets()}
                    >
                      {stoppingBets ? "Stopping…" : "Stop bets"}
                    </GhButton>
                  ) : null}
                </HStack>
              </VStack>
            ) : (
              <VStack align="stretch" gap="phi3">
                <Text fontSize="sm" color="fg.muted" lineHeight="1.5">
                  Open an Esports multi-outcome market on betable. Host must be a
                  betable member with Esports access. Outcome labels can be team
                  names (not betable users). Winner fee → tournament escrow · 1%
                  creator fee → you. Requires start ≥{" "}
                  <strong style={{ color: "var(--gh-colors-prize-fg)" }}>
                    1 hour
                  </strong>{" "}
                  from now.
                </Text>
                <GhField
                  label="Outcome labels"
                  helperText="Comma-separated teams/players (min 2). Non-users allowed."
                >
                  <GhInput
                    value={outcomeLabels}
                    onChange={(e) => setOutcomeLabels(e.target.value)}
                    placeholder="Team Alpha, Team Barrak, Team Justice"
                  />
                </GhField>
                {t.scheduledAt &&
                new Date(t.scheduledAt).getTime() >= minStart.getTime() ? (
                  <GhAlert tone="success" title="Existing schedule works">
                    {formatWhen(t.scheduledAt)} — open without re-entering time.
                  </GhAlert>
                ) : (
                  <HStack gap="phi2" flexWrap="wrap" align="flex-start">
                    <Box flex="1" minW="8rem">
                      <GhField label="Start date">
                        <GhInput
                          type="date"
                          value={betableDate}
                          onChange={(e) => setBetableDate(e.target.value)}
                        />
                      </GhField>
                    </Box>
                    <Box flex="1" minW="8rem">
                      <GhField label="Start time">
                        <GhInput
                          type="time"
                          value={betableTime}
                          onChange={(e) => setBetableTime(e.target.value)}
                        />
                      </GhField>
                    </Box>
                  </HStack>
                )}
                <Text fontSize="2xs" color="fg.subtle">
                  Earliest allowed · {minStart.toLocaleString()}
                </Text>
                <GhButton
                  variant="prize"
                  leftIcon={<ChartCandlestick size={16} />}
                  onClick={openBetable}
                >
                  Open betable market
                </GhButton>
              </VStack>
            )}
          </GhSurface>

          {/* Highlighted payout */}
          <PayoutSnapshot
            pot={pot}
            cut={cut}
            prize={prize}
            hostPct={t.hostFeePct}
            isHost
          />

          {/* Public description + streams */}
          <FeaturedPanel
            tone="brand"
            eyebrow="Public page"
            title="Description & streams"
            icon={<FileText size={18} />}
            subtitle="Visible on Overview. Update host desk cast and player stream links."
          >
            <Box mb="phi3">
              <GhField label="Public description">
                <GhTextarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Rules, Discord, schedule notes…"
                />
              </GhField>
            </Box>
            <HStack mb="phi4" gap="2" flexWrap="wrap">
              <GhButton
                size="sm"
                variant="primary"
                onClick={() => {
                  onPatch({ description: notes });
                  ghToast({ title: "Description saved", type: "success" });
                }}
              >
                Save description
              </GhButton>
              <GhButton
                size="sm"
                variant="outline"
                leftIcon={<CalendarClock size={14} />}
                onClick={() =>
                  ghToast({
                    title: "Schedule editor",
                    description: "Full reschedule ships with canister wiring",
                    type: "info",
                  })
                }
              >
                Reschedule
              </GhButton>
            </HStack>

            {/* Host stream */}
            <Box
              p="phi3"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="live.solid"
              bg="blackAlpha.500"
              mb="phi3"
            >
              <HStack gap="2" mb="phi2">
                <Radio size={14} color="var(--gh-colors-live-fg)" />
                <Text
                  fontFamily="heading"
                  fontSize="2xs"
                  fontWeight="bold"
                  letterSpacing="0.1em"
                  textTransform="uppercase"
                  color="live.fg"
                >
                  Host stream URL
                </Text>
              </HStack>
              <GhField label="Desk cast link" helperText="Twitch / YouTube / Kick">
                <GhInput
                  value={hostStream}
                  onChange={(e) => setHostStream(e.target.value)}
                  placeholder="https://twitch.tv/your_channel"
                />
              </GhField>
              <GhButton
                size="sm"
                variant="live"
                mt="phi2"
                leftIcon={<Radio size={14} />}
                onClick={saveHostStream}
              >
                Save host stream
              </GhButton>
            </Box>

            {/* Player streams */}
            <Text
              fontFamily="heading"
              fontSize="2xs"
              fontWeight="bold"
              letterSpacing="0.12em"
              textTransform="uppercase"
              color="fg.subtle"
              mb="phi2"
            >
              Tournament player streams
            </Text>
            <Text fontSize="xs" color="fg.muted" mb="phi3" lineHeight="1.45">
              Host can set or fix any entrant’s stream. Links appear on the
              bracket as live icons.
            </Text>
            <VStack align="stretch" gap="2">
              {t.entrants.map((e) => (
                <Box
                  key={e.id}
                  p="phi3"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={
                    playerStreams[e.id] ? "live.solid" : "border.default"
                  }
                  bg="blackAlpha.400"
                >
                  <HStack justify="space-between" mb="2" gap="2" flexWrap="wrap">
                    <HStack gap="2" minW="0">
                      <GhAvatar name={e.username} size="sm" tone="prize" />
                      <Box minW="0">
                        <HStack gap="1" flexWrap="wrap">
                          <Text
                            fontFamily="heading"
                            fontSize="sm"
                            fontWeight="bold"
                            lineClamp={1}
                          >
                            {e.username}
                          </Text>
                          {e.isHost ? (
                            <GhBadge tone="prize">Host</GhBadge>
                          ) : null}
                          <GhBadge tone="muted">#{e.seed}</GhBadge>
                        </HStack>
                      </Box>
                    </HStack>
                    {playerStreams[e.id] ? (
                      <a
                        href={
                          /^https?:\/\//i.test(playerStreams[e.id])
                            ? playerStreams[e.id]
                            : `https://${playerStreams[e.id]}`
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        <GhButton
                          size="sm"
                          variant="ghost"
                          leftIcon={<ExternalLink size={12} />}
                        >
                          Open
                        </GhButton>
                      </a>
                    ) : null}
                  </HStack>
                  <HStack gap="2" align="flex-end" flexWrap="wrap">
                    <Box flex="1" minW="12rem">
                      <GhField label="Stream URL">
                        <GhInput
                          value={playerStreams[e.id] ?? ""}
                          onChange={(ev) =>
                            setPlayerStreams((prev) => ({
                              ...prev,
                              [e.id]: ev.target.value,
                            }))
                          }
                          placeholder="https://twitch.tv/…"
                        />
                      </GhField>
                    </Box>
                    <GhButton
                      size="sm"
                      variant="soft"
                      onClick={() => savePlayerStream(e.id)}
                    >
                      Save
                    </GhButton>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </FeaturedPanel>
        </VStack>
      )}
    </VStack>
  );
}

function HostPublicCard({
  t,
  stats,
  isHost,
  onChat,
}: {
  t: TournamentDetail;
  stats: ReturnType<typeof hostStatsFor>;
  isHost: boolean;
  onChat: () => void;
}) {
  return (
    <Box
      position="relative"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="prize.solid"
      overflow="hidden"
      boxShadow="glow-prize"
    >
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(125deg, rgba(244,63,168,0.2) 0%, rgba(13,11,26,0.94) 45%, rgba(163,255,61,0.08) 100%)"
      />
      <Box position="relative" p={{ base: "phi4", md: "phi5" }}>
        <HStack gap="2" mb="phi3" flexWrap="wrap">
          <GhBadge tone="prize">
            <Shield size={10} /> Tournament host
          </GhBadge>
          {isHost ? <GhBadge tone="brand">You</GhBadge> : null}
          {t.streamUrl ? (
            <GhBadge tone="live" pulse>
              <Radio size={10} /> Streaming
            </GhBadge>
          ) : null}
        </HStack>

        <Flex
          direction={{ base: "column", sm: "row" }}
          gap="phi4"
          align={{ sm: "center" }}
        >
          <GhAvatar
            name={t.hostUsername}
            size="xl"
            tone="prize"
            status="online"
          />
          <Box flex="1" minW="0">
            <Text
              fontFamily="heading"
              fontSize="2xs"
              fontWeight="bold"
              letterSpacing="0.12em"
              textTransform="uppercase"
              color="prize.fg"
              mb="1"
            >
              Running this bracket
            </Text>
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              fontSize={{ base: "xl", md: "2xl" }}
              lineClamp={1}
            >
              {t.hostUsername}
            </Text>
            <Text fontSize="sm" color="fg.muted" mt="0.5">
              {stats.record ?? "Host"} · {t.game} · {t.console}
            </Text>
            <HStack gap="2" mt="phi3" flexWrap="wrap">
              {!isHost ? (
                <GhButton
                  variant="prize"
                  leftIcon={<MessageCircle size={16} />}
                  onClick={onChat}
                >
                  Chat with host
                </GhButton>
              ) : (
                <GhButton
                  variant="soft"
                  leftIcon={<MessageCircle size={16} />}
                  onClick={onChat}
                >
                  Open host DM
                </GhButton>
              )}
              <Link href={`/profile?u=${encodeURIComponent(t.hostUsername)}`}>
                <GhButton variant="outline">Profile</GhButton>
              </Link>
              {t.streamUrl ? (
                <a href={t.streamUrl} target="_blank" rel="noreferrer">
                  <GhButton
                    variant="live"
                    leftIcon={<Radio size={14} />}
                    rightIcon={<ExternalLink size={12} />}
                  >
                    Host stream
                  </GhButton>
                </a>
              ) : null}
            </HStack>
          </Box>
        </Flex>

        <SimpleGrid columns={{ base: 2, md: 4 }} gap="phi2" mt="phi4">
          <HostStatTile
            icon={<Trophy size={14} />}
            label="Tournaments hosted"
            value={String(stats.tournamentsHosted)}
            tone="prize"
          />
          <HostStatTile
            icon={<Gavel size={14} />}
            label="Disputes"
            value={String(stats.disputes)}
            tone={stats.disputes > 0 ? "live" : "brand"}
          />
          <HostStatTile
            icon={<Coins size={14} />}
            label="Host earnings"
            value={formatIcp(stats.earningsIcp)}
            tone="prize"
          />
          <HostStatTile
            icon={<Users size={14} />}
            label="This lobby"
            value={filledLabel(t)}
            tone="brand"
          />
        </SimpleGrid>
      </Box>
    </Box>
  );
}

function HostStatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "prize" | "brand" | "live";
}) {
  const border =
    tone === "prize"
      ? "prize.solid"
      : tone === "live"
        ? "live.solid"
        : "border.brand";
  return (
    <Box
      p="phi3"
      borderRadius="xl"
      borderWidth="1px"
      borderColor={border}
      bg="blackAlpha.500"
    >
      <HStack gap="1" mb="1" color="fg.subtle">
        {icon}
        <Text
          fontSize="2xs"
          fontFamily="heading"
          fontWeight="bold"
          letterSpacing="0.08em"
          textTransform="uppercase"
        >
          {label}
        </Text>
      </HStack>
      <Text
        fontFamily="heading"
        fontWeight="extrabold"
        fontSize="lg"
        className={tone === "prize" ? "gh-text-prize" : undefined}
      >
        {value}
      </Text>
    </Box>
  );
}

function PayoutSnapshot({
  pot,
  cut,
  prize,
  hostPct,
  isHost,
}: {
  pot: number;
  cut: number;
  prize: number;
  hostPct: number;
  isHost: boolean;
}) {
  return (
    <Box
      position="relative"
      borderRadius="2xl"
      borderWidth="2px"
      borderColor="prize.solid"
      overflow="hidden"
      boxShadow="glow-prize"
    >
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(135deg, rgba(244,63,168,0.28) 0%, rgba(13,11,26,0.9) 40%, rgba(163,255,61,0.12) 100%)"
      />
      {/* Accent bar */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        h="1"
        bg="linear-gradient(90deg, #f43fa8, #a3ff3d, #f43fa8)"
      />
      <Box position="relative" p={{ base: "phi4", md: "phi5" }}>
        <HStack justify="space-between" mb="phi3" flexWrap="wrap" gap="2">
          <HStack gap="2">
            <Box
              w="11"
              h="11"
              borderRadius="xl"
              bg="prize.muted"
              color="prize.fg"
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderWidth="1px"
              borderColor="prize.solid"
              boxShadow="glow-prize"
            >
              <Coins size={20} />
            </Box>
            <Box>
              <Text
                fontFamily="heading"
                fontSize="2xs"
                fontWeight="bold"
                letterSpacing="0.14em"
                textTransform="uppercase"
                color="prize.fg"
              >
                Economics
              </Text>
              <Text fontFamily="heading" fontWeight="extrabold" fontSize="lg">
                Payout snapshot
              </Text>
            </Box>
          </HStack>
          <GhBadge tone="prize">{hostPct}% host fee</GhBadge>
        </HStack>

        <SimpleGrid columns={{ base: 2, md: 4 }} gap="phi2">
          <PayoutTile
            label="Total pot"
            value={formatIcp(pot)}
            hint="Paid entries"
            emphasis
          />
          <PayoutTile
            label={isHost ? "Your host cut" : "Host cut"}
            value={formatIcp(cut)}
            hint={`${hostPct}% of pot`}
            emphasis
            prize
          />
          <PayoutTile
            label="Prize pool"
            value={formatIcp(prize)}
            hint="After host fee"
          />
          <PayoutTile
            label="On finalize"
            value={isHost ? "Pay + rake" : "Winners paid"}
            hint="Escrow release"
          />
        </SimpleGrid>
        <Text fontSize="xs" color="fg.muted" mt="phi3" lineHeight="1.5">
          Host cut is taken from the entry pot on finalize. Betable volume share
          (if any) is separate policy payout to the market winner path.
        </Text>
      </Box>
    </Box>
  );
}

function PayoutTile({
  label,
  value,
  hint,
  emphasis,
  prize,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
  prize?: boolean;
}) {
  return (
    <Box
      p="phi3"
      borderRadius="xl"
      borderWidth="1px"
      borderColor={prize ? "prize.solid" : emphasis ? "border.brand" : "border.default"}
      bg={prize ? "prize.muted" : "blackAlpha.600"}
      minH="5.5rem"
    >
      <Text
        fontSize="2xs"
        color="fg.subtle"
        fontFamily="heading"
        fontWeight="bold"
        letterSpacing="0.1em"
        textTransform="uppercase"
        mb="1"
      >
        {label}
      </Text>
      <Text
        fontFamily="heading"
        fontWeight="extrabold"
        fontSize={emphasis || prize ? "xl" : "md"}
        className={prize ? "gh-text-prize" : undefined}
        lineHeight="1.15"
      >
        {value}
      </Text>
      {hint ? (
        <Text fontSize="2xs" color="fg.muted" mt="1">
          {hint}
        </Text>
      ) : null}
    </Box>
  );
}
