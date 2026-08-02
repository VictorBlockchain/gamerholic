"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Box,
  Flex,
  Grid,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Gamepad2,
  Hash,
  MessageCircle,
  Plus,
  Radio,
  Send,
  Swords,
  User,
  Users,
  Wifi,
} from "lucide-react";
import {
  GhAvatar,
  GhBadge,
  GhButton,
  GhEmptyState,
  GhField,
  GhInput,
  GhProcessModal,
  GhSpinner,
  GhSurface,
  GhTooltip,
  ghToast,
  processBeat,
} from "@/components/ui";
import { useProcessModal } from "@/hooks/use-process-modal";
import { ModeHeader } from "@/components/spectacle/mode-header";
import { useSession } from "@/components/providers/session-context";
import { useChat } from "@/components/chat/chat-context";
import {
  excludeSelfChatUsers,
  type ChatMessage,
  type ChatUser,
} from "@/lib/chat/types";
import {
  fetchMessages,
  sendMessage,
  subscribeMessages,
} from "@/lib/chat/chat-service";
import { sanitizeChatMessage } from "@/lib/chat/sanitize";
import {
  communityThreadId,
  createCommunityRoom,
  GLOBAL_ROOM_ID,
  listCommunityRooms,
  type CommunityRoom,
} from "@/lib/chat/community";
import { listDiscoveryUsers } from "@/lib/ic/gamer-service";
import { startPresenceHeartbeat } from "@/lib/ic/presence-service";
import { getProfileCompleteness } from "@/lib/profile";
import { FALLBACK_GAMES } from "@/lib/chat/demo-data";

function kindIcon(kind: CommunityRoom["kind"]) {
  switch (kind) {
    case "global":
      return Users;
    case "game":
      return Gamepad2;
    case "lfg":
      return Swords;
    case "watch":
      return Radio;
    default:
      return Hash;
  }
}

/**
 * Esports community hub — global lounge, game channels, online list, @DMs.
 */
export function CommunityView() {
  const { isLoggedIn, login, profile, principal, user } = useSession();
  const { openDm } = useChat();
  const { processState, closeProcess, runProcess } = useProcessModal();
  const [rooms, setRooms] = useState<CommunityRoom[]>([]);
  const [activeId, setActiveId] = useState(GLOBAL_ROOM_ID);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState<ChatUser[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [newGame, setNewGame] = useState("");
  const [creating, setCreating] = useState(false);
  /** Active @mention fragment after `@` (null = dropdown closed) */
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  /** Scroll only the message list — never the page (scrollIntoView jumps to the input). */
  const messagesRef = useRef<HTMLDivElement>(null);

  const me =
    profile?.username || user?.username || principal || "";
  const meId = principal || user?.id || me;

  const othersOnline = useMemo(
    () =>
      excludeSelfChatUsers(online, {
        id: user?.id,
        principal: principal || user?.principal,
        username: profile?.username || user?.username,
      }),
    [online, principal, profile?.username, user?.id, user?.principal, user?.username],
  );

  /** Users matching the current @query (prefix first, then contains) */
  const mentionMatches = useMemo(() => {
    if (mentionQuery == null) return [] as ChatUser[];
    const q = mentionQuery.toLowerCase();
    const scored = othersOnline
      .map((u) => {
        const name = u.username.toLowerCase();
        let score = -1;
        if (!q) score = 0;
        else if (name.startsWith(q)) score = 2;
        else if (name.includes(q)) score = 1;
        return { u, score };
      })
      .filter((x) => x.score >= 0)
      .sort(
        (a, b) =>
          b.score - a.score || a.u.username.localeCompare(b.u.username),
      )
      .map((x) => x.u);
    return scored.slice(0, 8);
  }, [mentionQuery, othersOnline]);

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeId) || rooms[0],
    [rooms, activeId],
  );
  const threadId = communityThreadId(activeRoom?.id || GLOBAL_ROOM_ID);

  const loadRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const list = await listCommunityRooms();
      setRooms(list);
      if (!list.some((r) => r.id === activeId) && list[0]) {
        setActiveId(list[0].id);
      }
    } finally {
      setLoadingRooms(false);
    }
  }, [activeId]);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (!isLoggedIn) return;
    return startPresenceHeartbeat(() => {
      const p = principal || user?.principal || user?.id;
      const name = profile?.username || user?.username || p;
      if (!p || !name) return null;
      return {
        principal: p,
        username: name,
        game: user?.game || profile?.games?.[0],
      };
    });
  }, [isLoggedIn, principal, profile, user]);

  useEffect(() => {
    const poll = () => {
      void listDiscoveryUsers().then(setOnline);
    };
    poll();
    const id = window.setInterval(poll, 20_000);
    return () => window.clearInterval(id);
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

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    // Keep newest messages in view without scrolling the document
    el.scrollTop = el.scrollHeight;
  }, [messages, activeId]);

  const resolveMentionUser = (username: string): ChatUser => {
    const hit = online.find(
      (u) => u.username.toLowerCase() === username.toLowerCase(),
    );
    if (hit) return hit;
    return {
      id: username,
      username,
      status: "offline",
    };
  };

  const onInputChange = (value: string) => {
    setInput(value);
    // Trailing @mention fragment — open dropdown of matching online users
    const m = value.match(/(?:^|\s)@([a-zA-Z0-9_-]*)$/);
    if (m) {
      setMentionQuery(m[1] ?? "");
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  const pickMention = (u: ChatUser) => {
    setInput((prev) =>
      prev.replace(/(^|\s)@[a-zA-Z0-9_-]*$/, `$1@${u.username} `),
    );
    setMentionQuery(null);
    setMentionIndex(0);
  };

  const onSend = async () => {
    if (!isLoggedIn) {
      void login();
      ghToast({ title: "Sign in to chat", type: "info" });
      return;
    }
    const complete = getProfileCompleteness(profile);
    if (!complete.ok) {
      ghToast({
        title: "Complete your profile",
        description: complete.message,
        type: "error",
      });
      return;
    }
    const { sanitized, ok, reason, mentions } = sanitizeChatMessage(input);
    if (!ok) {
      ghToast({
        title: "Message blocked",
        description: reason || "Invalid message",
        type: "error",
      });
      return;
    }
    setSending(true);
    try {
      const msg = await sendMessage({
        threadId,
        senderId: meId,
        body: sanitized,
      });
      if (msg) {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
        );
      }
      setInput("");
      setMentionQuery(null);
      // @mentions open Gmail-style DM dock
      for (const m of mentions) {
        if (m === me.toLowerCase()) continue;
        openDm(resolveMentionUser(m));
      }
    } finally {
      setSending(false);
    }
  };

  const onCreateRoom = async () => {
    if (!isLoggedIn) {
      void login();
      return;
    }
    if (newName.trim().length < 3) {
      ghToast({
        title: "Name too short",
        description: "Use at least 3 characters",
        type: "error",
      });
      return;
    }
    setCreating(true);
    await runProcess({
      title: "Creating chatroom",
      description: "Registering a unique community channel.",
      contextLine: newName.trim(),
      tone: "brand",
      steps: [
        {
          key: "validate",
          label: "Checking name",
          detail: "Unique channel title",
        },
        {
          key: "create",
          label: "Creating room",
          detail: newGame ? `Game · ${newGame}` : "Community channel",
        },
        {
          key: "open",
          label: "Opening channel",
          detail: "Switching to new room",
        },
      ],
      successTitle: "Chatroom created",
      successDetail: newName.trim(),
      action: async (setStep) => {
        setStep(0);
        await processBeat();
        setStep(1);
        const res = await createCommunityRoom({
          name: newName,
          topic: newTopic,
          game: newGame || undefined,
          creator: me,
          kind: newGame ? "game" : "community",
        });
        if (!res.ok) {
          throw new Error(res.error || "Could not create room");
        }
        setRooms((prev) => [...prev, res.room]);
        setActiveId(res.room.id);
        setCreateOpen(false);
        setNewName("");
        setNewTopic("");
        setNewGame("");
        setStep(2);
        ghToast({
          title: "Chatroom created",
          description: res.room.name,
          type: "success",
        });
      },
    });
    setCreating(false);
  };

  const grouped = useMemo(() => {
    const global = rooms.filter((r) => r.kind === "global");
    const lfg = rooms.filter((r) => r.kind === "lfg" || r.kind === "watch");
    const game = rooms.filter((r) => r.kind === "game");
    const community = rooms.filter((r) => r.kind === "community");
    return { global, lfg, game, community };
  }, [rooms]);

  const renderRoomList = (list: CommunityRoom[], label: string) => {
    if (!list.length) return null;
    return (
      <Box mb="phi3">
        <Text
          fontSize="2xs"
          fontFamily="heading"
          fontWeight="bold"
          letterSpacing="0.12em"
          textTransform="uppercase"
          color="fg.subtle"
          mb="2"
          px="1"
        >
          {label}
        </Text>
        <VStack align="stretch" gap="1">
          {list.map((r) => {
            const Icon = kindIcon(r.kind);
            const active = r.id === activeId;
            return (
              <Box
                key={r.id}
                as="button"
                textAlign="left"
                px="2"
                py="2"
                borderRadius="lg"
                borderWidth="1px"
                borderColor={active ? "border.brand" : "transparent"}
                bg={active ? "brand.muted" : "transparent"}
                _hover={{ bg: active ? "brand.muted" : "whiteAlpha.50" }}
                onClick={() => setActiveId(r.id)}
              >
                <HStack gap="2">
                  <Icon size={14} style={{ opacity: 0.85, flexShrink: 0 }} />
                  <Box minW="0">
                    <Text
                      fontFamily="heading"
                      fontWeight="bold"
                      fontSize="sm"
                      lineClamp={1}
                    >
                      {r.name}
                    </Text>
                    {r.game ? (
                      <Text fontSize="2xs" color="fg.subtle" lineClamp={1}>
                        {r.game}
                      </Text>
                    ) : null}
                  </Box>
                </HStack>
              </Box>
            );
          })}
        </VStack>
      </Box>
    );
  };

  return (
    <VStack align="stretch" gap="phi4" pb="phi4">
      <ModeHeader
        mode="default"
        icon={Users}
        title="Community"
        description="Global lounge · game channels · LFG · @mention for DMs"
        badge="Esports chat"
        action={
          <GhButton
            size="sm"
            variant="primary"
            leftIcon={<Plus size={14} />}
            onClick={() => setCreateOpen((o) => !o)}
          >
            Create chatroom
          </GhButton>
        }
      />

      {createOpen ? (
        <GhSurface variant="brand" p="phi4">
          <Text fontFamily="heading" fontWeight="extrabold" mb="phi3">
            New community chatroom
          </Text>
          <Text fontSize="sm" color="fg.muted" mb="phi3">
            Names must be unique. Only Gamerholic / ICP links allowed in chat.
          </Text>
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr auto" }} gap="phi3" alignItems="end">
            <GhField label="Name" required>
              <GhInput
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Ranked grinders"
              />
            </GhField>
            <GhField label="Topic">
              <GhInput
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="What is this room for?"
              />
            </GhField>
            <GhField label="Game (optional)">
              <select
                value={newGame}
                onChange={(e) => setNewGame(e.target.value)}
                style={{
                  width: "100%",
                  height: "2.75rem",
                  borderRadius: "1rem",
                  border: "1px solid var(--gh-colors-border-default)",
                  background: "var(--gh-colors-bg-elevated)",
                  color: "inherit",
                  padding: "0 0.75rem",
                }}
              >
                <option value="">Community</option>
                {FALLBACK_GAMES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </GhField>
            <GhButton
              variant="primary"
              onClick={() => void onCreateRoom()}
              disabled={creating || newName.trim().length < 3}
            >
              {creating ? "Creating…" : "Create"}
            </GhButton>
          </Grid>
        </GhSurface>
      ) : null}

      <Grid
        templateColumns={{ base: "1fr", lg: "14rem minmax(0,1fr) 15rem" }}
        gap="phi3"
        alignItems="stretch"
        minH={{ lg: "32rem" }}
      >
        {/* Channels */}
        <GhSurface variant="elevated" p="phi3" overflow="hidden">
          <Text
            fontFamily="heading"
            fontWeight="extrabold"
            fontSize="sm"
            mb="phi3"
          >
            Channels
          </Text>
          <Box
            maxH={{ base: "12rem", lg: "28rem" }}
            overflowY="auto"
            className="gh-scroll-hide"
            css={{
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {loadingRooms ? (
              <GhSpinner />
            ) : (
              <>
                {renderRoomList(grouped.global, "Global")}
                {renderRoomList(grouped.lfg, "LFG & watch")}
                {renderRoomList(grouped.game, "By game")}
                {renderRoomList(grouped.community, "Community")}
              </>
            )}
          </Box>
        </GhSurface>

        {/* Main chat */}
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
          >
            <Box minW="0">
              <HStack gap="2">
                <Hash size={16} />
                <Text fontFamily="heading" fontWeight="extrabold" lineClamp={1}>
                  {activeRoom?.name || "Gamerholic Lounge"}
                </Text>
                {activeRoom?.kind === "global" ? (
                  <GhBadge tone="live" pulse>
                    Live
                  </GhBadge>
                ) : null}
              </HStack>
              <Text fontSize="xs" color="fg.muted" mt="0.5" lineClamp={1}>
                {activeRoom?.topic || "Community chat"}
              </Text>
            </Box>
          </HStack>

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
            {messages.length === 0 ? (
              <GhEmptyState
                icon={MessageCircle}
                title="No messages yet"
                description="Say hi — @username opens a DM. Only Gamerholic / ICP links allowed."
              />
            ) : (
              messages.map((m) => {
                const mine =
                  m.senderId === meId ||
                  m.senderId === me ||
                  m.senderId === principal;
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
                        letterSpacing="0.03em"
                        color="#ffffff"
                        lineClamp={1}
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
                        {m.body.split(/(@[a-zA-Z0-9_][a-zA-Z0-9_-]{0,31})/g).map((part, i) => {
                          if (part.startsWith("@") && part.length > 1) {
                            const uname = part.slice(1);
                            return (
                              <Text
                                key={i}
                                as="button"
                                color="brand.fg"
                                fontWeight="bold"
                                onClick={() =>
                                  openDm(resolveMentionUser(uname))
                                }
                                _hover={{ textDecoration: "underline" }}
                              >
                                {part}
                              </Text>
                            );
                          }
                          return <span key={i}>{part}</span>;
                        })}
                      </Text>
                    </Box>
                  </Box>
                );
              })
            )}
          </VStack>

          <Box
            px="phi3"
            py="phi3"
            borderTopWidth="1px"
            borderColor="border.default"
            position="relative"
          >
            {mentionQuery != null ? (
              <Box
                position="absolute"
                bottom="100%"
                left="phi3"
                right="phi3"
                mb="1"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border.brand"
                bg="bg.elevated"
                boxShadow="glow"
                maxH="12rem"
                overflowY="auto"
                zIndex={8}
                className="gh-scroll-hide"
              >
                <HStack
                  px="phi3"
                  py="2"
                  gap="1.5"
                  borderBottomWidth="1px"
                  borderColor="border.default"
                  bg="whiteAlpha.50"
                >
                  <Text
                    fontSize="2xs"
                    fontFamily="heading"
                    fontWeight="extrabold"
                    letterSpacing="0.06em"
                    color="brand.fg"
                  >
                    @MENTION
                  </Text>
                  <Text fontSize="2xs" color="fg.subtle">
                    {mentionMatches.length
                      ? "↑↓ select · Enter insert · Esc close"
                      : "No online match"}
                  </Text>
                </HStack>
                {mentionMatches.length === 0 ? (
                  <Box px="phi3" py="phi3">
                    <Text fontSize="xs" color="fg.muted">
                      {othersOnline.length === 0
                        ? "No one else online to mention."
                        : `No match for @${mentionQuery}`}
                    </Text>
                  </Box>
                ) : (
                  mentionMatches.map((u, i) => {
                    const active = i === mentionIndex;
                    return (
                      <HStack
                        key={u.id}
                        as="button"
                        w="100%"
                        textAlign="left"
                        px="phi3"
                        py="2"
                        gap="2"
                        cursor="pointer"
                        bg={active ? "brand.muted" : "transparent"}
                        borderTopWidth={i === 0 ? 0 : "1px"}
                        borderColor="border.default"
                        _hover={{ bg: "brand.muted" }}
                        onMouseEnter={() => setMentionIndex(i)}
                        onClick={() => pickMention(u)}
                      >
                        <GhAvatar
                          name={u.username}
                          size="xs"
                          src={u.avatarUrl}
                        />
                        <Box minW="0" flex="1">
                          <Text
                            fontSize="sm"
                            fontFamily="heading"
                            fontWeight="bold"
                            color="#ffffff"
                            lineClamp={1}
                          >
                            @{u.username}
                          </Text>
                          <Text fontSize="2xs" color="fg.subtle" lineClamp={1}>
                            {u.game || "Online"}
                          </Text>
                        </Box>
                      </HStack>
                    );
                  })
                )}
              </Box>
            ) : null}

            <HStack gap="2">
              <GhInput
                flex="1"
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={
                  isLoggedIn
                    ? "Message · type @ for users · gamerholic links only"
                    : "Sign in to chat"
                }
                onKeyDown={(e) => {
                  if (mentionQuery != null && mentionMatches.length > 0) {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setMentionIndex((i) =>
                        i + 1 >= mentionMatches.length ? 0 : i + 1,
                      );
                      return;
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setMentionIndex((i) =>
                        i <= 0 ? mentionMatches.length - 1 : i - 1,
                      );
                      return;
                    }
                    if (e.key === "Enter" || e.key === "Tab") {
                      e.preventDefault();
                      const pick =
                        mentionMatches[mentionIndex] || mentionMatches[0];
                      if (pick) pickMention(pick);
                      return;
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setMentionQuery(null);
                      return;
                    }
                  }
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void onSend();
                  }
                  if (e.key === "Escape") setMentionQuery(null);
                }}
                disabled={!isLoggedIn}
                autoComplete="off"
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

        {/* Online */}
        <GhSurface variant="elevated" p="0" overflow="hidden" borderColor="live.solid">
          <HStack
            px="phi3"
            py="phi3"
            borderBottomWidth="1px"
            borderColor="border.default"
            justify="space-between"
            bg="whiteAlpha.50"
          >
            <HStack gap="2">
              <Wifi size={14} />
              <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
                Online
              </Text>
            </HStack>
            <GhBadge tone="live" pulse={othersOnline.length > 0}>
              {othersOnline.length}
            </GhBadge>
          </HStack>
          <Box
            maxH={{ base: "12rem", lg: "28rem" }}
            overflowY="auto"
            className="gh-scroll-hide"
            css={{
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {othersOnline.length === 0 ? (
              <Box p="phi3">
                <Text fontSize="xs" color="fg.muted">
                  No one else online yet.
                </Text>
              </Box>
            ) : (
              othersOnline.map((u, i) => (
                <HStack
                  key={u.id}
                  px="phi3"
                  py="1.5"
                  gap="2"
                  borderTopWidth={i === 0 ? 0 : "1px"}
                  borderColor="border.default"
                  _hover={{ bg: "brand.muted" }}
                >
                  <GhAvatar name={u.username} size="xs" src={u.avatarUrl} />
                  <Box minW="0" flex="1">
                    <Text fontFamily="heading" fontWeight="bold" fontSize="xs" lineClamp={1}>
                      @{u.username}
                    </Text>
                    <Text fontSize="2xs" color="fg.subtle" lineClamp={1}>
                      {u.game || "—"}
                    </Text>
                  </Box>
                  <HStack gap="0.5">
                    <GhTooltip content="DM">
                      <GhButton
                        size="xs"
                        variant="soft"
                        minW="7"
                        h="7"
                        px="1.5"
                        onClick={() => openDm(u)}
                      >
                        <MessageCircle size={11} />
                      </GhButton>
                    </GhTooltip>
                    <GhTooltip content="Challenge">
                      <Link href="/challenges">
                        <GhButton size="xs" variant="primary" minW="7" h="7" px="1.5">
                          <Swords size={11} />
                        </GhButton>
                      </Link>
                    </GhTooltip>
                    <GhTooltip content="Profile">
                      <Link href={`/profile?u=${encodeURIComponent(u.username)}`}>
                        <GhButton size="xs" variant="outline" minW="7" h="7" px="1.5">
                          <User size={11} />
                        </GhButton>
                      </Link>
                    </GhTooltip>
                  </HStack>
                </HStack>
              ))
            )}
          </Box>
          <Box px="phi3" py="2" borderTopWidth="1px" borderColor="border.default">
            <Text fontSize="2xs" color="fg.subtle" lineHeight="1.4">
              Tip: type <Text as="span" color="brand.fg" fontWeight="bold">@username</Text> to open a DM window.
            </Text>
          </Box>
        </GhSurface>
      </Grid>

      <GhProcessModal state={processState} onClose={closeProcess} />
    </VStack>
  );
}
