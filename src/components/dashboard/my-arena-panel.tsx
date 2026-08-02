"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Box, Flex, Grid, HStack, Text, VStack } from "@chakra-ui/react";
import {
  ChartCandlestick,
  ChevronDown,
  ChevronUp,
  Eye,
  Flame,
  Gavel,
  Gamepad2,
  Snowflake,
  Swords,
  Trophy,
  Wallet,
} from "lucide-react";
import {
  GhAvatar,
  GhBadge,
  GhEmptyState,
  GhSpinner,
  GhTabs,
} from "@/components/ui";
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
import type { ChallengeDetail } from "@/lib/challenges";
import type { TournamentDetail } from "@/lib/tournaments";
import { getSupabase } from "@/lib/supabase/client";
import { GH_TABLES } from "@/lib/supabase/tables";
import { useGhEventStream } from "@/hooks/use-gh-event-stream";

const STORAGE_KEY = "gh_my_arena_expanded";

/**
 * My Arena — live stats from canister + activity from challenges/tournaments/markets.
 * Heads-up list refreshes on Supabase `gh_challenges` Realtime (accept/score/etc.).
 */
export function MyArenaPanel({ user }: { user: ChatUser }) {
  const { principal, profile, identity } = useSession();
  const [expanded, setExpanded] = useState(true);
  const [stats, setStats] = useState<ArenaStats | null>(null);
  const [headsUp, setHeadsUp] = useState<ChallengeDetail[]>([]);
  const [registered, setRegistered] = useState<TournamentDetail[]>([]);
  const [monitor, setMonitor] = useState<ChallengeDetail[]>([]);
  const [marketsCount, setMarketsCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
          c.creator.username === address ||
          c.opponent?.username === address;
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

  // Realtime: any challenge mirror change → quiet re-list (P1/P2 accept, score, …)
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
            <GhAvatar name={user.username} size="lg" src={user.avatarUrl} tone="brand" />
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
                  size="sm"
                  tone="brand"
                  defaultValue="1v1"
                  items={[
                    {
                      value: "1v1",
                      label: `1v1 (${headsUp.length})`,
                      icon: <Swords size={12} />,
                      content: (
                        <ActivityList
                          empty="No active heads-up challenges"
                          items={headsUp.map((c) => ({
                            id: c.id,
                            href: `/challenges/${c.id}`,
                            title: c.title,
                            meta: `${c.game} · ${c.status}`,
                          }))}
                        />
                      ),
                    },
                    {
                      value: "tourney",
                      label: `Tourneys (${registered.length})`,
                      icon: <Trophy size={12} />,
                      content: (
                        <ActivityList
                          empty="No registered tournaments"
                          items={registered.map((t) => ({
                            id: t.id,
                            href: `/tournaments/${t.id}`,
                            title: t.title,
                            meta: `${t.game} · ${t.status}`,
                          }))}
                        />
                      ),
                    },
                    {
                      value: "monitor",
                      label: `Monitor (${monitor.length})`,
                      icon: <Eye size={12} />,
                      content: (
                        <ActivityList
                          empty="No monitor assignments"
                          items={monitor.map((c) => ({
                            id: c.id,
                            href: `/challenges/${c.id}`,
                            title: c.title,
                            meta: `Monitor · ${c.status}`,
                          }))}
                        />
                      ),
                    },
                    {
                      value: "markets",
                      label: `Markets (${marketsCount})`,
                      icon: <ChartCandlestick size={12} />,
                      content: (
                        <Box py="phi2">
                          <Text fontSize="sm" color="fg.muted" mb="2">
                            {marketsCount
                              ? `${marketsCount} wager row(s) on gh_market_wagers`
                              : "No positions yet — open a betable market from a match."}
                          </Text>
                          <Link href="/markets">
                            <Text fontSize="sm" color="prize.fg" fontWeight="bold">
                              Browse markets →
                            </Text>
                          </Link>
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
        <Text fontSize="2xs" fontFamily="heading" fontWeight="bold" textTransform="uppercase">
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

function ActivityList({
  empty,
  items,
}: {
  empty: string;
  items: { id: string; href: string; title: string; meta: string }[];
}) {
  if (!items.length) {
    return (
      <GhEmptyState icon={Gavel} title={empty} description="Live when you play." />
    );
  }
  return (
    <VStack align="stretch" gap="2" py="phi2">
      {items.map((it) => (
        <Link key={it.id} href={it.href} style={{ textDecoration: "none" }}>
          <Box
            p="phi2"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="border.default"
            _hover={{ borderColor: "border.brand" }}
          >
            <Text fontFamily="heading" fontWeight="bold" fontSize="sm">
              {it.title}
            </Text>
            <Text fontSize="2xs" color="fg.subtle">
              {it.meta}
            </Text>
          </Box>
        </Link>
      ))}
    </VStack>
  );
}
