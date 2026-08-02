"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  ArrowUpDown,
  Hash,
  MessageCircle,
  Search,
  Swords,
  Trophy,
  User,
  Users,
  Wifi,
  Plus,
  Calendar,
  Gamepad2,
  ChartCandlestick,
  Joystick,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  GhAvatar,
  GhBadge,
  GhButton,
  GhEmptyState,
  GhInput,
  GhInputShell,
  GhSpinner,
  GhSurface,
  GhTooltip,
  SectionDivider,
  ghToast,
} from "@/components/ui";
import { MatchCard } from "@/components/cards/match-card";
import { LiveTicker } from "@/components/spectacle/live-ticker";
import { useSession } from "@/components/providers/session-context";
import { useChat } from "@/components/chat/chat-context";
import type { ChatUser } from "@/lib/chat/types";
import { chatBackendLabel } from "@/lib/chat/chat-service";
import { ChallengeQuickForm } from "./challenge-quick-form";
import { MyArenaPanel } from "./my-arena-panel";
import { MyMarketsSection } from "./my-markets-section";
import {
  GameFilterBar,
  collectGamesFromRooms,
  collectGamesFromUsers,
  roomMatchesGame,
  sortRoomsByGameFilter,
  sortUsersByGameFilter,
  userMatchesGame,
  type GameFilterValue,
} from "./game-filter-bar";
import { listTournaments } from "@/lib/ic/tournament-service";
import type { TournamentDetail } from "@/lib/tournaments";
import {
  filledLabel,
  formatIcp,
  formatWhen,
  tournamentKindLabel,
} from "@/lib/tournaments";
import { listRoomsFromCanister, listRoomsFromMirror } from "@/lib/ic/room-service";
import type { EsportsRoom } from "@/lib/rooms";
import { listDiscoveryUsers } from "@/lib/ic/gamer-service";
import { startPresenceHeartbeat } from "@/lib/ic/presence-service";
import { isCanisterConfigured } from "@/lib/ic/canisters";
import { useGhEventStream } from "@/hooks/use-gh-event-stream";
import { GH_TABLES } from "@/lib/supabase/tables";

type SortKey = "date" | "game" | "title" | "pot";

const QUICK_LINKS = [
  {
    href: "/challenges",
    icon: Swords,
    t: "Heads-up",
    d: "1v1 escrow matches",
    tone: "brand" as const,
  },
  {
    href: "/create?type=tournament",
    icon: Trophy,
    t: "Host bracket",
    d: "Entry fees · host cut",
    tone: "prize" as const,
  },
  {
    href: "/rooms",
    icon: Hash,
    t: "Rooms",
    d: "Lobbies & chat",
    tone: "live" as const,
  },
  {
    href: "/arcade",
    icon: Joystick,
    t: "Arcade",
    d: "High-score banks",
    tone: "attr" as const,
  },
  {
    href: "/markets",
    icon: ChartCandlestick,
    t: "Markets",
    d: "Spectator books",
    tone: "prize" as const,
  },
  {
    href: "/moderator",
    icon: Users,
    t: "Monitor",
    d: "Watch · earn fees",
    tone: "live" as const,
  },
] as const;

function toneBg(tone: "brand" | "prize" | "live" | "attr") {
  if (tone === "prize") return { bg: "prize.muted", color: "prize.fg", border: "prize.solid" };
  if (tone === "live") return { bg: "live.muted", color: "live.fg", border: "live.solid" };
  if (tone === "attr") return { bg: "attr.muted", color: "attr.fg", border: "attr.solid" };
  return { bg: "brand.muted", color: "brand.fg", border: "border.brand" };
}

/**
 * Logged-in discovery dashboard — home-inspired light glass layout.
 */
export function DashboardView() {
  const { isLoggedIn, user, login, principal, profile } = useSession();
  const { openDm, openRoom } = useChat();
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeTarget, setChallengeTarget] = useState<ChatUser | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [onlineGame, setOnlineGame] = useState<GameFilterValue>("all");
  const [roomGame, setRoomGame] = useState<GameFilterValue>("all");

  const [online, setOnline] = useState<ChatUser[]>([]);
  const [rooms, setRooms] = useState<EsportsRoom[]>([]);
  const [tournaments, setTournaments] = useState<TournamentDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const myGames = user?.games ?? profile?.games ?? [];
  const displayName = profile?.username || user?.username || "gamer";

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [users, roomList, tourneys] = await Promise.all([
        listDiscoveryUsers(),
        (async () => {
          if (isCanisterConfigured()) {
            const fromCanister = await listRoomsFromCanister();
            if (fromCanister.length) return fromCanister;
          }
          return listRoomsFromMirror();
        })(),
        isCanisterConfigured()
          ? listTournaments().catch(() => [] as TournamentDetail[])
          : Promise.resolve([] as TournamentDetail[]),
      ]);
      setOnline(users);
      setRooms(roomList);
      setTournaments(tourneys);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!isLoggedIn) return;
    return startPresenceHeartbeat(() => {
      const p = principal || user?.id;
      const name = profile?.username || user?.username || p;
      if (!p || !name) return null;
      return { principal: p, username: name, game: user?.game };
    });
  }, [isLoggedIn, principal, profile?.username, user]);

  useGhEventStream({
    channel: "gh-dashboard-rooms",
    table: GH_TABLES.rooms,
    onChange: () => {
      void listRoomsFromMirror().then(setRooms);
    },
  });
  useGhEventStream({
    channel: "gh-dashboard-presence",
    table: GH_TABLES.presence,
    onChange: () => {
      void listDiscoveryUsers().then(setOnline);
    },
  });
  useGhEventStream({
    channel: "gh-dashboard-tournaments",
    table: GH_TABLES.tournaments,
    onChange: () => {
      if (isCanisterConfigured()) void listTournaments().then(setTournaments);
    },
  });

  const onlineGameOptions = useMemo(
    () => collectGamesFromUsers(online),
    [online],
  );
  const roomGameOptions = useMemo(
    () => collectGamesFromRooms(rooms.map((r) => ({ game: r.game }))),
    [rooms],
  );

  const filteredOnline = useMemo(() => {
    const base =
      onlineGame === "all"
        ? online
        : online.filter((u) => userMatchesGame(u, onlineGame));
    return sortUsersByGameFilter(base, onlineGame, myGames);
  }, [online, onlineGame, myGames]);

  const filteredRooms = useMemo(() => {
    const summaries = rooms.map((r) => ({
      id: r.id,
      name: r.name,
      topic: r.topic,
      members: r.membersCount,
      live: r.live,
      game: r.game,
    }));
    const base =
      roomGame === "all"
        ? summaries
        : summaries.filter((r) => roomMatchesGame(r, roomGame));
    return sortRoomsByGameFilter(base, roomGame, myGames);
  }, [rooms, roomGame, myGames]);

  const filteredTournaments = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...tournaments];
    if (q) {
      list = list.filter((t) => {
        const hay = [t.title, t.game, t.hostUsername, t.console, String(t.entryFeeIcp)]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date") {
        cmp =
          new Date(a.scheduledAt || a.createdAt).getTime() -
          new Date(b.scheduledAt || b.createdAt).getTime();
      } else if (sortBy === "game") {
        cmp = a.game.localeCompare(b.game);
      } else if (sortBy === "title") {
        cmp = a.title.localeCompare(b.title);
      } else {
        cmp = (a.prizePotIcp ?? 0) - (b.prizePotIcp ?? 0);
      }
      return cmp * dir;
    });
    return list;
  }, [tournaments, query, sortBy, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const liveRooms = rooms.filter((r) => r.live).length;
  const openTourneys = tournaments.filter(
    (t) => t.status === "open" || t.status === "checkin",
  ).length;

  if (!isLoggedIn) {
    return (
      <VStack py="phi8" gap="phi4" align="stretch">
        <Box
          borderRadius="3xl"
          borderWidth="1px"
          borderColor="border.brand"
          overflow="hidden"
          position="relative"
          p={{ base: "phi5", md: "phi6" }}
          bg="bg.glass"
          backdropFilter="blur(20px)"
          boxShadow="glow"
        >
          <Box
            position="absolute"
            inset="0"
            opacity={0.9}
            backgroundImage="
              radial-gradient(ellipse 70% 80% at 10% 20%, rgba(163,255,61,0.16), transparent 55%),
              radial-gradient(ellipse 50% 60% at 90% 80%, rgba(244,63,168,0.12), transparent 50%)
            "
            pointerEvents="none"
          />
          <VStack align="flex-start" gap="phi3" position="relative" maxW="28rem">
            <GhBadge tone="brand" pulse>
              <Sparkles size={11} /> Discovery
            </GhBadge>
            <Heading
              fontFamily="heading"
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="extrabold"
            >
              Sign in to open your arena
            </Heading>
            <Text color="fg.muted" fontSize="sm" lineHeight="1.6">
              Online users, rooms, tournaments, and your arena load from the
              canister + Supabase when you connect Internet Identity.
            </Text>
            <GhButton variant="primary" size="lg" onClick={() => void login()}>
              Connect wallet
            </GhButton>
          </VStack>
        </Box>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" gap="0" className="gh-stack-phi-lg" pb="phi5">
      {/* ── Welcome hero (home-inspired glow) ── */}
      <Box
        className="gh-home-section"
        position="relative"
        borderRadius={{ base: "2xl", md: "3xl" }}
        borderWidth="1px"
        borderColor="border.default"
        overflow="hidden"
        bg="bg.glass"
        backdropFilter="blur(20px)"
        boxShadow="card"
      >
        <Box
          position="absolute"
          inset="0"
          backgroundImage="
            radial-gradient(ellipse 55% 70% at 0% 0%, rgba(163,255,61,0.14), transparent 55%),
            radial-gradient(ellipse 45% 55% at 100% 100%, rgba(139,92,246,0.14), transparent 50%),
            radial-gradient(ellipse 40% 50% at 70% 10%, rgba(244,63,168,0.08), transparent 45%)
          "
          pointerEvents="none"
        />
        <Flex
          position="relative"
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ md: "center" }}
          gap="phi4"
          p={{ base: "phi4", md: "phi5" }}
        >
          <Box minW="0">
            <HStack gap="2" mb="phi2" flexWrap="wrap">
              <GhBadge tone="brand">Dashboard</GhBadge>
              <GhBadge tone="muted">{chatBackendLabel()}</GhBadge>
              <GhBadge tone={isCanisterConfigured() ? "live" : "muted"}>
                {isCanisterConfigured() ? "Canister live" : "Canister offline"}
              </GhBadge>
            </HStack>
            <Heading
              as="h1"
              fontFamily="heading"
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="extrabold"
              letterSpacing="0.02em"
              lineHeight="1.15"
            >
              Welcome back,{" "}
              <Text as="span" className="gh-text-brand">
                @{displayName}
              </Text>
            </Heading>
            <Text fontSize="sm" color="fg.muted" mt="phi2" maxW="32rem" lineHeight="1.55">
              Discover brackets, lobbies, and opponents — create challenges
              in-page, host events, and jump into live rooms.
            </Text>
            <HStack gap="2" mt="phi3" flexWrap="wrap">
              <GhBadge tone="prize">
                <Trophy size={11} /> {filteredTournaments.length} brackets
              </GhBadge>
              <GhBadge tone="live">
                <Hash size={11} /> {rooms.length} rooms
                {liveRooms > 0 ? ` · ${liveRooms} live` : ""}
              </GhBadge>
              <GhBadge tone="brand">
                <Wifi size={11} /> {filteredOnline.length} online
              </GhBadge>
              {openTourneys > 0 ? (
                <GhBadge tone="muted">{openTourneys} open reg</GhBadge>
              ) : null}
            </HStack>
          </Box>
          <HStack gap="2" flexShrink={0} flexWrap="wrap">
            <GhButton
              size="sm"
              variant="outline"
              leftIcon={<RefreshCw size={14} />}
              onClick={() => void reload()}
            >
              Refresh
            </GhButton>
            <GhButton
              size="sm"
              variant="primary"
              leftIcon={<Plus size={14} />}
              onClick={() => {
                setChallengeTarget(null);
                setChallengeOpen(true);
                document
                  .getElementById("gh-challenge-create-panel")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Challenge
            </GhButton>
            <Link href="/create?type=tournament">
              <GhButton size="sm" variant="prize" leftIcon={<Trophy size={14} />}>
                Host
              </GhButton>
            </Link>
          </HStack>
        </Flex>
      </Box>

      {/* ── Quick links strip (home value-strip pattern) ── */}
      <Box
        className="gh-home-section"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="border.default"
        bg="bg.glass"
        backdropFilter="blur(16px)"
        overflow="hidden"
      >
        <Grid
          templateColumns={{
            base: "1fr",
            sm: "1fr 1fr",
            lg: "repeat(3, 1fr)",
            xl: "repeat(6, 1fr)",
          }}
        >
          {QUICK_LINKS.map(({ href, icon: Icon, t, d, tone }, i) => {
            const c = toneBg(tone);
            return (
              <Link key={t} href={href} style={{ textDecoration: "none" }}>
                <Flex
                  gap="phi2"
                  p="phi3"
                  align="flex-start"
                  h="100%"
                  borderTopWidth={{ base: i > 0 ? "1px" : "0", sm: "0" }}
                  borderLeftWidth={{
                    base: "0",
                    sm: i % 2 === 1 ? "1px" : "0",
                    lg: i % 3 !== 0 ? "1px" : "0",
                    xl: i > 0 ? "1px" : "0",
                  }}
                  borderColor="border.default"
                  transition="background 0.15s"
                  _hover={{ bg: "whiteAlpha.50" }}
                >
                  <Box
                    w="9"
                    h="9"
                    borderRadius="xl"
                    bg={c.bg}
                    color={c.color}
                    borderWidth="1px"
                    borderColor={c.border}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <Icon size={16} strokeWidth={2} />
                  </Box>
                  <Box minW="0">
                    <Text
                      fontFamily="heading"
                      fontWeight="bold"
                      fontSize="sm"
                      letterSpacing="0.02em"
                    >
                      {t}
                    </Text>
                    <Text fontSize="xs" color="fg.muted" mt="1" lineHeight="1.45">
                      {d}
                    </Text>
                  </Box>
                </Flex>
              </Link>
            );
          })}
        </Grid>
      </Box>

      <Box className="gh-home-section">
        <LiveTicker label="Arena" />
      </Box>

      {/* ── My arena ── */}
      <Box className="gh-home-section">{user ? <MyArenaPanel user={user} /> : null}</Box>

      {loading ? (
        <VStack py="phi6" gap="2" className="gh-home-section">
          <GhSpinner />
          <Text fontSize="sm" color="fg.muted">
            Loading live discovery…
          </Text>
        </VStack>
      ) : (
        <Grid
          className="gh-home-section"
          templateColumns={{ base: "1fr", lg: "1fr minmax(17rem, 20rem)" }}
          gap={{ base: "phi5", lg: "phi5" }}
          alignItems="start"
        >
          <VStack align="stretch" gap="phi5">
            {/* Tournaments */}
            <Box
              borderRadius="2xl"
              borderWidth="1px"
              borderColor="border.default"
              bg="bg.glass"
              backdropFilter="blur(16px)"
              p={{ base: "phi3", md: "phi4" }}
            >
              <Flex
                justify="space-between"
                align="center"
                mb="phi3"
                gap="phi2"
                flexWrap="wrap"
              >
                <HStack gap="2">
                  <Box
                    w="9"
                    h="9"
                    borderRadius="lg"
                    bg="prize.muted"
                    color="prize.fg"
                    borderWidth="1px"
                    borderColor="prize.solid"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Trophy size={16} />
                  </Box>
                  <Box>
                    <Text
                      fontFamily="heading"
                      fontWeight="extrabold"
                      fontSize="md"
                      letterSpacing="0.02em"
                    >
                      Discover tournaments
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      Brackets · entry fees · host cut on settle
                    </Text>
                  </Box>
                  <GhBadge tone="prize">{filteredTournaments.length}</GhBadge>
                </HStack>
                <Link href="/create?type=tournament">
                  <GhButton size="sm" variant="prize" leftIcon={<Plus size={14} />}>
                    Host
                  </GhButton>
                </Link>
              </Flex>
              <HStack gap="2" mb="phi3" flexWrap="wrap">
                <Box flex="1" minW="12rem">
                  <GhInputShell left={<Search size={14} />}>
                    <GhInput
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search game / host / title"
                    />
                  </GhInputShell>
                </Box>
                {(
                  [
                    { key: "date" as const, label: "Date", icon: Calendar },
                    { key: "game" as const, label: "Game", icon: Gamepad2 },
                    { key: "title" as const, label: "Name", icon: Trophy },
                    { key: "pot" as const, label: "Pot", icon: ArrowUpDown },
                  ] as const
                ).map(({ key, label, icon: Icon }) => (
                  <Box
                    key={key}
                    as="button"
                    onClick={() => toggleSort(key)}
                    px="2.5"
                    py="1"
                    borderRadius="full"
                    borderWidth="1px"
                    borderColor={sortBy === key ? "prize.solid" : "border.default"}
                    bg={sortBy === key ? "prize.muted" : "whiteAlpha.50"}
                    color={sortBy === key ? "prize.fg" : "fg.muted"}
                    fontSize="2xs"
                    fontFamily="heading"
                    fontWeight="bold"
                    cursor="pointer"
                    transition="all 0.12s"
                    _hover={{ borderColor: "border.strong" }}
                  >
                    <HStack gap="1">
                      <Icon size={11} />
                      <Text>
                        {label}
                        {sortBy === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                      </Text>
                    </HStack>
                  </Box>
                ))}
              </HStack>
              {filteredTournaments.length === 0 ? (
                <GhEmptyState
                  icon={Trophy}
                  title="No tournaments"
                  description={
                    isCanisterConfigured()
                      ? "Host a bracket or wait for others to create one."
                      : "Deploy gh_backend and set NEXT_PUBLIC_GH_BACKEND_CANISTER_ID."
                  }
                />
              ) : (
                <Grid
                  templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                  gap="phi3"
                  alignItems="stretch"
                >
                  {filteredTournaments.map((t) => (
                    <Link
                      key={t.id}
                      href={`/tournaments/${encodeURIComponent(t.id)}`}
                      style={{ textDecoration: "none" }}
                    >
                      <MatchCard
                        kind="tournament"
                        title={t.title}
                        game={t.game}
                        console={t.console}
                        entryFee={formatIcp(t.entryFeeIcp)}
                        prizePot={
                          t.prizePotIcp != null
                            ? formatIcp(t.prizePotIcp)
                            : undefined
                        }
                        status={
                          t.status === "live"
                            ? "live"
                            : t.status === "settled"
                              ? "settled"
                              : "open"
                        }
                        players={filledLabel(t)}
                        meta={`${tournamentKindLabel(t)} · ${formatWhen(t.scheduledAt)}`}
                        username={t.hostUsername}
                        betable={t.betable}
                        market={
                          t.betable && t.marketId
                            ? {
                                id: t.marketId,
                                category: "esports",
                                label: "Outright",
                              }
                            : undefined
                        }
                      />
                    </Link>
                  ))}
                </Grid>
              )}
            </Box>

            <MyMarketsSection />

            {/* Chatrooms */}
            <Box
              borderRadius="2xl"
              borderWidth="1px"
              borderColor="border.default"
              bg="bg.glass"
              backdropFilter="blur(16px)"
              p={{ base: "phi3", md: "phi4" }}
            >
              <Flex
                justify="space-between"
                align="center"
                mb="phi3"
                gap="phi2"
                flexWrap="wrap"
              >
                <HStack gap="2">
                  <Box
                    w="9"
                    h="9"
                    borderRadius="lg"
                    bg="live.muted"
                    color="live.fg"
                    borderWidth="1px"
                    borderColor="live.solid"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Hash size={16} />
                  </Box>
                  <Box>
                    <Text
                      fontFamily="heading"
                      fontWeight="extrabold"
                      fontSize="md"
                      letterSpacing="0.02em"
                    >
                      Chatrooms
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      Group lobbies · pots · live chat
                    </Text>
                  </Box>
                  <GhBadge tone="live">{filteredRooms.length}</GhBadge>
                </HStack>
                <Link href="/create?type=room">
                  <GhButton size="sm" variant="live" leftIcon={<Plus size={14} />}>
                    Host room
                  </GhButton>
                </Link>
              </Flex>
              <Box mb="phi3">
                <GameFilterBar
                  games={roomGameOptions}
                  value={roomGame}
                  onChange={setRoomGame}
                  myGames={myGames}
                  label="Filter rooms by game"
                />
              </Box>
              {filteredRooms.length === 0 ? (
                <GhEmptyState
                  icon={Hash}
                  title="No rooms yet"
                  description="Create a room from Host booth — it appears here live."
                />
              ) : (
                <VStack align="stretch" gap="phi2">
                  {filteredRooms.map((room) => (
                    <GhSurface
                      key={room.id}
                      variant="elevated"
                      p="phi3"
                      borderColor={room.live ? "live.solid" : "border.default"}
                      _hover={{
                        borderColor: "live.solid",
                        boxShadow: "glow",
                        transform: "translateY(-1px)",
                      }}
                      transition="all 0.15s ease"
                    >
                      <Flex
                        justify="space-between"
                        align={{ base: "flex-start", sm: "center" }}
                        gap="phi2"
                        direction={{ base: "column", sm: "row" }}
                      >
                        <HStack gap="phi2" minW="0" align="flex-start" flex="1">
                          <Box
                            w="8"
                            h="8"
                            borderRadius="lg"
                            bg="live.muted"
                            color="live.fg"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            <Hash size={14} />
                          </Box>
                          <Box minW="0">
                            <HStack gap="2" mb="1" flexWrap="wrap">
                              <Text
                                fontFamily="heading"
                                fontWeight="bold"
                                fontSize="sm"
                              >
                                #{room.name}
                              </Text>
                              {room.live ? (
                                <GhBadge tone="live" pulse>
                                  Live
                                </GhBadge>
                              ) : null}
                              {room.game ? (
                                <GhBadge tone="muted">{room.game}</GhBadge>
                              ) : null}
                            </HStack>
                            <Text fontSize="xs" color="fg.muted" lineClamp={2}>
                              {room.topic || "Open lobby"}
                            </Text>
                            <Text fontSize="2xs" color="fg.subtle" mt="1">
                              <Users
                                size={10}
                                style={{ display: "inline", marginRight: 4 }}
                              />
                              {room.members} members
                            </Text>
                          </Box>
                        </HStack>
                        <HStack gap="2" flexWrap="wrap">
                          <Link href={`/chat/${encodeURIComponent(room.id)}`}>
                            <GhButton
                              size="sm"
                              variant="primary"
                              leftIcon={<Hash size={14} />}
                            >
                              Open room
                            </GhButton>
                          </Link>
                          <GhButton
                            size="sm"
                            variant="soft"
                            leftIcon={<MessageCircle size={14} />}
                            onClick={() => {
                              openRoom({ id: room.id, name: room.name });
                              ghToast({
                                title: `Joined #${room.name}`,
                                description: "Dock chat opened",
                                type: "info",
                              });
                            }}
                          >
                            Quick chat
                          </GhButton>
                        </HStack>
                      </Flex>
                    </GhSurface>
                  ))}
                </VStack>
              )}
            </Box>

            <SectionDivider label="Challenge" tone="brand" my="0" />

            <ChallengeQuickForm
              open={challengeOpen}
              onOpenChange={setChallengeOpen}
              opponent={challengeTarget}
            />
            {!challengeOpen ? (
              <GhButton
                variant="primary"
                leftIcon={<Plus size={16} />}
                onClick={() => {
                  setChallengeTarget(null);
                  setChallengeOpen(true);
                }}
              >
                Quick challenge
              </GhButton>
            ) : null}
          </VStack>

          {/* Online sidebar */}
          <Box
            position={{ lg: "sticky" }}
            top={{ lg: "6.5rem" }}
            alignSelf="start"
          >
            <GhSurface
              variant="elevated"
              p="0"
              overflow="hidden"
              borderColor="live.solid"
              boxShadow="glow"
              bg="bg.glass-strong"
              backdropFilter="blur(18px)"
            >
              <Box
                h="3px"
                bg="linear-gradient(90deg, #22d3ee, #a3ff3d, #8b5cf6)"
              />
              <HStack
                px="phi3"
                py="phi3"
                borderBottomWidth="1px"
                borderColor="border.default"
                justify="space-between"
                bg="whiteAlpha.50"
              >
                <HStack gap="2">
                  <Box
                    w="8"
                    h="8"
                    borderRadius="lg"
                    bg="live.muted"
                    color="live.fg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Wifi size={14} />
                  </Box>
                  <Box>
                    <Text
                      fontFamily="heading"
                      fontWeight="extrabold"
                      fontSize="sm"
                    >
                      Online
                    </Text>
                    <Text fontSize="2xs" color="fg.subtle">
                      Presence · challenge · chat
                    </Text>
                  </Box>
                </HStack>
                <GhBadge tone="live" pulse={filteredOnline.length > 0}>
                  {filteredOnline.length}
                </GhBadge>
              </HStack>
              <Box px="phi3" py="phi2" borderBottomWidth="1px" borderColor="border.default">
                <GameFilterBar
                  games={onlineGameOptions}
                  value={onlineGame}
                  onChange={setOnlineGame}
                  myGames={myGames}
                  label="Filter by game"
                />
              </Box>
              <VStack align="stretch" gap="0" maxH="28rem" overflowY="auto">
                {filteredOnline.length === 0 ? (
                  <Box p="phi4">
                    <Text fontSize="sm" color="fg.muted" lineHeight="1.5">
                      No one online yet. Presence uses Supabase{" "}
                      <Text as="span" fontFamily="mono" fontSize="2xs">
                        gh_presence
                      </Text>
                      .
                    </Text>
                  </Box>
                ) : (
                  filteredOnline.map((u, i) => (
                    <Box
                      key={u.id}
                      px="phi3"
                      py="phi3"
                      borderTopWidth={i === 0 ? 0 : "1px"}
                      borderColor="border.default"
                      bg={i % 2 === 0 ? "transparent" : "whiteAlpha.50"}
                      transition="background 0.12s"
                      _hover={{ bg: "brand.muted" }}
                    >
                      <HStack gap="2" mb="2">
                        <Box position="relative">
                          <GhAvatar
                            name={u.username}
                            size="sm"
                            src={u.avatarUrl}
                          />
                          <Box
                            position="absolute"
                            bottom="0"
                            right="0"
                            w="2"
                            h="2"
                            borderRadius="full"
                            bg={
                              u.status === "online"
                                ? "success.solid"
                                : "fg.subtle"
                            }
                            borderWidth="1px"
                            borderColor="bg.elevated"
                          />
                        </Box>
                        <Box minW="0">
                          <Text
                            fontFamily="heading"
                            fontWeight="bold"
                            fontSize="xs"
                            lineClamp={1}
                          >
                            @{u.username}
                          </Text>
                          <Text fontSize="2xs" color="fg.subtle" lineClamp={1}>
                            {u.game || "—"} {u.record ? `· ${u.record}` : ""}
                          </Text>
                        </Box>
                      </HStack>
                      <HStack gap="1">
                        <GhTooltip content="Challenge">
                          <GhButton
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setChallengeTarget(u);
                              setChallengeOpen(true);
                            }}
                          >
                            <Swords size={12} />
                          </GhButton>
                        </GhTooltip>
                        <GhTooltip content="Chat">
                          <GhButton
                            size="sm"
                            variant="soft"
                            onClick={() => openDm(u)}
                          >
                            <MessageCircle size={12} />
                          </GhButton>
                        </GhTooltip>
                        <Link
                          href={`/profile?u=${encodeURIComponent(u.username)}`}
                        >
                          <GhButton size="sm" variant="outline">
                            <User size={12} />
                          </GhButton>
                        </Link>
                      </HStack>
                    </Box>
                  ))
                )}
              </VStack>
            </GhSurface>
          </Box>
        </Grid>
      )}
    </VStack>
  );
}
