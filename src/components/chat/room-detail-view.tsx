"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
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
  Ban,
  ChartCandlestick,
  Coins,
  Edit3,
  Flame,
  Gamepad2,
  Hash,
  MessageCircle,
  Radio,
  Send,
  Share2,
  Swords,
  Trophy,
  User,
  Users,
  Wifi,
  Crown,
  Calendar,
  Save,
  Spade,
  ListOrdered,
  Layers,
  AtSign,
  Settings2,
} from "lucide-react";
import {
  GhAlert,
  GhAvatar,
  GhBadge,
  GhButton,
  GhEmptyState,
  GhField,
  GhInput,
  GhSpinner,
  GhSurface,
  GhTabs,
  GhTooltip,
  ghToast,
} from "@/components/ui";
import { MatchCard } from "@/components/cards/match-card";
import { ChallengeQuickForm } from "@/components/dashboard/challenge-quick-form";
import { useChat } from "@/components/chat/chat-context";
import { useSession } from "@/components/providers/session-context";
import {
  fetchMessages,
  sendMessage,
  subscribeMessages,
  roomThreadId,
} from "@/lib/chat/chat-service";
import { sanitizeChatMessage } from "@/lib/chat/sanitize";
import type { ChatMessage, ChatUser } from "@/lib/chat/types";
import {
  formatIcp,
  type EsportsRoom,
  type RoomGroupPot,
} from "@/lib/rooms";
import {
  blockUser,
  getBlockedUsernames,
  isBlocked,
  unblockUser,
} from "@/lib/chat/blocks";
import {
  joinRoomOnChain,
  loadRoom,
  updateRoomOnChain,
} from "@/lib/ic/room-service";
import { isCanisterConfigured } from "@/lib/ic/canisters";
import { useGhEventStream } from "@/hooks/use-gh-event-stream";
import { GH_TABLES } from "@/lib/supabase/tables";
/**
 * Full esports chatroom page — canister room + Supabase presence/Realtime.
 */
export function RoomDetailView({ roomId }: { roomId: string }) {
  const { user, principal, profile } = useSession();
  const { openDm } = useChat();
  const [room, setRoom] = useState<EsportsRoom | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [challengeUser, setChallengeUser] = useState<ChatUser | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (!isCanisterConfigured()) {
        setLoadError(
          "Canister not configured. Set NEXT_PUBLIC_GH_BACKEND_CANISTER_ID.",
        );
        setRoom(null);
        return;
      }
      const data = await loadRoom(roomId);
      setRoom(data);
      if (!data) setLoadError("Room not found on canister.");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
      setRoom(null);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useGhEventStream({
    channel: `gh-room-${roomId}`,
    table: GH_TABLES.rooms,
    filter: `id=eq.${roomId}`,
    onChange: () => {
      void loadRoom(roomId).then((r) => {
        if (r) setRoom(r);
      });
    },
  });

  if (loading) {
    return (
      <VStack py="phi8" gap="2">
        <GhSpinner />
        <Text fontSize="sm" color="fg.muted">
          Loading room…
        </Text>
      </VStack>
    );
  }

  if (!room) {
    return (
      <VStack align="stretch" gap="phi4" pb="phi4" pt="phi2">
        <GhEmptyState
          icon={Hash}
          title="Room not found"
          description={loadError ?? "This chatroom doesn’t exist on the canister."}
          action={
            <Link href="/dashboard">
              <GhButton variant="primary" leftIcon={<ArrowLeft size={16} />}>
                Back to dashboard
              </GhButton>
            </Link>
          }
        />
      </VStack>
    );
  }

  const who =
    profile?.username || principal || user?.username || user?.id || "";
  const isHost =
    who === room.creatorId ||
    who === room.host.username ||
    user?.id === room.creatorId ||
    user?.id === room.host.id;

  const onlineCount = room.online.filter((m) => m.status === "online").length;

  const share = () => {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `/chat/${room.id}`;
    void navigator.clipboard?.writeText(url);
    ghToast({ title: "Room link copied", description: url, type: "success" });
  };

  const onSaved = (next: EsportsRoom) => {
    setRoom(next);
    setEditOpen(false);
    ghToast({ title: "Room updated", type: "success" });
  };

  const joinRoom = async () => {
    if (!who) {
      ghToast({ title: "Sign in to join", type: "error" });
      return;
    }
    try {
      const ok = await joinRoomOnChain(room.id, who);
      if (!ok) throw new Error("Already a member or join failed");
      ghToast({ title: "Joined room", type: "success" });
      await reload();
    } catch (e) {
      ghToast({
        title: "Join failed",
        description: e instanceof Error ? e.message : String(e),
        type: "error",
      });
    }
  };

  return (
    <VStack align="stretch" gap={{ base: "phi4", md: "phi5" }} pb="phi4">
      {/* Hero cover */}
      <Box
        position="relative"
        borderRadius="3xl"
        borderWidth="1px"
        borderColor="border.brand"
        overflow="hidden"
        boxShadow="glow"
      >
        <Box position="relative" h={{ base: "10rem", md: "13rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={room.coverUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.45) saturate(1.2)",
            }}
          />
          <Box
            position="absolute"
            inset="0"
            bg="linear-gradient(180deg, transparent 20%, rgba(8,6,18,0.92) 100%)"
          />
          <HStack
            position="absolute"
            top="phi3"
            left="phi3"
            right="phi3"
            justify="space-between"
          >
            <Link href="/dashboard">
              <GhButton size="sm" variant="soft" leftIcon={<ArrowLeft size={14} />}>
                Dashboard
              </GhButton>
            </Link>
            <HStack gap="2">
              {room.live ? (
                <GhBadge tone="live" pulse>
                  Live
                </GhBadge>
              ) : (
                <GhBadge tone="muted">{room.status}</GhBadge>
              )}
              <GhButton size="sm" variant="outline" leftIcon={<Share2 size={14} />} onClick={share}>
                Share
              </GhButton>
            </HStack>
          </HStack>
        </Box>

        <Box px={{ base: "phi4", md: "phi5" }} pb="phi5" mt="-3.5rem" position="relative">
          <Flex
            gap="phi4"
            align={{ base: "flex-start", md: "flex-end" }}
            direction={{ base: "column", md: "row" }}
          >
            <Box
              w={{ base: "5.5rem", md: "6.5rem" }}
              h={{ base: "5.5rem", md: "6.5rem" }}
              borderRadius="2xl"
              borderWidth="2px"
              borderColor="border.brand"
              overflow="hidden"
              bg="bg.elevated"
              boxShadow="glow"
              flexShrink={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {room.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={room.avatarUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <Hash size={36} color="var(--gh-colors-brand-fg)" />
              )}
            </Box>
            <Box flex="1" minW="0" pt={{ base: 0, md: "2.5rem" }}>
              <HStack gap="2" flexWrap="wrap" mb="1">
                <Heading
                  as="h1"
                  fontFamily="heading"
                  fontSize={{ base: "xl", md: "2xl" }}
                  fontWeight="extrabold"
                  lineClamp={2}
                >
                  #{room.name}
                </Heading>
                {room.games.map((g) => (
                  <GhBadge key={g} tone="live">
                    {g}
                  </GhBadge>
                ))}
                {room.console ? (
                  <GhBadge tone="muted">{room.console}</GhBadge>
                ) : null}
              </HStack>
              <Text fontSize="sm" color="fg.muted" lineHeight="1.55" maxW="40rem">
                {room.topic}
              </Text>
              <HStack gap="phi3" mt="phi2" flexWrap="wrap" fontSize="xs" color="fg.subtle">
                <HStack gap="1">
                  <Users size={12} />
                  <Text>
                    {room.membersCount}/{room.maxMembers} members
                  </Text>
                </HStack>
                <HStack gap="1">
                  <Wifi size={12} />
                  <Text>{onlineCount} online</Text>
                </HStack>
                <HStack gap="1">
                  <Coins size={12} />
                  <Text className="gh-text-prize">
                    {formatIcp(room.totalWinningsIcp)} group winnings
                  </Text>
                </HStack>
              </HStack>
            </Box>
            <HStack gap="2" flexWrap="wrap">
              {isHost ? (
                <GhButton
                  size="sm"
                  variant="prize"
                  leftIcon={<Edit3 size={14} />}
                  onClick={() => setEditOpen((v) => !v)}
                >
                  {editOpen ? "Close editor" : "Edit room"}
                </GhButton>
              ) : (
                <GhButton size="sm" variant="soft" leftIcon={<Users size={14} />} onClick={() => void joinRoom()}>
                  Join room
                </GhButton>
              )}
              <GhButton
                size="sm"
                variant="primary"
                leftIcon={<MessageCircle size={14} />}
                onClick={() => setTab("chat")}
              >
                Open chat
              </GhButton>
            </HStack>
          </Flex>
        </Box>
      </Box>

      {/* Host edit */}
      {editOpen && isHost ? (
        <HostEditPanel room={room} onSaved={onSaved} />
      ) : null}

      {/* Stats full-width under header (host lives in overview side panel) */}
      <SimpleGrid columns={{ base: 2, sm: 4 }} gap="phi3">
        <MiniStat label="Online" value={String(onlineCount)} icon={<Wifi size={14} />} live />
        <MiniStat
          label="Group pots"
          value={String(room.activePots.length)}
          icon={<Trophy size={14} />}
        />
        <MiniStat
          label="Settled pots"
          value={String(room.totalPotsSettled)}
          icon={<Calendar size={14} />}
        />
        <MiniStat
          label="Total won"
          value={formatIcp(room.totalWinningsIcp)}
          icon={<Coins size={14} />}
          prize
        />
      </SimpleGrid>

      <GhTabs
        value={tab}
        onValueChange={setTab}
        tone="live"
        items={[
          {
            value: "overview",
            label: "Overview",
            content: (
              <OverviewTab
                room={room}
                isHost={isHost}
                onOpenChat={() => setTab("chat")}
                onChallenge={setChallengeUser}
                onDm={(u) => openDm(u)}
                onOpenPots={() => setTab("pots")}
              />
            ),
          },
          {
            value: "chat",
            label: "Chat",
            content: (
              <RoomChatPanel
                room={room}
                meId={user?.id || "me"}
                onChallenge={setChallengeUser}
                onDm={(u) => openDm(u)}
              />
            ),
          },
          {
            value: "online",
            label: `Online (${onlineCount})`,
            content: (
              <OnlineRoster
                members={room.online}
                onChallenge={setChallengeUser}
                onDm={(u) => openDm(u)}
              />
            ),
          },
          {
            value: "pots",
            label: "Group pots",
            content: <PotsTab room={room} />,
          },
          {
            value: "leaderboard",
            label: "Leaderboard",
            content: <LeaderboardTab room={room} />,
          },
          {
            value: "markets",
            label: "Markets",
            content: <MarketsTab room={room} />,
          },
        ]}
      />

      {challengeUser ? (
        <Box mt="phi2">
          <ChallengeQuickForm
            open
            onOpenChange={(o) => {
              if (!o) setChallengeUser(null);
            }}
            opponent={challengeUser}
          />
        </Box>
      ) : null}
    </VStack>
  );
}

function HostCard({
  host,
  isHost,
  onChat,
}: {
  host: EsportsRoom["host"];
  isHost: boolean;
  onChat: () => void;
}) {
  return (
    <GhSurface
      variant="elevated"
      p="phi4"
      borderColor="prize.solid"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(125deg, rgba(244,63,168,0.12) 0%, transparent 55%)"
        pointerEvents="none"
      />
      <Box position="relative">
        <HStack gap="2" mb="phi3">
          <Crown size={16} color="var(--gh-colors-prize-fg)" />
          <Text
            fontFamily="heading"
            fontSize="2xs"
            fontWeight="bold"
            letterSpacing="0.1em"
            textTransform="uppercase"
            color="prize.fg"
          >
            Room host
          </Text>
          {isHost ? <GhBadge tone="prize">You</GhBadge> : null}
        </HStack>
        <Flex gap="phi3" align="center" mb="phi3">
          <GhAvatar name={host.username} size="lg" tone="prize" />
          <Box minW="0">
            <Link href={`/profile?u=${encodeURIComponent(host.username)}`}>
              <Text
                fontFamily="heading"
                fontWeight="extrabold"
                fontSize="lg"
                _hover={{ color: "prize.fg" }}
              >
                @{host.username}
              </Text>
            </Link>
            <Text fontSize="sm" color="fg.muted">
              Overall {host.record} · streak {host.winStreak}
            </Text>
          </Box>
        </Flex>
        <SimpleGrid columns={2} gap="phi2" mb="phi3">
          <HostStat label="Heads-up" value={host.headsUpRecord} />
          <HostStat label="Tournament" value={host.tournamentRecord} />
          <HostStat label="Win streak" value={String(host.winStreak)} flame />
          <HostStat
            label="Earnings"
            value={formatIcp(host.earningsIcp)}
            prize
          />
        </SimpleGrid>
        <HStack gap="2" flexWrap="wrap">
          <GhButton size="sm" variant="soft" leftIcon={<MessageCircle size={14} />} onClick={onChat}>
            Message host
          </GhButton>
          <Link href={`/profile?u=${encodeURIComponent(host.username)}`}>
            <GhButton size="sm" variant="outline" leftIcon={<User size={14} />}>
              Profile
            </GhButton>
          </Link>
        </HStack>
      </Box>
    </GhSurface>
  );
}

function HostStat({
  label,
  value,
  prize,
  flame,
}: {
  label: string;
  value: string;
  prize?: boolean;
  flame?: boolean;
}) {
  return (
    <Box
      p="phi2"
      borderRadius="lg"
      borderWidth="1px"
      borderColor={prize ? "prize.solid" : "border.default"}
      bg="blackAlpha.400"
    >
      <HStack gap="1" mb="0.5">
        {flame ? <Flame size={10} color="var(--gh-colors-live-fg)" /> : null}
        <Text fontSize="2xs" color="fg.subtle" fontFamily="heading" fontWeight="bold" textTransform="uppercase">
          {label}
        </Text>
      </HStack>
      <Text
        fontFamily="heading"
        fontWeight="extrabold"
        fontSize="sm"
        className={prize ? "gh-text-prize" : undefined}
      >
        {value}
      </Text>
    </Box>
  );
}

function MiniStat({
  label,
  value,
  icon,
  live,
  prize,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  live?: boolean;
  prize?: boolean;
}) {
  return (
    <GhSurface variant="glass" p="phi3">
      <HStack gap="1" color={live ? "live.fg" : prize ? "prize.fg" : "fg.muted"} mb="1">
        {icon}
        <Text fontSize="2xs" fontFamily="heading" fontWeight="bold" textTransform="uppercase">
          {label}
        </Text>
      </HStack>
      <Text
        fontFamily="heading"
        fontWeight="extrabold"
        fontSize="md"
        className={prize ? "gh-text-prize" : undefined}
      >
        {value}
      </Text>
    </GhSurface>
  );
}

const GROUP_TABLE_GAMES = [
  {
    name: "Poker",
    note: "Where legal",
    seats: "2–9",
    blurb: "Cash or tournament buy-in at the table. Host sets blinds / buy-in.",
  },
  {
    name: "Spades",
    note: "Partners or cutthroat",
    seats: "4",
    blurb: "Classic books game — pot split by contract rules the host posts.",
  },
  {
    name: "Dominoes",
    note: "Block / draw",
    seats: "2–4",
    blurb: "Race to score; buy-in seats the table until someone walks with the pot.",
  },
  {
    name: "Rummy / other",
    note: "House rules",
    seats: "2–6",
    blurb: "Any multi-seat game the room agrees on — rules live in the pot card.",
  },
] as const;

function OverviewTab({
  room,
  isHost,
  onOpenChat,
  onChallenge,
  onDm,
  onOpenPots,
}: {
  room: EsportsRoom;
  isHost: boolean;
  onOpenChat: () => void;
  onChallenge: (u: ChatUser) => void;
  onDm: (u: ChatUser) => void;
  onOpenPots: () => void;
}) {
  return (
    <Grid templateColumns={{ base: "1fr", lg: "1.35fr 0.9fr" }} gap={{ base: "phi4", lg: "phi5" }}>
      <VStack align="stretch" gap="phi4">
        {/* What is a Room */}
        <GhSurface
          variant="elevated"
          p={{ base: "phi4", md: "phi5" }}
          borderColor="border.brand"
          position="relative"
          overflow="hidden"
        >
          <Box
            position="absolute"
            inset="0"
            bg="linear-gradient(135deg, rgba(99,102,241,0.14) 0%, transparent 50%, rgba(244,63,168,0.08) 100%)"
            pointerEvents="none"
          />
          <Box position="relative">
            <HStack gap="2" mb="phi3" flexWrap="wrap">
              <Layers size={18} color="var(--gh-colors-brand-fg)" />
              <Text fontFamily="heading" fontWeight="extrabold" fontSize="lg">
                What is a Room?
              </Text>
              <GhBadge tone="live">Esports lounge</GhBadge>
            </HStack>
            <Text fontSize="sm" color="fg.muted" lineHeight="1.65" mb="phi4" maxW="40rem">
              A Room is your group&apos;s home base — not a single bracket. Members hang
              in chat, run multiplayer table games, spin group pots, and surface
              betable markets from anyone in the room (not only room-hosted events).
            </Text>
            <SimpleGrid columns={{ base: 1, sm: 2 }} gap="phi3">
              {[
                {
                  title: "Main chat + DMs",
                  body: "Lobby chat with online roster. Type @user for a private dock chat.",
                  icon: <MessageCircle size={16} />,
                },
                {
                  title: "Group pots",
                  body: "Shared prize pools for multi-seat matches — host take % on settle.",
                  icon: <Trophy size={16} />,
                },
                {
                  title: "Table games",
                  body: "Poker (where legal), Spades, Dominoes — seats, not 1v1 brackets.",
                  icon: <Spade size={16} />,
                },
                {
                  title: "Member markets",
                  body: "Betables from members’ tourneys & challenges show on the Markets tab.",
                  icon: <ChartCandlestick size={16} />,
                },
              ].map((card) => (
                <Box
                  key={card.title}
                  p="phi3"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="border.default"
                  bg="blackAlpha.400"
                >
                  <HStack gap="2" mb="1" color="brand.fg">
                    {card.icon}
                    <Text fontFamily="heading" fontWeight="bold" fontSize="sm">
                      {card.title}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
                    {card.body}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        </GhSurface>

        {/* Group challenges / table games */}
        <GhSurface variant="panel" p={{ base: "phi4", md: "phi5" }}>
          <HStack gap="2" mb="phi2" flexWrap="wrap">
            <Spade size={18} color="var(--gh-colors-prize-fg)" />
            <Text fontFamily="heading" fontWeight="extrabold" fontSize="lg">
              Group challenges
            </Text>
            <GhBadge tone="prize">Multi-player</GhBadge>
          </HStack>
          <Text fontSize="sm" color="fg.muted" lineHeight="1.55" mb="phi4">
            Unlike 1v1 brackets, these fill a table with individual players. Play only
            where local law allows (e.g. poker). House rules are set by the host when
            the match is created.
          </Text>
          <SimpleGrid columns={{ base: 1, sm: 2 }} gap="phi3" mb="phi4">
            {GROUP_TABLE_GAMES.map((g) => (
              <Box
                key={g.name}
                p="phi3"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="prize.solid"
                bg="prize.muted"
              >
                <HStack justify="space-between" mb="1" flexWrap="wrap" gap="1">
                  <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
                    {g.name}
                  </Text>
                  <HStack gap="1">
                    <GhBadge tone="muted">{g.seats} seats</GhBadge>
                    <GhBadge tone="prize">{g.note}</GhBadge>
                  </HStack>
                </HStack>
                <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
                  {g.blurb}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
          <Link href="/create?type=room">
            <GhButton variant="prize" size="sm" leftIcon={<Trophy size={14} />}>
              Host a table / group pot
            </GhButton>
          </Link>
        </GhSurface>

        {/* Steps: create match + claim */}
        <GhSurface variant="glass" p={{ base: "phi4", md: "phi5" }}>
          <HStack gap="2" mb="phi4">
            <ListOrdered size={18} color="var(--gh-colors-live-fg)" />
            <Text fontFamily="heading" fontWeight="extrabold" fontSize="lg">
              Room match & prize claim
            </Text>
          </HStack>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="phi4">
            <Box>
              <Text
                fontFamily="heading"
                fontSize="2xs"
                fontWeight="bold"
                letterSpacing="0.1em"
                textTransform="uppercase"
                color="live.fg"
                mb="phi2"
              >
                Create a room match
              </Text>
              <VStack align="stretch" gap="2">
                {[
                  "Host opens Create → Host game room (or Group pot on this room).",
                  "Pick a multi-seat game · set buy-in · host take % · seat count.",
                  "Optional: attach a betable market (≥1h schedule).",
                  "Players buy in from the pot card — seats fill, match goes live.",
                ].map((step, i) => (
                  <HStack key={step} align="flex-start" gap="phi2">
                    <Box
                      w="6"
                      h="6"
                      borderRadius="full"
                      bg="live.muted"
                      color="live.fg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontFamily="heading"
                      fontWeight="extrabold"
                      fontSize="xs"
                      flexShrink={0}
                    >
                      {i + 1}
                    </Box>
                    <Text fontSize="sm" color="fg.muted" lineHeight="1.5">
                      {step}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
            <Box>
              <Text
                fontFamily="heading"
                fontSize="2xs"
                fontWeight="bold"
                letterSpacing="0.1em"
                textTransform="uppercase"
                color="prize.fg"
                mb="phi2"
              >
                Prize claim
              </Text>
              <VStack align="stretch" gap="2">
                {[
                  "When the table ends, host (or agreed monitor) finalizes the result.",
                  "If a betable market is linked, settle the market first (resolved).",
                  "Host fee % comes off the pot; remainder pays winner(s) by rules.",
                  "Past pots land on Group pots tab · room leaderboard updates.",
                ].map((step, i) => (
                  <HStack key={step} align="flex-start" gap="phi2">
                    <Box
                      w="6"
                      h="6"
                      borderRadius="full"
                      bg="prize.muted"
                      color="prize.fg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontFamily="heading"
                      fontWeight="extrabold"
                      fontSize="xs"
                      flexShrink={0}
                    >
                      {i + 1}
                    </Box>
                    <Text fontSize="sm" color="fg.muted" lineHeight="1.5">
                      {step}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          </SimpleGrid>
          <HStack mt="phi4" gap="2" flexWrap="wrap">
            <GhButton size="sm" variant="soft" onClick={onOpenPots}>
              View group pots
            </GhButton>
            <GhButton size="sm" variant="primary" leftIcon={<MessageCircle size={14} />} onClick={onOpenChat}>
              Open room chat
            </GhButton>
          </HStack>
        </GhSurface>

        <GhSurface variant="panel" p="phi4">
          <HStack justify="space-between" mb="phi3">
            <HStack gap="2">
              <ChartCandlestick size={16} color="var(--gh-colors-brand-fg)" />
              <Text fontFamily="heading" fontWeight="extrabold">
                Member betable markets
              </Text>
            </HStack>
            <Text fontSize="xs" color="fg.subtle">
              Group pots + members&apos; own events
            </Text>
          </HStack>
          {room.memberMarkets.length === 0 ? (
            <Text fontSize="sm" color="fg.muted">
              No open markets from room members right now.
            </Text>
          ) : (
            <VStack align="stretch" gap="2">
              {room.memberMarkets.slice(0, 4).map((m) => (
                <MarketRow key={m.id} m={m} />
              ))}
            </VStack>
          )}
        </GhSurface>
      </VStack>

      {/* Side panel: online → vibes → host */}
      <VStack align="stretch" gap="phi4">
        <GhSurface variant="glass" p="phi4">
          <HStack justify="space-between" mb="phi3">
            <HStack gap="2">
              <Wifi size={16} color="var(--gh-colors-live-fg)" />
              <Text fontFamily="heading" fontWeight="extrabold">
                Online now
              </Text>
            </HStack>
            <GhButton size="sm" variant="soft" onClick={onOpenChat}>
              Jump to chat
            </GhButton>
          </HStack>
          <VStack align="stretch" gap="2">
            {room.online.slice(0, 6).map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                compact
                onChallenge={() => onChallenge(m)}
                onDm={() => onDm(m)}
              />
            ))}
          </VStack>
        </GhSurface>

        <GhSurface variant="muted" p="phi4">
          <HStack gap="2" mb="phi2">
            <Flame size={16} color="var(--gh-colors-live-fg)" />
            <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
              Room vibes
            </Text>
          </HStack>
          <Text fontSize="sm" color="fg.muted" lineHeight="1.55">
            Challenge anyone online, use the main chat, or type{" "}
            <Text as="span" fontFamily="mono" color="brand.fg">
              @username
            </Text>{" "}
            for a private dock DM. Block nuisance senders from chat controls.
            Host runs pots; everyone can still run their own tourneys and 1v1s.
          </Text>
        </GhSurface>

        <HostCard
          host={room.host}
          isHost={isHost}
          onChat={() =>
            onDm({
              id: room.host.id,
              username: room.host.username,
              status: "online",
              record: room.host.record,
            })
          }
        />
      </VStack>
    </Grid>
  );
}

function PotCard({ pot }: { pot: RoomGroupPot }) {
  return (
    <MatchCard
      kind="tournament"
      title={pot.title}
      game={pot.game}
      console={pot.console}
      entryFee={`${pot.buyInIcp} ICP`}
      prizePot={`${pot.potIcp} ICP`}
      status={
        pot.status === "live"
          ? "live"
          : pot.status === "open"
            ? "open"
            : pot.status === "settled"
              ? "settled"
              : "open"
      }
      players={pot.players}
      meta={`Host take ${pot.hostTakePct}% · group pot`}
      hostEarn={
        pot.winner ? `Winner · ${pot.winner}` : `${pot.hostTakePct}% take`
      }
      betable={pot.betable}
      market={
        pot.betable && pot.marketId
          ? { id: pot.marketId, category: "esports", label: "Group pot" }
          : undefined
      }
    />
  );
}

function MarketRow({
  m,
}: {
  m: EsportsRoom["memberMarkets"][0];
}) {
  return (
    <Flex
      justify="space-between"
      align="center"
      gap="phi2"
      p="phi3"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      bg="blackAlpha.400"
      flexWrap="wrap"
    >
      <Box minW="0">
        <HStack gap="2" mb="0.5" flexWrap="wrap">
          <GhBadge tone={m.kind === "tournament" ? "prize" : "brand"}>
            {m.kind}
          </GhBadge>
          <GhBadge
            tone={
              m.status === "active"
                ? "live"
                : m.status === "resolved"
                  ? "success"
                  : "muted"
            }
          >
            {m.status}
          </GhBadge>
        </HStack>
        <Text fontFamily="heading" fontWeight="bold" fontSize="sm" lineClamp={1}>
          {m.title}
        </Text>
        <Text fontSize="2xs" color="fg.subtle">
          @{m.memberUsername} · {m.game}
          {m.volumeIcp != null ? ` · vol ${m.volumeIcp} ICP` : ""}
        </Text>
      </Box>
      <Link href={`/markets/${encodeURIComponent(m.id)}`}>
        <GhButton size="sm" variant="soft" leftIcon={<ChartCandlestick size={14} />}>
          Market
        </GhButton>
      </Link>
    </Flex>
  );
}

function MemberRow({
  member,
  compact,
  onChallenge,
  onDm,
}: {
  member: EsportsRoom["online"][0];
  compact?: boolean;
  onChallenge: () => void;
  onDm: () => void;
}) {
  return (
    <Flex
      justify="space-between"
      align="center"
      gap="phi2"
      p={compact ? "phi2" : "phi3"}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      bg="blackAlpha.400"
      flexWrap="wrap"
    >
      <HStack gap="phi2" minW="0">
        <Box position="relative">
          <GhAvatar name={member.username} size={compact ? "sm" : "md"} />
          <Box
            position="absolute"
            bottom="0"
            right="0"
            w="2.5"
            h="2.5"
            borderRadius="full"
            bg={member.status === "online" ? "success.solid" : "fg.subtle"}
            borderWidth="2px"
            borderColor="bg.elevated"
          />
        </Box>
        <Box minW="0">
          <HStack gap="1" flexWrap="wrap">
            <Link href={`/profile?u=${encodeURIComponent(member.username)}`}>
              <Text fontFamily="heading" fontWeight="bold" fontSize="sm" lineClamp={1}>
                @{member.username}
              </Text>
            </Link>
            {member.role === "host" ? (
              <GhBadge tone="prize">Host</GhBadge>
            ) : member.role === "mod" ? (
              <GhBadge tone="brand">Mod</GhBadge>
            ) : null}
          </HStack>
          <Text fontSize="2xs" color="fg.subtle">
            {member.game || "—"} · {member.record || "0–0"}
            {member.roomEarningsIcp != null
              ? ` · room ${formatIcp(member.roomEarningsIcp)}`
              : ""}
          </Text>
        </Box>
      </HStack>
      <HStack gap="1" flexWrap="wrap">
        <GhTooltip content="Direct message">
          <GhButton size="sm" variant="soft" onClick={onDm} aria-label="Chat">
            <MessageCircle size={14} />
          </GhButton>
        </GhTooltip>
        <GhTooltip content="Challenge">
          <GhButton size="sm" variant="prize" onClick={onChallenge} aria-label="Challenge">
            <Swords size={14} />
          </GhButton>
        </GhTooltip>
        <Link href={`/profile?u=${encodeURIComponent(member.username)}`}>
          <GhButton size="sm" variant="outline" aria-label="Profile">
            <User size={14} />
          </GhButton>
        </Link>
      </HStack>
    </Flex>
  );
}

function OnlineRoster({
  members,
  onChallenge,
  onDm,
}: {
  members: EsportsRoom["online"];
  onChallenge: (u: ChatUser) => void;
  onDm: (u: ChatUser) => void;
}) {
  return (
    <VStack align="stretch" gap="phi2">
      <Text fontSize="sm" color="fg.muted">
        Challenge, DM, or open profile — same actions as the dashboard online
        list.
      </Text>
      {members.map((m) => (
        <MemberRow
          key={m.id}
          member={m}
          onChallenge={() => onChallenge(m)}
          onDm={() => onDm(m)}
        />
      ))}
    </VStack>
  );
}

function PotsTab({ room }: { room: EsportsRoom }) {
  return (
    <VStack align="stretch" gap="phi4">
      <Box>
        <HStack gap="2" mb="phi3">
          <Radio size={16} color="var(--gh-colors-live-fg)" />
          <Text fontFamily="heading" fontWeight="extrabold">
            Active group pot tournaments
          </Text>
        </HStack>
        {room.activePots.length === 0 ? (
          <GhEmptyState
            icon={Trophy}
            title="No active pots"
            description="Host can create a group pot from Create → Host game room."
          />
        ) : (
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="phi3">
            {room.activePots.map((p) => (
              <PotCard key={p.id} pot={p} />
            ))}
          </Grid>
        )}
      </Box>
      <Box>
        <HStack gap="2" mb="phi3">
          <Calendar size={16} />
          <Text fontFamily="heading" fontWeight="extrabold">
            Past group pot tournaments
          </Text>
        </HStack>
        {room.pastPots.length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            Settled pots will show here with winners and final pots.
          </Text>
        ) : (
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="phi3">
            {room.pastPots.map((p) => (
              <PotCard key={p.id} pot={p} />
            ))}
          </Grid>
        )}
      </Box>
    </VStack>
  );
}

function LeaderboardTab({ room }: { room: EsportsRoom }) {
  return (
    <GhSurface variant="elevated" p="0" overflow="hidden">
      <Box
        px="phi4"
        py="phi3"
        borderBottomWidth="1px"
        borderColor="border.default"
        bg="blackAlpha.400"
      >
        <HStack justify="space-between" flexWrap="wrap" gap="2">
          <HStack gap="2">
            <Trophy size={16} color="var(--gh-colors-prize-fg)" />
            <Text fontFamily="heading" fontWeight="extrabold">
              Room leaderboard
            </Text>
          </HStack>
          <Text fontSize="xs" color="fg.subtle">
            Wins · earnings from room pots
          </Text>
        </HStack>
      </Box>
      {room.leaderboard.length === 0 ? (
        <Box p="phi4">
          <Text fontSize="sm" color="fg.muted">
            Play group pots to climb the board.
          </Text>
        </Box>
      ) : (
        <VStack align="stretch" gap="0">
          {room.leaderboard.map((row, i) => (
            <Flex
              key={row.userId}
              px="phi4"
              py="phi3"
              justify="space-between"
              align="center"
              gap="phi2"
              flexWrap="wrap"
              borderTopWidth={i === 0 ? 0 : "1px"}
              borderColor="border.default"
              _hover={{ bg: "blackAlpha.300" }}
            >
              <HStack gap="phi3" minW="0">
                <Text
                  fontFamily="heading"
                  fontWeight="extrabold"
                  color={row.rank <= 3 ? "prize.fg" : "fg.muted"}
                  w="6"
                >
                  #{row.rank}
                </Text>
                <GhAvatar name={row.username} size="sm" tone="prize" />
                <Box minW="0">
                  <Link href={`/profile?u=${encodeURIComponent(row.username)}`}>
                    <Text fontFamily="heading" fontWeight="bold" fontSize="sm">
                      @{row.username}
                    </Text>
                  </Link>
                  <Text fontSize="2xs" color="fg.subtle">
                    {row.wins}–{row.losses}
                    {row.streak > 0 ? ` · 🔥 ${row.streak}` : ""}
                  </Text>
                </Box>
              </HStack>
              <Text fontFamily="heading" fontWeight="extrabold" className="gh-text-prize">
                {formatIcp(row.earningsIcp)}
              </Text>
            </Flex>
          ))}
        </VStack>
      )}
    </GhSurface>
  );
}

function MarketsTab({ room }: { room: EsportsRoom }) {
  return (
    <VStack align="stretch" gap="phi3">
      <GhAlert tone="brand" title="Not just group pots">
        Markets from room members&apos; personal tournaments and challenges also
        appear here — so the lounge is a full esports desk, not only room-hosted
        events.
      </GhAlert>
      {room.memberMarkets.length === 0 ? (
        <GhEmptyState
          icon={ChartCandlestick}
          title="No member markets"
          description="When members open betable tourneys or 1v1s, lines show up here."
        />
      ) : (
        room.memberMarkets.map((m) => <MarketRow key={m.id} m={m} />)
      )}
    </VStack>
  );
}

function RoomChatPanel({
  room,
  meId,
  onChallenge,
  onDm,
}: {
  room: EsportsRoom;
  meId: string;
  onChallenge: (u: ChatUser) => void;
  onDm: (u: ChatUser) => void;
}) {
  const threadId = roomThreadId(room.id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [showBlocks, setShowBlocks] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { openRoom } = useChat();

  useEffect(() => {
    setBlocked(getBlockedUsernames());
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchMessages(threadId).then((list) => {
      if (!cancelled) setMessages(list);
    });
    const unsub = subscribeMessages(threadId, (msg) => {
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [threadId]);

  const visibleMessages = messages.filter(
    (m) => m.senderId === meId || !isBlocked(m.senderId),
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages.length]);

  const mentionMatches =
    mentionQuery != null
      ? room.online.filter((u) =>
          u.username.toLowerCase().includes(mentionQuery.toLowerCase()),
        )
      : [];

  const onInputChange = (value: string) => {
    setInput(value);
    // Detect trailing @mention fragment
    const m = value.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
    if (m) setMentionQuery(m[1] ?? "");
    else setMentionQuery(null);
  };

  const pickMention = (user: ChatUser) => {
    // Open private dock chat; strip incomplete @ from composer
    setInput((prev) => prev.replace(/(?:^|\s)@[a-zA-Z0-9_]*$/, " ").trimEnd());
    setMentionQuery(null);
    onDm(user);
    ghToast({
      title: `Private chat · @${user.username}`,
      description: "Opened in the dock (same as dashboard DMs).",
      type: "info",
    });
  };

  const onSend = async () => {
    if (sending) return;
    const { sanitized, ok } = sanitizeChatMessage(input);
    if (!ok) return;
    setSending(true);
    try {
      await sendMessage({
        threadId,
        senderId: meId,
        body: sanitized,
      });
      setInput("");
      setMentionQuery(null);
    } finally {
      setSending(false);
    }
  };

  const toggleBlock = (username: string) => {
    if (isBlocked(username)) {
      setBlocked(unblockUser(username));
      ghToast({ title: `Unblocked @${username}`, type: "success" });
    } else {
      setBlocked(blockUser(username));
      ghToast({
        title: `Blocked @${username}`,
        description: "Their room messages are hidden for you.",
        type: "info",
      });
    }
  };

  return (
    <Grid
      templateColumns={{ base: "1fr", lg: "1fr 17rem" }}
      gap="phi3"
      alignItems="stretch"
    >
      <GhSurface variant="elevated" p="0" overflow="hidden" minH="26rem">
        <HStack
          px="phi4"
          py="phi3"
          borderBottomWidth="1px"
          borderColor="border.default"
          justify="space-between"
          bg="blackAlpha.400"
          flexWrap="wrap"
          gap="2"
        >
          <HStack gap="2">
            <Hash size={16} color="var(--gh-colors-live-fg)" />
            <Text fontFamily="heading" fontWeight="extrabold">
              #{room.name}
            </Text>
            <GhBadge tone="live">Main room</GhBadge>
          </HStack>
          <HStack gap="2">
            <GhButton
              size="sm"
              variant="outline"
              leftIcon={<Settings2 size={14} />}
              onClick={() => setShowBlocks((v) => !v)}
            >
              Chat controls
            </GhButton>
            <GhButton
              size="sm"
              variant="soft"
              onClick={() => {
                openRoom({ id: room.id, name: room.name });
                ghToast({
                  title: "Also opened in dock",
                  description: "Chat continues in the bottom dock.",
                  type: "info",
                });
              }}
            >
              Pop out
            </GhButton>
          </HStack>
        </HStack>

        {showBlocks ? (
          <Box
            px="phi4"
            py="phi3"
            borderBottomWidth="1px"
            borderColor="border.default"
            bg="blackAlpha.500"
          >
            <HStack gap="2" mb="2">
              <Ban size={14} color="var(--gh-colors-danger-fg, #f87171)" />
              <Text fontFamily="heading" fontWeight="bold" fontSize="sm">
                Blocked senders
              </Text>
            </HStack>
            <Text fontSize="xs" color="fg.muted" mb="phi2">
              Blocked users&apos; messages stay hidden in this browser. Unblock anytime.
              Use the ⊘ on the online list to block someone.
            </Text>
            {blocked.length === 0 ? (
              <Text fontSize="xs" color="fg.subtle">
                No one blocked.
              </Text>
            ) : (
              <HStack gap="2" flexWrap="wrap">
                {blocked.map((u) => (
                  <GhButton
                    key={u}
                    size="sm"
                    variant="soft"
                    onClick={() => toggleBlock(u)}
                  >
                    @{u} · unblock
                  </GhButton>
                ))}
              </HStack>
            )}
          </Box>
        ) : null}

        <VStack
          align="stretch"
          gap="phi2"
          px="phi4"
          py="phi3"
          h={{ base: "16rem", md: "20rem" }}
          overflowY="auto"
        >
          {visibleMessages.length === 0 ? (
            <Text fontSize="sm" color="fg.muted" py="phi4" textAlign="center">
              Say hi — or type{" "}
              <Text as="span" fontFamily="mono" color="brand.fg">
                @username
              </Text>{" "}
              to open a private chat.
            </Text>
          ) : (
            visibleMessages.map((m) => {
              const mine = m.senderId === meId;
              return (
                <Flex key={m.id} justify={mine ? "flex-end" : "flex-start"}>
                  <Box
                    maxW="85%"
                    px="phi3"
                    py="2"
                    borderRadius="xl"
                    bg={mine ? "brand.muted" : "blackAlpha.500"}
                    borderWidth="1px"
                    borderColor={mine ? "border.brand" : "border.default"}
                  >
                    {!mine ? (
                      <Text
                        fontSize="2xs"
                        color="fg.subtle"
                        mb="0.5"
                        fontWeight="bold"
                      >
                        {m.senderId}
                      </Text>
                    ) : null}
                    <Text fontSize="sm" whiteSpace="pre-wrap">
                      {m.body}
                    </Text>
                  </Box>
                </Flex>
              );
            })
          )}
          <div ref={bottomRef} />
        </VStack>

        <Box
          px="phi4"
          py="phi3"
          borderTopWidth="1px"
          borderColor="border.default"
          position="relative"
        >
          {mentionQuery != null && mentionMatches.length > 0 ? (
            <Box
              position="absolute"
              bottom="100%"
              left="phi4"
              right="phi4"
              mb="1"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="border.brand"
              bg="bg.elevated"
              boxShadow="glow"
              maxH="10rem"
              overflowY="auto"
              zIndex={5}
            >
              <HStack px="phi3" py="2" gap="1" borderBottomWidth="1px" borderColor="border.default">
                <AtSign size={12} />
                <Text fontSize="2xs" fontFamily="heading" fontWeight="bold">
                  Private chat
                </Text>
              </HStack>
              {mentionMatches.map((u) => (
                <Box
                  key={u.id}
                  as="button"
                  w="100%"
                  textAlign="left"
                  px="phi3"
                  py="2"
                  cursor="pointer"
                  _hover={{ bg: "brand.muted" }}
                  onClick={() => pickMention(u)}
                >
                  <Text fontSize="sm" fontFamily="heading" fontWeight="bold">
                    @{u.username}
                  </Text>
                  <Text fontSize="2xs" color="fg.subtle">
                    {u.game || "Online"} · open DM
                  </Text>
                </Box>
              ))}
            </Box>
          ) : null}
          <HStack gap="2">
            <GhInput
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={`#${room.name} · type @user for private chat`}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (mentionQuery != null && mentionMatches[0]) {
                    pickMention(mentionMatches[0]);
                    return;
                  }
                  void onSend();
                }
                if (e.key === "Escape") setMentionQuery(null);
              }}
            />
            <GhButton
              variant="primary"
              leftIcon={<Send size={14} />}
              onClick={() => void onSend()}
              disabled={sending || !input.trim()}
            >
              Send
            </GhButton>
          </HStack>
        </Box>
      </GhSurface>

      {/* Online side panel */}
      <GhSurface variant="glass" p="0" overflow="hidden" display={{ base: "none", lg: "block" }}>
        <Box
          px="phi3"
          py="phi3"
          borderBottomWidth="1px"
          borderColor="border.default"
          bg="blackAlpha.400"
        >
          <HStack gap="2">
            <Wifi size={14} color="var(--gh-colors-live-fg)" />
            <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
              Online
            </Text>
            <GhBadge tone="live">
              {room.online.filter((m) => m.status === "online").length}
            </GhBadge>
          </HStack>
          <Text fontSize="2xs" color="fg.subtle" mt="1">
            DM · challenge · block
          </Text>
        </Box>
        <VStack
          align="stretch"
          gap="0"
          maxH="26rem"
          overflowY="auto"
        >
          {room.online.map((m, i) => (
            <Box
              key={m.id}
              px="phi3"
              py="phi2"
              borderTopWidth={i === 0 ? 0 : "1px"}
              borderColor="border.default"
            >
              <HStack justify="space-between" gap="1" mb="1">
                <HStack gap="2" minW="0">
                  <Box position="relative">
                    <GhAvatar name={m.username} size="sm" />
                    <Box
                      position="absolute"
                      bottom="0"
                      right="0"
                      w="2"
                      h="2"
                      borderRadius="full"
                      bg={m.status === "online" ? "success.solid" : "fg.subtle"}
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
                      @{m.username}
                    </Text>
                    <Text fontSize="2xs" color="fg.subtle" lineClamp={1}>
                      {m.game || "—"}
                    </Text>
                  </Box>
                </HStack>
              </HStack>
              <HStack gap="1">
                <GhTooltip content="Private chat">
                  <GhButton size="sm" variant="soft" onClick={() => onDm(m)} aria-label="DM">
                    <MessageCircle size={12} />
                  </GhButton>
                </GhTooltip>
                <GhTooltip content="Challenge">
                  <GhButton
                    size="sm"
                    variant="prize"
                    onClick={() => onChallenge(m)}
                    aria-label="Challenge"
                  >
                    <Swords size={12} />
                  </GhButton>
                </GhTooltip>
                <GhTooltip content={isBlocked(m.username) ? "Unblock" : "Block messages"}>
                  <GhButton
                    size="sm"
                    variant="outline"
                    onClick={() => toggleBlock(m.username)}
                    aria-label="Block"
                  >
                    <Ban size={12} />
                  </GhButton>
                </GhTooltip>
              </HStack>
            </Box>
          ))}
        </VStack>
      </GhSurface>
    </Grid>
  );
}

function HostEditPanel({
  room,
  onSaved,
}: {
  room: EsportsRoom;
  onSaved: (r: EsportsRoom) => void;
}) {
  const [name, setName] = useState(room.name);
  const [topic, setTopic] = useState(room.topic);
  const [coverUrl, setCoverUrl] = useState(room.coverUrl);
  const [avatarUrl, setAvatarUrl] = useState(room.avatarUrl);
  const [primaryGame, setPrimaryGame] = useState(room.game);
  const [gamesStr, setGamesStr] = useState(room.games.join(", "));
  const [consoleName, setConsoleName] = useState(room.console || "");

  const { profile, principal, user } = useSession();
  const who = profile?.username || principal || user?.username || room.creatorId;

  const save = async () => {
    if (!name.trim()) {
      ghToast({ title: "Name required", type: "error" });
      return;
    }
    const gameList = gamesStr
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const primary = primaryGame.trim() || gameList[0] || room.game;
    try {
      const ok = await updateRoomOnChain(room.id, who, {
        name: name.trim(),
        description: topic.trim(),
        gameTypes: gameList.length ? gameList : [primary],
        console: consoleName.trim() || "PC",
        rules: room.topic,
        imageUrl: coverUrl.trim() || avatarUrl.trim() || room.coverUrl,
      });
      if (!ok) throw new Error("updateRoom returned false (host only)");
      const next = await loadRoom(room.id);
      if (next) onSaved(next);
    } catch (e) {
      ghToast({
        title: "Save failed",
        description: e instanceof Error ? e.message : String(e),
        type: "error",
      });
    }
  };

  return (
    <GhSurface variant="prize" p="phi4" borderColor="prize.solid">
      <HStack gap="2" mb="phi3">
        <Edit3 size={16} color="var(--gh-colors-prize-fg)" />
        <Text fontFamily="heading" fontWeight="extrabold">
          Edit room (host)
        </Text>
      </HStack>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="phi3">
        <GhField label="Room name">
          <GhInput value={name} onChange={(e) => setName(e.target.value)} />
        </GhField>
        <GhField label="Primary game">
          <GhInput
            value={primaryGame}
            onChange={(e) => setPrimaryGame(e.target.value)}
          />
        </GhField>
        <GhField label="Games (comma-separated)" helperText="Multi-game lounges welcome">
          <GhInput value={gamesStr} onChange={(e) => setGamesStr(e.target.value)} />
        </GhField>
        <GhField label="Console / platform">
          <GhInput
            value={consoleName}
            onChange={(e) => setConsoleName(e.target.value)}
            placeholder="PS5 · PC · Crossplay"
          />
        </GhField>
        <GhField label="Cover image URL" helperText="Wide banner">
          <GhInput value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
        </GhField>
        <GhField label="Room profile image URL" helperText="Square logo">
          <GhInput
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
          />
        </GhField>
      </SimpleGrid>
      <Box mt="phi3">
        <GhField label="Topic / description">
          <GhInput value={topic} onChange={(e) => setTopic(e.target.value)} />
        </GhField>
      </Box>
      <HStack mt="phi4" gap="2">
        <GhButton variant="prize" leftIcon={<Save size={14} />} onClick={save}>
          Save room
        </GhButton>
      </HStack>
    </GhSurface>
  );
}
