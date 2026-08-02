"use client";

/**
 * Group hub — community-style home for a user-created room.
 * Chat + group-members online · create / join group games · history · leaderboard.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  Calendar,
  Check,
  Coins,
  Crown,
  Edit3,
  Gamepad2,
  Hash,
  ImageIcon,
  LogOut,
  MessageCircle,
  Plus,
  Radio,
  Save,
  Send,
  Share2,
  Swords,
  Trophy,
  User,
  Users,
  Wifi,
  AtSign,
  Settings2,
  ListOrdered,
} from "lucide-react";
import {
  GhAlert,
  GhAvatar,
  GhBadge,
  GhButton,
  GhEmptyState,
  GhField,
  GhInput,
  GhProcessModal,
  GhSpinner,
  GhSurface,
  GhTabs,
  GhTextarea,
  GhTooltip,
  ghToast,
  processBeat,
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
import {
  excludeSelfChatUsers,
  type ChatMessage,
  type ChatUser,
} from "@/lib/chat/types";
import {
  blockUser,
  getBlockedUsernames,
  isBlocked,
  unblockUser,
} from "@/lib/chat/blocks";
import {
  claimRoomGamePrize,
  createRoomGameOnChain,
  isRoomMember,
  joinRoomGameOnChain,
  joinRoomOnChain,
  leaveRoomOnChain,
  loadRoom,
  reportRoomGameWinnerOnChain,
  startRoomGameOnChain,
  updateRoomOnChain,
} from "@/lib/ic/room-service";
import { isCanisterConfigured } from "@/lib/ic/canisters";
import { startPresenceHeartbeat } from "@/lib/ic/presence-service";
import { useGhEventStream } from "@/hooks/use-gh-event-stream";
import { useProcessModal } from "@/hooks/use-process-modal";
import { GH_TABLES } from "@/lib/supabase/tables";
import { chatShareUrl } from "@/lib/deep-links";
import {
  formatIcp,
  GROUP_AVATAR_DEFAULT,
  GROUP_AVATAR_PRESETS,
  GROUP_COVER_DEFAULT,
  GROUP_COVER_PRESETS,
  type EsportsRoom,
  type RoomGroupPot,
  type RoomMember,
} from "@/lib/rooms";

export function GroupHubView({ roomId }: { roomId: string }) {
  const { user, principal, profile, identity, isLoggedIn, login } = useSession();
  const { openDm } = useChat();
  const { processState, closeProcess, runProcess } = useProcessModal();
  const [room, setRoom] = useState<EsportsRoom | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("lounge");
  const [challengeUser, setChallengeUser] = useState<ChatUser | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const who =
    profile?.username || principal || user?.username || user?.id || "";
  const meId = principal || user?.id || who;

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
      const data = await loadRoom(roomId, identity);
      setRoom(data);
      if (!data) setLoadError("Group not found on canister.");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
      setRoom(null);
    } finally {
      setLoading(false);
    }
  }, [roomId, identity]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useGhEventStream({
    channel: `gh-room-${roomId}`,
    table: GH_TABLES.rooms,
    filter: `id=eq.${roomId}`,
    onChange: () => {
      void loadRoom(roomId, identity).then((r) => {
        if (r) setRoom(r);
      });
    },
  });

  // Presence while viewing the group (powers “who’s online” for members)
  useEffect(() => {
    if (!isLoggedIn) return;
    return startPresenceHeartbeat(() => {
      const p = principal || user?.principal || user?.id;
      const name = profile?.username || user?.username || p;
      if (!p || !name) return null;
      return {
        principal: p,
        username: name,
        game: room?.game || profile?.games?.[0],
      };
    });
  }, [isLoggedIn, principal, profile, user, room?.game]);

  if (loading) {
    return (
      <VStack py="phi8" gap="2">
        <GhSpinner />
        <Text fontSize="sm" color="fg.muted">
          Loading group…
        </Text>
      </VStack>
    );
  }

  if (!room) {
    return (
      <VStack align="stretch" gap="phi4" pb="phi4" pt="phi2">
        <GhEmptyState
          icon={Hash}
          title="Group not found"
          description={
            loadError ??
            "This group isn’t on the canister. Local rooms are wiped when gh_backend is redeployed — create a new group from Host booth."
          }
          action={
            <HStack gap="2" flexWrap="wrap" justify="center">
              <Link href="/rooms">
                <GhButton variant="primary" leftIcon={<ArrowLeft size={16} />}>
                  Back to rooms
                </GhButton>
              </Link>
              <Link href="/create?type=room">
                <GhButton variant="prize" leftIcon={<Plus size={16} />}>
                  Create group
                </GhButton>
              </Link>
            </HStack>
          }
        />
      </VStack>
    );
  }

  const isHost =
    who === room.creatorId ||
    who === room.host.username ||
    user?.id === room.creatorId ||
    user?.id === room.host.id;
  const member = isRoomMember(room, who);
  const onlineMembers = room.online.filter((m) => m.status === "online");
  const onlineCount = onlineMembers.length;

  const share = () => {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : chatShareUrl(room.id);
    void navigator.clipboard?.writeText(url);
    ghToast({ title: "Group link copied", description: url, type: "success" });
  };

  const joinRoom = async () => {
    if (!isLoggedIn) {
      void login();
      ghToast({ title: "Sign in to join", type: "error" });
      return;
    }
    if (!who) {
      ghToast({ title: "Sign in to join", type: "error" });
      return;
    }
    try {
      const ok = await joinRoomOnChain(room.id, who, identity);
      if (!ok) throw new Error("Already a member or join failed");
      ghToast({ title: "Joined group", type: "success" });
      await reload();
    } catch (e) {
      ghToast({
        title: "Join failed",
        description: e instanceof Error ? e.message : String(e),
        type: "error",
      });
    }
  };

  const openCreateGame = () => {
    if (!member && !isHost) {
      ghToast({
        title: "Join the group first",
        description: "Only members can create group games.",
        type: "error",
      });
      return;
    }
    setCreateOpen(true);
    setTab("games");
  };

  const leaveRoom = async () => {
    if (!who) {
      ghToast({ title: "Sign in required", type: "error" });
      return;
    }
    if (isHost) {
      ghToast({
        title: "Host can’t leave",
        description:
          "Transfer or close the group before leaving — room creators stay as host.",
        type: "error",
      });
      return;
    }
    if (!member) {
      ghToast({ title: "You’re not a member of this group", type: "info" });
      return;
    }
    await runProcess({
      title: "Leaving group",
      description: `You’ll leave “${room.name}”.`,
      contextLine: room.name,
      tone: "live",
      steps: [
        { key: "v", label: "Confirm leave", detail: "Member only · not host" },
        { key: "l", label: "Leave on canister", detail: "leaveRoom" },
        { key: "d", label: "Done", detail: "Back to rooms" },
      ],
      successTitle: "Left group",
      successDetail: room.name,
      action: async (setStep) => {
        setStep(0);
        await processBeat();
        setStep(1);
        const ok = await leaveRoomOnChain(room.id, who, identity);
        if (!ok) {
          throw new Error(
            "Leave failed — host can’t leave, or you’re not a member",
          );
        }
        setStep(2);
        await processBeat(300);
        window.location.assign("/rooms");
      },
    });
  };

  return (
    <VStack align="stretch" gap={{ base: "phi4", md: "phi5" }} pb="phi4">
      {/* Hero */}
      <Box
        position="relative"
        borderRadius="3xl"
        borderWidth="1px"
        borderColor="border.brand"
        overflow="hidden"
        boxShadow="glow"
      >
        <Box position="relative" h={{ base: "9rem", md: "12rem" }}>
          {room.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
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
          ) : (
            <Box
              w="100%"
              h="100%"
              bg="linear-gradient(120deg, rgba(99,102,241,0.35) 0%, rgba(13,11,26,0.95) 55%, rgba(244,63,168,0.2) 100%)"
            />
          )}
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
            <Link href="/rooms">
              <GhButton
                size="sm"
                variant="soft"
                leftIcon={<ArrowLeft size={14} />}
              >
                Rooms
              </GhButton>
            </Link>
            <HStack gap="2">
              {room.live ? (
                <GhBadge tone="live" pulse>
                  Live game
                </GhBadge>
              ) : (
                <GhBadge tone="muted">Community</GhBadge>
              )}
              <GhButton
                size="sm"
                variant="outline"
                leftIcon={<Share2 size={14} />}
                onClick={share}
              >
                Share
              </GhButton>
            </HStack>
          </HStack>
        </Box>

        <Box
          px={{ base: "phi4", md: "phi5" }}
          pb="phi5"
          mt="-3.5rem"
          position="relative"
        >
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
                <Users size={36} color="var(--gh-colors-brand-fg)" />
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
                  {room.name}
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
              <Text
                fontSize="sm"
                color="fg.muted"
                lineHeight="1.55"
                maxW="40rem"
              >
                {room.topic || "Community group — chat, play, climb the board."}
              </Text>
              <HStack
                gap="phi3"
                mt="phi2"
                flexWrap="wrap"
                fontSize="xs"
                color="fg.subtle"
              >
                <HStack gap="1">
                  <Users size={12} />
                  <Text>
                    {room.membersCount} member
                    {room.membersCount === 1 ? "" : "s"}
                  </Text>
                </HStack>
                <HStack gap="1">
                  <Wifi size={12} />
                  <Text>{onlineCount} online</Text>
                </HStack>
                <HStack gap="1">
                  <Gamepad2 size={12} />
                  <Text>
                    {room.activePots.length} open game
                    {room.activePots.length === 1 ? "" : "s"}
                  </Text>
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
                  variant="soft"
                  leftIcon={<Edit3 size={14} />}
                  onClick={() => setEditOpen((v) => !v)}
                >
                  {editOpen ? "Close editor" : "Edit group"}
                </GhButton>
              ) : !member ? (
                <GhButton
                  size="sm"
                  variant="primary"
                  leftIcon={<Users size={14} />}
                  onClick={() => void joinRoom()}
                >
                  Join group
                </GhButton>
              ) : (
                <GhBadge tone="success">Member</GhBadge>
              )}
              <GhButton
                size="sm"
                variant="prize"
                leftIcon={<Plus size={14} />}
                onClick={openCreateGame}
                disabled={!member && !isHost}
              >
                Create group game
              </GhButton>
              <GhButton
                size="sm"
                variant="outline"
                leftIcon={<MessageCircle size={14} />}
                onClick={() => setTab("lounge")}
              >
                Open chat
              </GhButton>
            </HStack>
          </Flex>
        </Box>
      </Box>

      {editOpen && isHost ? (
        <HostEditPanel
          room={room}
          onSaved={(next) => {
            setRoom(next);
            setEditOpen(false);
            ghToast({ title: "Group updated", type: "success" });
          }}
        />
      ) : null}

      <SimpleGrid columns={{ base: 2, sm: 4 }} gap="phi3">
        <MiniStat
          label="Online"
          value={String(onlineCount)}
          icon={<Wifi size={14} />}
          live
        />
        <MiniStat
          label="Open games"
          value={String(room.activePots.length)}
          icon={<Gamepad2 size={14} />}
        />
        <MiniStat
          label="Past games"
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
            value: "lounge",
            label: "Lounge",
            content: (
              <LoungeTab
                room={room}
                meId={meId}
                who={who}
                onChallenge={setChallengeUser}
                onDm={(u) => openDm(u)}
                onCreateGame={openCreateGame}
                canCreate={member || isHost}
              />
            ),
          },
          {
            value: "games",
            label: `Games (${room.activePots.length})`,
            content: (
              <GamesTab
                room={room}
                who={who}
                identity={identity}
                member={member || isHost}
                createOpen={createOpen}
                setCreateOpen={setCreateOpen}
                runProcess={runProcess}
                onReload={() => void reload()}
              />
            ),
          },
          {
            value: "history",
            label: "History",
            content: <HistoryTab room={room} />,
          },
          {
            value: "leaderboard",
            label: "Leaderboard",
            content: <LeaderboardTab room={room} />,
          },
          {
            value: "members",
            label: `Members (${room.membersCount})`,
            content: (
              <MembersTab
                room={room}
                meId={meId}
                who={who}
                onChallenge={setChallengeUser}
                onDm={(u) => openDm(u)}
              />
            ),
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

      {/* Leave group — members only; host cannot leave */}
      {member || isHost ? (
        <GhSurface variant="muted" p="phi4" mt="phi2">
          <Flex
            justify="space-between"
            align={{ base: "stretch", sm: "center" }}
            gap="phi3"
            direction={{ base: "column", sm: "row" }}
          >
            <Box minW="0" flex="1">
              <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
                Leave group
              </Text>
              <Text fontSize="xs" color="fg.muted" mt="0.5" lineHeight="1.45">
                {isHost
                  ? "You’re the group host — creators can’t leave the room."
                  : "Leave this community. You can rejoin later if the group is open."}
              </Text>
            </Box>
            {isHost ? (
              <GhBadge tone="muted">Host · can’t leave</GhBadge>
            ) : (
              <GhButton
                size="sm"
                variant="outline"
                leftIcon={<LogOut size={14} />}
                onClick={() => void leaveRoom()}
                borderColor="danger.solid"
                color="danger.fg"
                _hover={{ bg: "danger.muted" }}
                alignSelf={{ base: "stretch", sm: "center" }}
              >
                Leave group
              </GhButton>
            )}
          </Flex>
        </GhSurface>
      ) : null}

      <GhProcessModal state={processState} onClose={closeProcess} />
    </VStack>
  );
}

/* ─── Lounge (community-style chat + online members) ─── */

function LoungeTab({
  room,
  meId,
  who,
  onChallenge,
  onDm,
  onCreateGame,
  canCreate,
}: {
  room: EsportsRoom;
  meId: string;
  who: string;
  onChallenge: (u: ChatUser) => void;
  onDm: (u: ChatUser) => void;
  onCreateGame: () => void;
  canCreate: boolean;
}) {
  return (
    <Grid
      templateColumns={{ base: "1fr", lg: "minmax(0,1fr) 16rem" }}
      gap="phi3"
      alignItems="stretch"
      minH={{ lg: "32rem" }}
    >
      <GroupChatPanel
        room={room}
        meId={meId}
        onDm={onDm}
      />
      <VStack align="stretch" gap="phi3">
        <GhSurface variant="elevated" p="0" overflow="hidden">
          <Box
            px="phi3"
            py="phi3"
            borderBottomWidth="1px"
            borderColor="border.default"
            bg="blackAlpha.400"
          >
            <HStack justify="space-between" gap="2">
              <HStack gap="2">
                <Wifi size={14} color="var(--gh-colors-live-fg)" />
                <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
                  Online
                </Text>
                <GhBadge tone="live">
                  {room.online.filter((m) => m.status === "online").length}
                </GhBadge>
              </HStack>
            </HStack>
            <Text fontSize="2xs" color="fg.subtle" mt="1">
              Group members only
            </Text>
          </Box>
          <VStack
            align="stretch"
            gap="0"
            maxH={{ base: "14rem", lg: "22rem" }}
            overflowY="auto"
          >
            {room.online.filter((m) => m.status === "online").length === 0 ? (
              <Box p="phi3">
                <Text fontSize="xs" color="fg.muted">
                  No members online right now.
                </Text>
              </Box>
            ) : (
              room.online
                .filter((m) => m.status === "online")
                .map((m, i) => (
                  <MemberCompactRow
                    key={m.id}
                    member={m}
                    isSelf={
                      m.username === who ||
                      m.id === meId ||
                      m.id === who
                    }
                    borderTop={i > 0}
                    onChallenge={() => onChallenge(m)}
                    onDm={() => onDm(m)}
                  />
                ))
            )}
          </VStack>
        </GhSurface>

        <GhSurface variant="glass" p="phi3">
          <HStack gap="2" mb="2">
            <Gamepad2 size={14} color="var(--gh-colors-prize-fg)" />
            <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
              Quick actions
            </Text>
          </HStack>
          <VStack align="stretch" gap="2">
            <GhButton
              size="sm"
              variant="prize"
              leftIcon={<Plus size={14} />}
              onClick={onCreateGame}
              disabled={!canCreate}
            >
              Create group game
            </GhButton>
            {room.activePots[0] ? (
              <Text fontSize="2xs" color="fg.muted">
                Open: {room.activePots[0].game} · {room.activePots[0].players}
              </Text>
            ) : (
              <Text fontSize="2xs" color="fg.muted">
                Poker, FFA, spades, COD… seats apply on the game.
              </Text>
            )}
          </VStack>
        </GhSurface>

        <HostMini host={room.host} />
      </VStack>
    </Grid>
  );
}

function GroupChatPanel({
  room,
  meId,
  onDm,
}: {
  room: EsportsRoom;
  meId: string;
  onDm: (u: ChatUser) => void;
}) {
  const threadId = roomThreadId(room.id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [showBlocks, setShowBlocks] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const { openRoom } = useChat();

  useEffect(() => {
    setBlocked(getBlockedUsernames());
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchMessages(threadId, 80).then((list) => {
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
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [visibleMessages.length]);

  const others = useMemo(
    () =>
      excludeSelfChatUsers(room.online, {
        id: meId,
        username: meId,
      }),
    [room.online, meId],
  );

  const mentionMatches =
    mentionQuery != null
      ? others
          .filter((u) =>
            u.username.toLowerCase().includes(mentionQuery.toLowerCase()),
          )
          .slice(0, 8)
      : [];

  const onInputChange = (value: string) => {
    setInput(value);
    const m = value.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
    if (m) setMentionQuery(m[1] ?? "");
    else setMentionQuery(null);
  };

  const pickMention = (u: ChatUser) => {
    setInput((prev) => prev.replace(/(?:^|\s)@[a-zA-Z0-9_]*$/, " ").trimEnd());
    setMentionQuery(null);
    onDm(u);
    ghToast({
      title: `Private chat · @${u.username}`,
      description: "Opened in the dock.",
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

  return (
    <GhSurface
      variant="elevated"
      p="0"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      minH={{ base: "22rem", lg: "32rem" }}
      borderColor="border.brand"
    >
      <HStack
        px="phi4"
        py="phi3"
        borderBottomWidth="1px"
        borderColor="border.default"
        justify="space-between"
        bg="whiteAlpha.50"
        flexWrap="wrap"
        gap="2"
      >
        <Box minW="0">
          <HStack gap="2">
            <Hash size={16} color="var(--gh-colors-live-fg)" />
            <Text fontFamily="heading" fontWeight="extrabold" lineClamp={1}>
              #{room.name}
            </Text>
            <GhBadge tone="live">Group chat</GhBadge>
          </HStack>
          <Text fontSize="xs" color="fg.muted" mt="0.5" lineClamp={1}>
            Members only · @mention for DMs
          </Text>
        </Box>
        <HStack gap="2">
          <GhButton
            size="sm"
            variant="outline"
            leftIcon={<Settings2 size={14} />}
            onClick={() => setShowBlocks((v) => !v)}
          >
            Controls
          </GhButton>
          <GhButton
            size="sm"
            variant="soft"
            onClick={() => {
              openRoom({ id: room.id, name: room.name });
              ghToast({
                title: "Opened in dock",
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
            <Ban size={14} />
            <Text fontFamily="heading" fontWeight="bold" fontSize="sm">
              Blocked
            </Text>
          </HStack>
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
                  onClick={() => {
                    setBlocked(unblockUser(u));
                    ghToast({ title: `Unblocked @${u}`, type: "success" });
                  }}
                >
                  @{u} · unblock
                </GhButton>
              ))}
            </HStack>
          )}
        </Box>
      ) : null}

      <VStack
        ref={messagesRef}
        align="stretch"
        gap="2"
        flex="1"
        overflowY="auto"
        px="phi4"
        py="phi3"
        maxH={{ base: "16rem", lg: "22rem" }}
        className="gh-scroll-hide"
        css={{
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {visibleMessages.length === 0 ? (
          <GhEmptyState
            icon={MessageCircle}
            title="No messages yet"
            description="Say hi to the group. Type @username for a private DM."
          />
        ) : (
          visibleMessages.map((m) => {
            const mine = m.senderId === meId;
            return (
              <Box
                key={m.id}
                alignSelf={mine ? "flex-end" : "flex-start"}
                maxW="85%"
              >
                <HStack gap="1.5" mb="0.5" flexWrap="wrap">
                  <Text
                    fontFamily="heading"
                    fontSize="xs"
                    fontWeight="extrabold"
                    color="#ffffff"
                  >
                    {mine ? "You" : `@${m.senderId}`}
                  </Text>
                  <Text fontSize="2xs" color="rgba(255,255,255,0.65)">
                    {new Date(m.createdAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </HStack>
                <Box
                  px="3"
                  py="2"
                  borderRadius="xl"
                  bg={mine ? "brand.muted" : "whiteAlpha.100"}
                  borderWidth="1px"
                  borderColor={mine ? "border.brand" : "border.default"}
                >
                  <Text
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                    lineHeight="1.45"
                    color="#ffffff"
                  >
                    {m.body}
                  </Text>
                </Box>
              </Box>
            );
          })
        )}
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
            <HStack
              px="phi3"
              py="2"
              gap="1"
              borderBottomWidth="1px"
              borderColor="border.default"
            >
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
              </Box>
            ))}
          </Box>
        ) : null}
        <HStack gap="2">
          <GhInput
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={`#${room.name} · @user for DM`}
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
  );
}

/* ─── Games (create + open tables) ─── */

function GamesTab({
  room,
  who,
  identity,
  member,
  createOpen,
  setCreateOpen,
  runProcess,
  onReload,
}: {
  room: EsportsRoom;
  who: string;
  identity: ReturnType<typeof useSession>["identity"];
  member: boolean;
  createOpen: boolean;
  setCreateOpen: (v: boolean) => void;
  runProcess: ReturnType<typeof useProcessModal>["runProcess"];
  onReload: () => void;
}) {
  const gameOptions =
    room.games?.length > 0 ? room.games : room.game ? [room.game] : ["Custom"];
  const [game, setGame] = useState(gameOptions[0] || "");
  const [consoleName, setConsoleName] = useState(room.console || "PC");
  const [maxSeats, setMaxSeats] = useState("4");
  const [buyIn, setBuyIn] = useState("1");
  const [rules, setRules] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  /** Table id waiting for winner pick (report score) */
  const [reportPot, setReportPot] = useState<RoomGroupPot | null>(null);
  const [reportWinner, setReportWinner] = useState("");
  /** Local claim ack after settle (no dispute / re-report) */
  const [claimedIds, setClaimedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (gameOptions.length && !gameOptions.includes(game)) {
      setGame(gameOptions[0]!);
    }
  }, [gameOptions, game]);

  const createGame = async () => {
    if (!member) {
      ghToast({ title: "Join the group first", type: "error" });
      return;
    }
    if (!who) {
      ghToast({ title: "Sign in required", type: "error" });
      return;
    }
    if (!game.trim()) {
      ghToast({ title: "Pick a game", type: "error" });
      return;
    }
    const seats = parseInt(maxSeats, 10);
    if (!Number.isFinite(seats) || seats < 2 || seats > 8) {
      ghToast({
        title: "Max seats 2–8",
        description: "Seat cap is for this table only.",
        type: "error",
      });
      return;
    }
    const fee = Math.max(0, parseFloat(buyIn) || 0);
    await runProcess({
      title: "Creating group game",
      description: `Table inside “${room.name}”.`,
      contextLine: `${game} · ${seats} seats`,
      tone: "prize",
      steps: [
        { key: "v", label: "Validating", detail: "Member · seats · buy-in" },
        {
          key: "c",
          label: "Create on canister",
          detail: "createRoomChallenge",
        },
        { key: "d", label: "Open for joins", detail: "Members can sit" },
      ],
      successTitle: "Group game created",
      successDetail: `${game} in ${room.name}`,
      action: async (setStep) => {
        setStep(0);
        await processBeat();
        setStep(1);
        await createRoomGameOnChain(
          {
            creator: who,
            roomId: room.id,
            gameType: game.trim(),
            console: consoleName || "PC",
            maxPlayers: seats,
            entryFeeIcp: fee,
            rules: rules.trim(),
          },
          identity,
        );
        setStep(2);
        setCreateOpen(false);
        setRules("");
        onReload();
        await processBeat(300);
      },
    });
  };

  const joinGame = async (pot: RoomGroupPot) => {
    if (!member) {
      ghToast({ title: "Join the group first", type: "error" });
      return;
    }
    if (!who) {
      ghToast({ title: "Sign in required", type: "error" });
      return;
    }
    if (isSeatedAtTable(pot.participants, who)) {
      ghToast({
        title: "Already seated",
        description: "You're already at this table.",
        type: "info",
      });
      return;
    }
    setJoiningId(pot.id);
    try {
      const ok = await joinRoomGameOnChain(who, pot.id, identity, {
        roomId: room.id,
        entryFeeIcp: pot.buyInIcp,
      });
      if (!ok) {
        throw new Error("Table full, already seated, or not open");
      }
      ghToast({
        title: "Seated",
        description: `${pot.game} · ${pot.players}`,
        type: "success",
      });
      onReload();
    } catch (e) {
      ghToast({
        title: "Could not join",
        description: e instanceof Error ? e.message : String(e),
        type: "error",
      });
    } finally {
      setJoiningId(null);
    }
  };

  const startGame = async (pot: RoomGroupPot) => {
    if (!who) {
      ghToast({ title: "Sign in required", type: "error" });
      return;
    }
    if (!isGameHost(pot, who)) {
      ghToast({
        title: "Game host only",
        description: "Only the table creator can start the game.",
        type: "error",
      });
      return;
    }
    const seated = (pot.participants ?? []).length;
    if (seated < pot.maxPlayers) {
      ghToast({
        title: "Table not full",
        description: `Need ${pot.maxPlayers} seated · ${seated} now.`,
        type: "error",
      });
      return;
    }
    await runProcess({
      title: "Starting group game",
      description: "Marking table live — free-for-all, not a bracket.",
      contextLine: `${pot.game} · ${pot.players}`,
      tone: "live",
      steps: [
        { key: "v", label: "Check seats", detail: "Full table required" },
        { key: "s", label: "Start on canister", detail: "startRoomChallenge" },
        { key: "d", label: "Live", detail: "Host reports score when done" },
      ],
      successTitle: "Game started",
      successDetail: `${pot.game} is live`,
      action: async (setStep) => {
        setStep(0);
        await processBeat();
        setStep(1);
        const ok = await startRoomGameOnChain(who, pot.id, identity);
        if (!ok) {
          throw new Error(
            "Could not start — full seats, open status, and game host required",
          );
        }
        setStep(2);
        onReload();
        await processBeat(300);
      },
    });
  };

  const submitReportScore = async () => {
    if (!reportPot || !who) return;
    if (!reportWinner.trim()) {
      ghToast({ title: "Pick a winner", type: "error" });
      return;
    }
    const pot = reportPot;
    const winner = reportWinner.trim();
    await runProcess({
      title: "Reporting score",
      description: "One winner · no dispute on group games.",
      contextLine: `${pot.game} · winner @${winner}`,
      tone: "prize",
      steps: [
        { key: "v", label: "Validate winner", detail: "Must be seated" },
        {
          key: "r",
          label: "Record winner",
          detail: "recordRoomChallengeWinner",
        },
        { key: "d", label: "Settled", detail: "Winner can claim" },
      ],
      successTitle: "Winner recorded",
      successDetail: `@${winner} · no dispute`,
      action: async (setStep) => {
        setStep(0);
        await processBeat();
        setStep(1);
        const ok = await reportRoomGameWinnerOnChain(
          who,
          pot.id,
          winner,
          identity,
        );
        if (!ok) {
          throw new Error(
            "Report failed — game host, live status, winner must be seated",
          );
        }
        setStep(2);
        setReportPot(null);
        setReportWinner("");
        onReload();
        await processBeat(300);
      },
    });
  };

  const claimWin = async (pot: RoomGroupPot) => {
    if (!who || !pot.winner) return;
    if (!namesMatch(who, pot.winner)) {
      ghToast({ title: "Only the winner can claim", type: "error" });
      return;
    }
    const winnerPrincipal = identity?.getPrincipal?.()?.toText?.() || "";
    if (pot.buyInIcp > 0 && !winnerPrincipal) {
      ghToast({
        title: "Sign in with II",
        description: "ICP claim needs your principal for the play subaccount.",
        type: "error",
      });
      return;
    }
    await runProcess({
      title: "Claiming win",
      description:
        pot.buyInIcp > 0
          ? "Native ICP: winner + room host play subs · platform · vault"
          : "Free FFA · win recorded on the board.",
      contextLine: `${pot.game} · @${pot.winner}`,
      tone: "prize",
      steps: [
        { key: "v", label: "Confirm winner", detail: "You are the winner" },
        {
          key: "c",
          label: pot.buyInIcp > 0 ? "Distribute ICP" : "Record claim",
          detail:
            pot.buyInIcp > 0
              ? "distributeRoomChallengePrizeNativeICP"
              : "No pot",
        },
        { key: "d", label: "Done", detail: "Play subaccount credited" },
      ],
      successTitle: "Claimed",
      successDetail:
        pot.buyInIcp > 0
          ? "ICP sent to play subaccounts (winner · host · vault · platform)"
          : "Win claimed · free table",
      action: async (setStep) => {
        setStep(0);
        await processBeat();
        setStep(1);
        if (pot.buyInIcp > 0 && winnerPrincipal) {
          // Host principal: prefer II principal if host is current user; else room creator text if principal-shaped
          let hostPrincipal = winnerPrincipal;
          const creator = room.creatorId || room.host?.id || "";
          try {
            const { Principal } = await import("@dfinity/principal");
            Principal.fromText(creator);
            hostPrincipal = creator;
          } catch {
            /* keep winner as fallback host if creator is username */
            if (isGameHost(pot, who) || namesMatch(who, room.host?.username || "")) {
              hostPrincipal = winnerPrincipal;
            }
          }
          const r = await claimRoomGamePrize({
            roomId: room.id,
            challengeId: pot.id,
            winnerPrincipal,
            hostPrincipal,
            identity,
          });
          if (!r.ok && !/already paid/i.test(r.err)) {
            throw new Error(r.err || "Native ICP distribute failed");
          }
        }
        setClaimedIds((prev) => new Set(prev).add(pot.id));
        setStep(2);
        onReload();
        await processBeat(200);
      },
    });
  };

  return (
    <VStack align="stretch" gap="phi4">
      <HStack justify="space-between" flexWrap="wrap" gap="2">
        <Box>
          <Text fontFamily="heading" fontWeight="extrabold" fontSize="lg">
            Group games
          </Text>
          <Text fontSize="sm" color="fg.muted">
            Free-for-all tables (not brackets) — any member can host. One winner
            when the table settles. Seats & buy-in live here, not on the group.
          </Text>
        </Box>
        <GhButton
          size="sm"
          variant={createOpen ? "soft" : "prize"}
          leftIcon={<Plus size={14} />}
          onClick={() => setCreateOpen(!createOpen)}
          disabled={!member}
        >
          {createOpen ? "Cancel" : "Create group game"}
        </GhButton>
      </HStack>

      {!member ? (
        <GhAlert tone="warning" title="Members only">
          Join the group to create or sit at tables.
        </GhAlert>
      ) : null}

      {createOpen && member ? (
        <GhSurface variant="prize" p="phi4" borderColor="prize.solid">
          <HStack gap="2" mb="phi3">
            <ListOrdered size={16} color="var(--gh-colors-prize-fg)" />
            <Text fontFamily="heading" fontWeight="extrabold">
              New table / free-for-all
            </Text>
          </HStack>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap="phi3" mb="phi3">
            <GhField label="Game" required helperText="From group tags">
              <select
                value={game}
                onChange={(e) => setGame(e.target.value)}
                style={selectStyle}
              >
                {gameOptions.map((g) => (
                  <option key={g} value={g} style={{ background: "#16132a" }}>
                    {g}
                  </option>
                ))}
              </select>
            </GhField>
            <GhField label="Console">
              <GhInput
                value={consoleName}
                onChange={(e) => setConsoleName(e.target.value)}
              />
            </GhField>
            <GhField label="Max seats" required helperText="2–8">
              <GhInput
                type="number"
                min="2"
                max="8"
                value={maxSeats}
                onChange={(e) => setMaxSeats(e.target.value)}
              />
            </GhField>
            <GhField label="Buy-in (ICP)" helperText="0 = free game">
              <GhInput
                type="number"
                min="0"
                step="0.01"
                value={buyIn}
                onChange={(e) => setBuyIn(e.target.value)}
                tone="prize"
              />
            </GhField>
          </SimpleGrid>
          <GhField label="Rules (optional)" helperText="Format, stream, house rules">
            <GhTextarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="e.g. No limit hold’em · blinds 0.05/0.1 · winner takes pot"
            />
          </GhField>
          <HStack mt="phi3" gap="2">
            <GhButton
              variant="prize"
              leftIcon={<Gamepad2 size={14} />}
              onClick={() => void createGame()}
            >
              Create game
            </GhButton>
            <GhButton variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </GhButton>
          </HStack>
        </GhSurface>
      ) : null}

      <Box>
        <HStack gap="2" mb="phi3">
          <Radio size={16} color="var(--gh-colors-live-fg)" />
          <Text fontFamily="heading" fontWeight="extrabold">
            Open tables
          </Text>
        </HStack>
        <GhAlert tone="live" title="Not a bracket" mb="phi4">
          Free-for-all tables — seats fill, game host starts, reports one
          winner. No dispute. Winner claims. Brackets are separate (Host →
          tournament).
        </GhAlert>

        {reportPot ? (
          <GhSurface variant="prize" p="phi4" borderColor="prize.solid" mb="phi4">
            <Text fontFamily="heading" fontWeight="extrabold" mb="1">
              Report score · {reportPot.game}
            </Text>
            <Text fontSize="xs" color="fg.muted" mb="phi3">
              Pick the single FFA winner. No dispute — result is final.
            </Text>
            <GhField label="Winner" required>
              <select
                value={reportWinner}
                onChange={(e) => setReportWinner(e.target.value)}
                style={selectStyle}
              >
                <option value="" style={{ background: "#16132a" }}>
                  Select seated player…
                </option>
                {(reportPot.participants ?? []).map((p) => (
                  <option key={p} value={p} style={{ background: "#16132a" }}>
                    @{p}
                  </option>
                ))}
              </select>
            </GhField>
            <HStack mt="phi3" gap="2" flexWrap="wrap">
              <GhButton
                variant="prize"
                leftIcon={<Trophy size={14} />}
                onClick={() => void submitReportScore()}
                disabled={!reportWinner}
              >
                Submit winner
              </GhButton>
              <GhButton
                variant="ghost"
                onClick={() => {
                  setReportPot(null);
                  setReportWinner("");
                }}
              >
                Cancel
              </GhButton>
            </HStack>
          </GhSurface>
        ) : null}

        {room.activePots.length === 0 ? (
          <GhEmptyState
            icon={Gamepad2}
            title="No open tables"
            description="Create a free-for-all (poker, COD FFA, spades…) — seats fill here, not a bracket."
            action={
              member ? (
                <GhButton
                  variant="live"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  onClick={() => setCreateOpen(true)}
                >
                  Create group game
                </GhButton>
              ) : undefined
            }
          />
        ) : (
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="phi3">
            {room.activePots.map((p) => (
              <PotCard
                key={p.id}
                pot={p}
                who={who}
                member={member}
                joining={joiningId === p.id}
                claimed={claimedIds.has(p.id)}
                onJoin={() => void joinGame(p)}
                onStart={() => void startGame(p)}
                onReport={() => {
                  setReportPot(p);
                  setReportWinner(p.participants?.[0] || "");
                }}
                onClaim={() => void claimWin(p)}
              />
            ))}
          </Grid>
        )}
      </Box>
    </VStack>
  );
}

/* ─── History + winners ─── */

function HistoryTab({ room }: { room: EsportsRoom }) {
  const settled = room.pastPots.filter((p) => p.status === "settled");
  const other = room.pastPots.filter((p) => p.status !== "settled");

  return (
    <VStack align="stretch" gap="phi4">
      <Box>
        <HStack gap="2" mb="phi2">
          <Trophy size={16} color="var(--gh-colors-prize-fg)" />
          <Text fontFamily="heading" fontWeight="extrabold">
            Winners & settled games
          </Text>
        </HStack>
        <Text fontSize="sm" color="fg.muted" mb="phi3">
          Past group games for this community — pot, seats, and winner.
        </Text>
        {settled.length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            No settled games yet. Finish a table to crown a winner.
          </Text>
        ) : (
          <VStack align="stretch" gap="2">
            {settled.map((p) => (
              <GhSurface key={p.id} variant="glass" p="phi3">
                <Flex
                  justify="space-between"
                  gap="phi3"
                  align={{ base: "flex-start", sm: "center" }}
                  direction={{ base: "column", sm: "row" }}
                >
                  <Box minW="0">
                    <HStack gap="2" mb="1" flexWrap="wrap">
                      <GhBadge tone="success">Settled</GhBadge>
                      <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
                        {p.game}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        {p.players} · {formatIcp(p.potIcp)}
                      </Text>
                    </HStack>
                    <HStack gap="2">
                      <Crown size={14} color="var(--gh-colors-prize-fg)" />
                      <Text fontSize="sm" className="gh-text-prize" fontWeight="bold">
                        {p.winner ? `@${p.winner}` : "Winner TBD"}
                      </Text>
                    </HStack>
                  </Box>
                  <Text fontSize="2xs" color="fg.subtle">
                    {p.startsAt
                      ? new Date(p.startsAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : ""}
                  </Text>
                </Flex>
              </GhSurface>
            ))}
          </VStack>
        )}
      </Box>

      {other.length > 0 ? (
        <Box>
          <HStack gap="2" mb="phi3">
            <Calendar size={16} />
            <Text fontFamily="heading" fontWeight="extrabold">
              Cancelled / other
            </Text>
          </HStack>
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="phi3">
            {other.map((p) => (
              <PotCard key={p.id} pot={p} />
            ))}
          </Grid>
        </Box>
      ) : null}

      {room.pastPots.length === 0 ? (
        <GhEmptyState
          icon={Calendar}
          title="No history yet"
          description="Group game results land here after tables settle."
        />
      ) : null}
    </VStack>
  );
}

/* ─── Leaderboard ─── */

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
              Group leaderboard
            </Text>
          </HStack>
          <Text fontSize="xs" color="fg.subtle">
            Wins · pot earnings in this group only
          </Text>
        </HStack>
      </Box>
      {room.leaderboard.length === 0 ? (
        <Box p="phi4">
          <Text fontSize="sm" color="fg.muted">
            Play and settle group games to climb the board.
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
                    {row.wins}W–{row.losses}L
                  </Text>
                </Box>
              </HStack>
              <Text
                fontFamily="heading"
                fontWeight="extrabold"
                className="gh-text-prize"
              >
                {formatIcp(row.earningsIcp)}
              </Text>
            </Flex>
          ))}
        </VStack>
      )}
    </GhSurface>
  );
}

/* ─── Full member roster ─── */

function MembersTab({
  room,
  meId,
  who,
  onChallenge,
  onDm,
}: {
  room: EsportsRoom;
  meId: string;
  who: string;
  onChallenge: (u: ChatUser) => void;
  onDm: (u: ChatUser) => void;
}) {
  return (
    <VStack align="stretch" gap="phi2">
      <Text fontSize="sm" color="fg.muted">
        All group members. Online status from presence. Challenge or DM anyone
        but yourself.
      </Text>
      {room.online.map((m) => {
        const isSelf =
          m.username === who || m.id === meId || m.id === who;
        return (
          <MemberFullRow
            key={m.id}
            member={m}
            isSelf={isSelf}
            onChallenge={() => onChallenge(m)}
            onDm={() => onDm(m)}
          />
        );
      })}
    </VStack>
  );
}

/* ─── Shared bits ─── */

const selectStyle: React.CSSProperties = {
  width: "100%",
  height: "2.75rem",
  paddingInline: "0.875rem",
  borderRadius: "0.75rem",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(0,0,0,0.35)",
  color: "#f4f2ff",
  fontSize: "0.875rem",
};

function namesMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function isSeatedAtTable(
  participants: string[] | undefined,
  who: string,
): boolean {
  if (!who) return false;
  return (participants ?? []).some((p) => namesMatch(String(p), who));
}

/** Table creator (game host) — not necessarily the room host. */
function isGameHost(pot: RoomGroupPot, who: string): boolean {
  if (!who || !pot.creator) return false;
  return namesMatch(pot.creator, who);
}

function PotCard({
  pot,
  who = "",
  member,
  joining,
  claimed,
  onJoin,
  onStart,
  onReport,
  onClaim,
}: {
  pot: RoomGroupPot;
  who?: string;
  member?: boolean;
  joining?: boolean;
  claimed?: boolean;
  onJoin?: () => void;
  onStart?: () => void;
  onReport?: () => void;
  onClaim?: () => void;
}) {
  const open = pot.status === "open";
  const live = pot.status === "live";
  const settled = pot.status === "settled";
  const seatN = Math.min(8, Math.max(2, pot.maxPlayers || 4));
  const seated = (pot.participants ?? []).filter(Boolean);
  const challengers = seated.map((username) => ({ username }));
  const alreadySeated = isSeatedAtTable(pot.participants, who);
  const full =
    seated.length >= (pot.maxPlayers || seatN) && pot.maxPlayers > 0;
  const gameHost = isGameHost(pot, who);
  const isWinner = Boolean(pot.winner && who && namesMatch(who, pot.winner));

  // CTA priority: claim (winner) → report (game host live) → start (game host full) → join
  let ctaLabel = "View table";
  let ctaDisabled = true;
  let onCta: (() => void) | undefined;
  let hostEarn: string;

  if (settled && pot.winner) {
    hostEarn =
      pot.payoutIcp && pot.payoutIcp > 0
        ? `Winner · @${pot.winner} · ${formatIcp(pot.payoutIcp)}`
        : `Winner · @${pot.winner}`;
    if (isWinner) {
      if (claimed) {
        ctaLabel = "Claimed";
        ctaDisabled = true;
      } else {
        ctaLabel = "Claim win";
        ctaDisabled = false;
        onCta = onClaim;
      }
    } else {
      ctaLabel = `Winner · @${pot.winner}`;
      ctaDisabled = true;
    }
  } else if (live) {
    hostEarn = "Live FFA · game host reports one winner · no dispute";
    if (gameHost) {
      ctaLabel = "Report score";
      ctaDisabled = false;
      onCta = onReport;
    } else if (alreadySeated) {
      ctaLabel = "In progress";
      ctaDisabled = true;
    } else {
      ctaLabel = "Table live";
      ctaDisabled = true;
    }
  } else if (open) {
    hostEarn = full
      ? "Table full · game host can start"
      : pot.buyInIcp > 0
        ? "Seats filling · one winner after start"
        : "Seats filling · free FFA";
    if (full && gameHost) {
      ctaLabel = "Start game";
      ctaDisabled = false;
      onCta = onStart;
    } else if (alreadySeated) {
      ctaLabel = full ? "Waiting for start" : "You're seated";
      ctaDisabled = true;
    } else if (full) {
      ctaLabel = "Table full";
      ctaDisabled = true;
    } else if (member && onJoin) {
      ctaLabel = joining ? "Joining…" : "Join table";
      ctaDisabled = Boolean(joining);
      onCta = joining ? undefined : onJoin;
    } else {
      ctaLabel = "Members only";
      ctaDisabled = true;
    }
  } else {
    hostEarn = pot.winner
      ? `Winner · @${pot.winner}`
      : "Group free-for-all";
  }

  return (
    <MatchCard
      kind="group_game"
      title={pot.title}
      game={pot.game}
      console={pot.console}
      entryFee={
        pot.buyInIcp > 0 ? `${pot.buyInIcp} ICP` : "Free (0 ICP)"
      }
      prizePot={
        pot.potIcp > 0
          ? `${pot.potIcp} ICP`
          : pot.buyInIcp > 0
            ? `${pot.buyInIcp} ICP × seats`
            : "—"
      }
      status={
        live ? "live" : open ? "open" : settled ? "settled" : "open"
      }
      players={pot.players}
      seats={seatN}
      challengers={challengers}
      meta={
        pot.winner
          ? `Winner · @${pot.winner} · no dispute`
          : `FFA · ${pot.maxPlayers} seats · game host starts`
      }
      hostEarn={hostEarn}
      ctaLabel={ctaLabel}
      ctaDisabled={ctaDisabled}
      onCtaClick={onCta}
      betable={pot.betable}
      market={
        pot.betable && pot.marketId
          ? { id: pot.marketId, category: "esports", label: "Group pot" }
          : undefined
      }
    />
  );
}

function MemberCompactRow({
  member,
  isSelf,
  borderTop,
  onChallenge,
  onDm,
}: {
  member: RoomMember;
  isSelf: boolean;
  borderTop: boolean;
  onChallenge: () => void;
  onDm: () => void;
}) {
  return (
    <Box
      px="phi3"
      py="phi2"
      borderTopWidth={borderTop ? "1px" : 0}
      borderColor="border.default"
    >
      <HStack justify="space-between" gap="1" mb="1">
        <HStack gap="2" minW="0">
          <Box position="relative">
            <GhAvatar name={member.username} size="sm" />
            <Box
              position="absolute"
              bottom="0"
              right="0"
              w="2"
              h="2"
              borderRadius="full"
              bg="success.solid"
              borderWidth="1px"
              borderColor="bg.elevated"
            />
          </Box>
          <Box minW="0">
            <HStack gap="1">
              <Text
                fontFamily="heading"
                fontWeight="bold"
                fontSize="xs"
                lineClamp={1}
              >
                @{member.username}
              </Text>
              {member.role === "host" ? (
                <GhBadge tone="prize">Host</GhBadge>
              ) : null}
              {isSelf ? <GhBadge tone="muted">You</GhBadge> : null}
            </HStack>
            <Text fontSize="2xs" color="fg.subtle" lineClamp={1}>
              {member.game || "—"}
            </Text>
          </Box>
        </HStack>
      </HStack>
      {!isSelf ? (
        <HStack gap="1">
          <GhTooltip content="Private chat">
            <GhButton size="sm" variant="soft" onClick={onDm} aria-label="DM">
              <MessageCircle size={12} />
            </GhButton>
          </GhTooltip>
          <GhTooltip content="Challenge">
            <GhButton
              size="sm"
              variant="prize"
              onClick={onChallenge}
              aria-label="Challenge"
            >
              <Swords size={12} />
            </GhButton>
          </GhTooltip>
        </HStack>
      ) : null}
    </Box>
  );
}

function MemberFullRow({
  member,
  isSelf,
  onChallenge,
  onDm,
}: {
  member: RoomMember;
  isSelf: boolean;
  onChallenge: () => void;
  onDm: () => void;
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
      <HStack gap="phi2" minW="0">
        <Box position="relative">
          <GhAvatar name={member.username} size="md" />
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
              <Text
                fontFamily="heading"
                fontWeight="bold"
                fontSize="sm"
                lineClamp={1}
              >
                @{member.username}
              </Text>
            </Link>
            {member.role === "host" ? (
              <GhBadge tone="prize">Host</GhBadge>
            ) : null}
            {isSelf ? <GhBadge tone="muted">You</GhBadge> : null}
            <GhBadge tone={member.status === "online" ? "live" : "muted"}>
              {member.status}
            </GhBadge>
          </HStack>
          <Text fontSize="2xs" color="fg.subtle">
            {member.game || "—"}
          </Text>
        </Box>
      </HStack>
      <HStack gap="1" flexWrap="wrap">
        {!isSelf ? (
          <>
            <GhButton size="sm" variant="soft" onClick={onDm} aria-label="DM">
              <MessageCircle size={14} />
            </GhButton>
            <GhButton
              size="sm"
              variant="prize"
              onClick={onChallenge}
              aria-label="Challenge"
            >
              <Swords size={14} />
            </GhButton>
          </>
        ) : null}
        <Link href={`/profile?u=${encodeURIComponent(member.username)}`}>
          <GhButton size="sm" variant="outline" aria-label="Profile">
            <User size={14} />
          </GhButton>
        </Link>
      </HStack>
    </Flex>
  );
}

function HostMini({ host }: { host: EsportsRoom["host"] }) {
  return (
    <GhSurface variant="glass" p="phi3" borderColor="prize.solid">
      <HStack gap="2" mb="2">
        <Crown size={14} color="var(--gh-colors-prize-fg)" />
        <Text
          fontFamily="heading"
          fontSize="2xs"
          fontWeight="bold"
          letterSpacing="0.1em"
          textTransform="uppercase"
          color="prize.fg"
        >
          Group host
        </Text>
      </HStack>
      <HStack gap="phi2">
        <GhAvatar name={host.username} size="sm" tone="prize" />
        <Box minW="0">
          <Link href={`/profile?u=${encodeURIComponent(host.username)}`}>
            <Text fontFamily="heading" fontWeight="bold" fontSize="sm">
              @{host.username}
            </Text>
          </Link>
          <Text fontSize="2xs" color="fg.subtle">
            {host.record} · {formatIcp(host.earningsIcp)}
          </Text>
        </Box>
      </HStack>
    </GhSurface>
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
      <HStack
        gap="1"
        color={live ? "live.fg" : prize ? "prize.fg" : "fg.muted"}
        mb="1"
      >
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

function HostEditPanel({
  room,
  onSaved,
}: {
  room: EsportsRoom;
  onSaved: (r: EsportsRoom) => void;
}) {
  const [name, setName] = useState(room.name);
  const [topic, setTopic] = useState(room.topic);
  const [coverUrl, setCoverUrl] = useState(
    room.coverUrl || GROUP_COVER_DEFAULT,
  );
  const [avatarUrl, setAvatarUrl] = useState(
    room.avatarUrl || GROUP_AVATAR_DEFAULT,
  );
  const [primaryGame, setPrimaryGame] = useState(room.game);
  const [gamesStr, setGamesStr] = useState(room.games.join(", "));
  const [consoleName, setConsoleName] = useState(room.console || "");
  const [saving, setSaving] = useState(false);
  const { profile, principal, user, identity } = useSession();
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
    setSaving(true);
    try {
      const ok = await updateRoomOnChain(
        room.id,
        who,
        {
          name: name.trim(),
          description: topic.trim(),
          gameTypes: gameList.length ? gameList : [primary],
          console: consoleName.trim() || "PC",
          rules: topic.trim() || room.topic,
          coverUrl: coverUrl.trim() || GROUP_COVER_DEFAULT,
          avatarUrl: avatarUrl.trim() || GROUP_AVATAR_DEFAULT,
        },
        identity,
      );
      if (!ok) throw new Error("updateRoom returned false (host only)");
      const next = await loadRoom(room.id, identity);
      if (next) onSaved(next);
    } catch (e) {
      ghToast({
        title: "Save failed",
        description: e instanceof Error ? e.message : String(e),
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <GhSurface variant="prize" p="phi4" borderColor="prize.solid">
      <HStack gap="2" mb="phi3">
        <Edit3 size={16} color="var(--gh-colors-prize-fg)" />
        <Text fontFamily="heading" fontWeight="extrabold">
          Edit group (host)
        </Text>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap="phi3" mb="phi4">
        <GhField label="Group name">
          <GhInput value={name} onChange={(e) => setName(e.target.value)} />
        </GhField>
        <GhField label="Primary game">
          <GhInput
            value={primaryGame}
            onChange={(e) => setPrimaryGame(e.target.value)}
          />
        </GhField>
        <GhField
          label="Games (comma-separated)"
          helperText="Tags for this community"
        >
          <GhInput
            value={gamesStr}
            onChange={(e) => setGamesStr(e.target.value)}
          />
        </GhField>
        <GhField label="Console / platform">
          <GhInput
            value={consoleName}
            onChange={(e) => setConsoleName(e.target.value)}
          />
        </GhField>
      </SimpleGrid>

      <Box mb="phi4">
        <GhField label="About">
          <GhInput value={topic} onChange={(e) => setTopic(e.target.value)} />
        </GhField>
      </Box>

      {/* Preview strip */}
      <Box
        mb="phi4"
        borderRadius="2xl"
        overflow="hidden"
        borderWidth="1px"
        borderColor="border.default"
        position="relative"
        h="7rem"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl || GROUP_COVER_DEFAULT}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.55)",
          }}
        />
        <Box
          position="absolute"
          left="phi3"
          bottom="phi3"
          w="3.5rem"
          h="3.5rem"
          borderRadius="xl"
          borderWidth="2px"
          borderColor="prize.solid"
          overflow="hidden"
          bg="bg.elevated"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl || GROUP_AVATAR_DEFAULT}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>
        <Text
          position="absolute"
          right="phi3"
          bottom="phi3"
          fontSize="2xs"
          color="whiteAlpha.800"
          fontFamily="heading"
          fontWeight="bold"
        >
          Preview
        </Text>
      </Box>

      {/* Cover presets */}
      <Box mb="phi4">
        <HStack gap="2" mb="phi2">
          <ImageIcon size={14} color="var(--gh-colors-prize-fg)" />
          <Text
            fontFamily="heading"
            fontSize="2xs"
            fontWeight="bold"
            letterSpacing="0.1em"
            textTransform="uppercase"
            color="fg.subtle"
          >
            Cover banner
          </Text>
          <GhBadge tone="muted">Wide · pick one</GhBadge>
        </HStack>
        <Text fontSize="xs" color="fg.muted" mb="phi2">
          Group page hero — tap a preset
        </Text>
        <Grid
          templateColumns="repeat(auto-fill, minmax(5.5rem, 1fr))"
          gap="2"
        >
          {GROUP_COVER_PRESETS.map((c) => {
            const on = coverUrl === c.url;
            return (
              <Box
                key={c.id}
                as="button"
                onClick={() => setCoverUrl(c.url)}
                borderRadius="xl"
                overflow="hidden"
                borderWidth="2px"
                borderColor={on ? "prize.solid" : "border.default"}
                position="relative"
                aspectRatio="16/10"
                cursor="pointer"
                opacity={on ? 1 : 0.78}
                _hover={{ opacity: 1, borderColor: "prize.solid" }}
                title={c.label}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.url}
                  alt={c.label}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                {on ? (
                  <Box
                    position="absolute"
                    inset="0"
                    bg="rgba(244,63,168,0.28)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Check size={16} color="#f43fa8" />
                  </Box>
                ) : null}
              </Box>
            );
          })}
        </Grid>
      </Box>

      {/* Avatar / profile presets */}
      <Box mb="phi4">
        <HStack gap="2" mb="phi2">
          <Users size={14} color="var(--gh-colors-live-fg)" />
          <Text
            fontFamily="heading"
            fontSize="2xs"
            fontWeight="bold"
            letterSpacing="0.1em"
            textTransform="uppercase"
            color="fg.subtle"
          >
            Group profile image
          </Text>
          <GhBadge tone="muted">Square · pick one</GhBadge>
        </HStack>
        <Text fontSize="xs" color="fg.muted" mb="phi2">
          Logo on the group page and room cards
        </Text>
        <Grid
          templateColumns="repeat(auto-fill, minmax(4.25rem, 1fr))"
          gap="2"
        >
          {GROUP_AVATAR_PRESETS.map((a) => {
            const on = avatarUrl === a.url;
            return (
              <Box
                key={a.id}
                as="button"
                onClick={() => setAvatarUrl(a.url)}
                borderRadius="xl"
                overflow="hidden"
                borderWidth="2px"
                borderColor={on ? "live.solid" : "border.default"}
                position="relative"
                aspectRatio="1"
                cursor="pointer"
                opacity={on ? 1 : 0.8}
                _hover={{ opacity: 1, borderColor: "live.solid" }}
                title={a.label}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.url}
                  alt={a.label}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                {on ? (
                  <Box
                    position="absolute"
                    inset="0"
                    bg="rgba(34,211,238,0.25)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Check size={16} color="#22d3ee" />
                  </Box>
                ) : null}
              </Box>
            );
          })}
        </Grid>
      </Box>

      <HStack mt="phi2" gap="2">
        <GhButton
          variant="prize"
          leftIcon={<Save size={14} />}
          onClick={() => void save()}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save group"}
        </GhButton>
      </HStack>
    </GhSurface>
  );
}
