"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Box, Flex, Grid, HStack, Text, VStack } from "@chakra-ui/react";
import {
  ArrowRight,
  ChartCandlestick,
  ChevronDown,
  ChevronUp,
  Eye,
  Flame,
  Gamepad2,
  Snowflake,
  Swords,
  Trophy,
  Wallet,
} from "lucide-react";
import {
  GhAvatar,
  GhBadge,
  GhButton,
  GhEmptyState,
  GhSpinner,
  GhTabs,
} from "@/components/ui";
import { MatchCard } from "@/components/cards/match-card";
import type { ChatUser } from "@/lib/chat/types";
import {
  loadArenaStats,
  overallRecord,
  type ArenaStats,
} from "@/lib/ic/gamer-service";
import { listChallenges } from "@/lib/ic/challenge-service";
import { listTournaments } from "@/lib/ic/tournament-service";
import { isCanisterConfigured } from "@/lib/ic/canisters";
import { useSession } from "@/components/providers/session-context";
import {
  canAcceptChallenge,
  challengeHref,
  formatIcp,
  formatWhen,
  type ChallengeDetail,
} from "@/lib/challenges";
import { AcceptChallengeModal } from "@/components/challenges/accept-challenge-modal";
import {
  filledLabel,
  formatIcp as formatTournamentIcp,
  formatWhen as formatTournamentWhen,
  isGroupPotTournament,
  tournamentKindLabel,
  type TournamentDetail,
} from "@/lib/tournaments";
import { tournamentHref } from "@/lib/deep-links";
import { getSupabase } from "@/lib/supabase/client";
import { GH_TABLES } from "@/lib/supabase/tables";
import { useGhEventStream } from "@/hooks/use-gh-event-stream";

function challengeMatchStatus(
  status: ChallengeDetail["status"],
): "open" | "live" | "settled" | "disputed" {
  if (status === "live") return "live";
  if (status === "settled") return "settled";
  if (status === "disputed") return "disputed";
  return "open";
}

function tournamentMatchStatus(
  status: TournamentDetail["status"],
): "open" | "live" | "settled" | "disputed" {
  if (status === "live") return "live";
  if (status === "settled") return "settled";
  if (status === "cancelled") return "disputed";
  return "open";
}

const STORAGE_KEY = "gh_my_arena_expanded";

/**
 * My Arena — live stats from canister + activity from challenges/tournaments/markets.
 * Heads-up list refreshes on Supabase `gh_challenges` Realtime (accept/score/etc.).
 */
export function MyArenaPanel({ user }: { user: ChatUser }) {
  const { principal, profile, identity, isLoggedIn, login } = useSession();
  const [expanded, setExpanded] = useState(true);
  const [stats, setStats] = useState<ArenaStats | null>(null);
  const [headsUp, setHeadsUp] = useState<ChallengeDetail[]>([]);
  const [registered, setRegistered] = useState<TournamentDetail[]>([]);
  const [monitor, setMonitor] = useState<ChallengeDetail[]>([]);
  const [marketsCount, setMarketsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [acceptTarget, setAcceptTarget] = useState<ChallengeDetail | null>(
    null,
  );

  const address = principal || user.principal || user.id || user.username;
  const who = profile?.username || user.username;

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v === "0") setExpanded(false);
      if (v === "1") setExpanded(true);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshArena = useCallback(
    async (opts?: { quiet?: boolean }) => {
      if (!opts?.quiet) setLoading(true);
      try {
        const [s, challenges, tournaments] = await Promise.all([
          loadArenaStats(address, identity),
          isCanisterConfigured()
            ? listChallenges(identity).catch(() => [] as ChallengeDetail[])
            : Promise.resolve([] as ChallengeDetail[]),
          isCanisterConfigured()
            ? listTournaments(identity).catch(() => [] as TournamentDetail[])
            : Promise.resolve([] as TournamentDetail[]),
        ]);
        setStats(s);
        const mine = (c: ChallengeDetail) =>
          c.creator.username === who ||
          c.opponent?.username === who ||
          c.invitedUsername === who ||
          c.creator.username === address ||
          c.opponent?.username === address ||
          c.invitedUsername === address;
        const myHu = challenges.filter(mine);
        setHeadsUp(
          myHu.filter(
            (c) =>
              c.status === "open" ||
              c.status === "live" ||
              c.status === "accepted",
          ),
        );
        setMonitor(
          challenges.filter(
            (c) =>
              c.monitorUsername === who &&
              (c.status === "open" ||
                c.status === "live" ||
                c.status === "accepted"),
          ),
        );
        setRegistered(
          tournaments.filter(
            (t) =>
              t.hostUsername === who ||
              t.hostUsername === address ||
              t.entrants.some((e) => e.username === who),
          ),
        );
        const sb = getSupabase();
        if (sb && address) {
          const { count } = await sb
            .from(GH_TABLES.marketWagers)
            .select("id", { count: "exact", head: true })
            .eq("principal", address);
          setMarketsCount(count ?? 0);
        }
      } finally {
        if (!opts?.quiet) setLoading(false);
      }
    },
    [address, who, identity],
  );

  useEffect(() => {
    void refreshArena();
  }, [refreshArena]);

  useGhEventStream({
    channel: `gh-my-arena-challenges-${address || "anon"}`,
    table: GH_TABLES.challenges,
    enabled: Boolean(address),
    onChange: () => {
      void refreshArena({ quiet: true });
    },
  });

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const s = stats ?? {
    subaccountIcp: 0,
    headsUp: { wins: 0, losses: 0 },
    tournament: { wins: 0, losses: 0 },
    winStreak: 0,
    lossStreak: 0,
    bestWinStreak: 0,
  };
  const overall = overallRecord(s);
  const activeStreak =
    s.winStreak > 0
      ? { type: "win" as const, n: s.winStreak }
      : s.lossStreak > 0
        ? { type: "loss" as const, n: s.lossStreak }
        : { type: "even" as const, n: 0 };

  return (
    <Box
      position="relative"
      borderRadius="3xl"
      borderWidth="1px"
      borderColor="border.brand"
      overflow="hidden"
      boxShadow="glow"
      bg="bg.glass"
      backdropFilter="blur(20px)"
    >
      <Box
        position="absolute"
        inset="0"
        backgroundImage="
          radial-gradient(ellipse 60% 80% at 0% 0%, rgba(163,255,61,0.16), transparent 55%),
          radial-gradient(ellipse 50% 60% at 100% 100%, rgba(244,63,168,0.12), transparent 50%),
          linear-gradient(135deg, rgba(26,23,48,0.35) 0%, rgba(22,19,42,0.2) 100%)
        "
        pointerEvents="none"
      />
      <Box position="relative" p={{ base: "phi4", md: "phi5" }}>
        <Flex justify="space-between" align="center" gap="phi3" flexWrap="wrap">
          <HStack gap="phi3">
            <GhAvatar
              name={user.username}
              size="lg"
              src={user.avatarUrl}
              tone="brand"
            />
            <Box>
              <Text
                fontFamily="heading"
                fontSize="2xs"
                fontWeight="bold"
                letterSpacing="0.12em"
                textTransform="uppercase"
                color="brand.fg"
              >
                My arena
              </Text>
              <Text fontFamily="heading" fontWeight="extrabold" fontSize="xl">
                @{user.username}
              </Text>
            </Box>
          </HStack>
          <Box
            as="button"
            onClick={toggle}
            display="flex"
            alignItems="center"
            gap="1"
            px="3"
            py="1.5"
            borderRadius="full"
            borderWidth="1px"
            borderColor="border.brand"
            bg="brand.muted"
            color="brand.fg"
            cursor="pointer"
            fontSize="xs"
            fontFamily="heading"
            fontWeight="bold"
            _hover={{ filter: "brightness(1.08)" }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? "Collapse" : "Expand"}
          </Box>
        </Flex>

        {expanded ? (
          loading ? (
            <VStack py="phi4">
              <GhSpinner />
            </VStack>
          ) : (
            <>
              <Grid
                templateColumns={{ base: "1fr 1fr", md: "repeat(4, 1fr)" }}
                gap="phi3"
                mt="phi4"
              >
                <StatTile
                  icon={<Wallet size={14} />}
                  label="Play subaccount"
                  value={`${s.subaccountIcp.toFixed(2)} ICP`}
                  hint="Ledger when wired"
                />
                <StatTile
                  icon={<Swords size={14} />}
                  label="Heads-up"
                  value={`${s.headsUp.wins}–${s.headsUp.losses}`}
                />
                <StatTile
                  icon={<Trophy size={14} />}
                  label="Tournament"
                  value={`${s.tournament.wins}–${s.tournament.losses}`}
                />
                <StatTile
                  icon={
                    activeStreak.type === "win" ? (
                      <Flame size={14} />
                    ) : activeStreak.type === "loss" ? (
                      <Snowflake size={14} />
                    ) : (
                      <Gamepad2 size={14} />
                    )
                  }
                  label="Streak"
                  value={
                    activeStreak.n
                      ? `${activeStreak.n} ${activeStreak.type}`
                      : "Even"
                  }
                  hint={`Best ${s.bestWinStreak}`}
                />
              </Grid>
              <Text fontSize="xs" color="fg.subtle" mt="phi2">
                Overall {overall.label}
              </Text>

              <Box mt="phi4">
                <GhTabs
                  size="md"
                  tone="brand"
                  defaultValue="1v1"
                  items={[
                    {
                      value: "1v1",
                      label: `1v1 (${headsUp.length})`,
                      icon: <Swords size={14} />,
                      content: (
                        <ChallengeActivityList
                          empty="No active heads-up challenges"
                          emptyHint="Create a 1v1 from the challenge panel."
                          items={headsUp}
                          viewer={who}
                          principal={address}
                          mode="player"
                          onAccept={(c) => setAcceptTarget(c)}
                          isLoggedIn={isLoggedIn}
                          onLogin={() => void login()}
                        />
                      ),
                    },
                    {
                      value: "tourney",
                      label: `Tourneys (${registered.length})`,
                      icon: <Trophy size={14} />,
                      content: (
                        <TournamentActivityList
                          empty="No registered tournaments"
                          emptyHint="Join or host a tournament from Host."
                          items={registered}
                          viewer={who}
                        />
                      ),
                    },
                    {
                      value: "monitor",
                      label: `Monitor (${monitor.length})`,
                      icon: <Eye size={14} />,
                      content: (
                        <ChallengeActivityList
                          empty="No monitor assignments"
                          emptyHint="When you are named as monitor, matches show here."
                          items={monitor}
                          viewer={who}
                          principal={address}
                          mode="monitor"
                          onAccept={(c) => setAcceptTarget(c)}
                          isLoggedIn={isLoggedIn}
                          onLogin={() => void login()}
                        />
                      ),
                    },
                    {
                      value: "markets",
                      label: `Markets (${marketsCount})`,
                      icon: <ChartCandlestick size={14} />,
                      content: (
                        <Box py="phi3">
                          <Box
                            p={{ base: "phi4", md: "phi5" }}
                            borderRadius="2xl"
                            borderWidth="1px"
                            borderColor="border.default"
                            bg="whiteAlpha.100"
                            textAlign="center"
                            maxW="28rem"
                            mx="auto"
                          >
                            <Box
                              w="12"
                              h="12"
                              borderRadius="xl"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              bg="prize.muted"
                              color="prize.fg"
                              borderWidth="1px"
                              borderColor="prize.solid"
                              mx="auto"
                              mb="phi3"
                            >
                              <ChartCandlestick size={22} />
                            </Box>
                            <Text
                              fontFamily="heading"
                              fontWeight="extrabold"
                              fontSize="lg"
                              mb="1"
                            >
                              {marketsCount
                                ? `${marketsCount} open position${marketsCount === 1 ? "" : "s"}`
                                : "No market positions"}
                            </Text>
                            <Text fontSize="md" color="fg.muted" mb="phi3" lineHeight="1.5">
                              {marketsCount
                                ? "Your wagers on active betable markets."
                                : "Open a betable market from a match when live."}
                            </Text>
                            <Link href="/markets" style={{ textDecoration: "none" }}>
                              <Text
                                fontSize="md"
                                color="prize.fg"
                                fontWeight="extrabold"
                                fontFamily="heading"
                              >
                                Browse markets →
                              </Text>
                            </Link>
                          </Box>
                        </Box>
                      ),
                    },
                  ]}
                />
              </Box>
            </>
          )
        ) : null}
      </Box>

      <AcceptChallengeModal
        challenge={acceptTarget}
        open={Boolean(acceptTarget)}
        onClose={() => setAcceptTarget(null)}
        onAccepted={() => void refreshArena({ quiet: true })}
      />
    </Box>
  );
}

function StatTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Box
      p="phi3"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      bg="whiteAlpha.100"
      backdropFilter="blur(8px)"
    >
      <HStack gap="1" color="brand.fg" mb="1">
        {icon}
        <Text
          fontSize="2xs"
          fontFamily="heading"
          fontWeight="bold"
          textTransform="uppercase"
        >
          {label}
        </Text>
      </HStack>
      <Text fontFamily="heading" fontWeight="extrabold" fontSize="md">
        {value}
      </Text>
      {hint ? (
        <Text fontSize="2xs" color="fg.subtle">
          {hint}
        </Text>
      ) : null}
    </Box>
  );
}

function ActivityGrid({ children }: { children: ReactNode }) {
  return (
    <Grid
      templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" }}
      gap="phi3"
      py="phi3"
      w="100%"
      alignItems="stretch"
    >
      {children}
    </Grid>
  );
}

function ChallengeActivityList({
  empty,
  emptyHint,
  items,
  viewer,
  principal,
  mode,
  onAccept,
  isLoggedIn,
  onLogin,
}: {
  empty: string;
  emptyHint: string;
  items: ChallengeDetail[];
  viewer: string;
  principal?: string;
  mode: "player" | "monitor";
  onAccept?: (c: ChallengeDetail) => void;
  isLoggedIn?: boolean;
  onLogin?: () => void;
}) {
  if (!items.length) {
    return (
      <GhEmptyState
        icon={mode === "monitor" ? Eye : Swords}
        title={empty}
        description={emptyHint}
      />
    );
  }
  return (
    <ActivityGrid>
      {items.map((c) => {
        const canAccept = canAcceptChallenge(c, viewer, principal);
        return (
          <Box
            key={c.id}
            display="flex"
            flexDirection="column"
            h="100%"
            position="relative"
          >
            {mode === "monitor" ? (
              <GhBadge
                tone="attr"
                position="absolute"
                top="2"
                right="2"
                zIndex={2}
                fontSize="2xs"
              >
                Monitor
              </GhBadge>
            ) : null}
            <Box flex="1" minH="0">
              <MatchCard
                kind="challenge"
                title={c.title}
                game={c.game}
                console={c.console}
                stake={formatIcp(c.entryFeeIcp)}
                status={challengeMatchStatus(c.status)}
                players={c.opponent ? "2/2" : "1/2"}
                username={c.creator.username}
                challengers={[
                  {
                    username: c.creator.username,
                    avatarUrl: c.creator.avatarUrl,
                    record: c.creator.record,
                  },
                  ...(c.opponent
                    ? [
                        {
                          username: c.opponent.username,
                          avatarUrl: c.opponent.avatarUrl,
                          record: c.opponent.record,
                        },
                      ]
                    : c.invitedUsername
                      ? [{ username: c.invitedUsername }]
                      : []),
                ]}
                seats={2}
                betable={c.betable}
                market={
                  c.betable && c.marketId
                    ? {
                        id: c.marketId,
                        category: "esports" as const,
                        label: "Moneyline",
                      }
                    : undefined
                }
                meta={
                  mode === "monitor"
                    ? `Monitor · ${formatWhen(c.scheduledAt)}`
                    : formatWhen(c.scheduledAt)
                }
                ctaLabel={canAccept ? "Accept 1v1" : "Open match"}
                onCtaClick={() => {
                  if (!isLoggedIn) {
                    onLogin?.();
                    return;
                  }
                  if (canAccept && onAccept) {
                    onAccept(c);
                  } else {
                    window.location.assign(challengeHref(c.id));
                  }
                }}
              />
            </Box>
            <Link href={challengeHref(c.id)} style={{ marginTop: "0.5rem" }}>
              <GhButton
                size="sm"
                variant="outline"
                w="100%"
                rightIcon={<ArrowRight size={14} />}
              >
                Open challenge
              </GhButton>
            </Link>
          </Box>
        );
      })}
    </ActivityGrid>
  );
}

function TournamentActivityList({
  empty,
  emptyHint,
  items,
  viewer,
}: {
  empty: string;
  emptyHint: string;
  items: TournamentDetail[];
  viewer: string;
}) {
  if (!items.length) {
    return (
      <GhEmptyState icon={Trophy} title={empty} description={emptyHint} />
    );
  }
  return (
    <ActivityGrid>
      {items.map((t) => {
        const group = isGroupPotTournament(t);
        const isHost = t.hostUsername === viewer;
        return (
          <Box
            key={t.id}
            display="flex"
            flexDirection="column"
            h="100%"
            position="relative"
          >
            {isHost ? (
              <GhBadge
                tone="attr"
                position="absolute"
                top="2"
                right="2"
                zIndex={2}
                fontSize="2xs"
              >
                Host
              </GhBadge>
            ) : null}
            <Box flex="1" minH="0">
              <MatchCard
                kind={group ? "room" : "tournament"}
                title={t.title}
                game={t.game}
                console={t.console}
                entryFee={formatTournamentIcp(t.entryFeeIcp)}
                prizePot={
                  t.prizePotIcp != null
                    ? formatTournamentIcp(t.prizePotIcp)
                    : undefined
                }
                status={tournamentMatchStatus(t.status)}
                players={filledLabel(t)}
                meta={`${tournamentKindLabel(t)} · ${t.format} · ${formatTournamentWhen(t.scheduledAt)}`}
                hostEarn={`${t.hostFeePct}% host · ${t.hostUsername}`}
                username={t.hostUsername}
                betable={t.betable}
                market={
                  t.betable && t.marketId
                    ? {
                        id: t.marketId,
                        category: "esports" as const,
                        label: `Winner · ${t.title.slice(0, 18)}`,
                      }
                    : undefined
                }
              />
            </Box>
            <Link href={tournamentHref(t.id)} style={{ marginTop: "0.5rem" }}>
              <GhButton
                size="sm"
                variant="prize"
                w="100%"
                rightIcon={<ArrowRight size={14} />}
              >
                Open tournament
              </GhButton>
            </Link>
          </Box>
        );
      })}
    </ActivityGrid>
  );
}
