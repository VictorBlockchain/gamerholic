"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Flex,
  Grid,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ModeHeader } from "@/components/spectacle/mode-header";
import { LiveTicker } from "@/components/spectacle/live-ticker";
import {
  GhBadge,
  GhButton,
  GhEmptyState,
  GhSpinner,
  GhSurface,
  SectionDivider,
} from "@/components/ui";
import Link from "next/link";
import {
  Plus,
  Gamepad2,
  Hash,
  Users,
  Wifi,
  MessageCircle,
  Coins,
  Trophy,
  Radio,
  DoorOpen,
  ChartCandlestick,
  ArrowRight,
} from "lucide-react";
import { formatIcp, type EsportsRoom } from "@/lib/rooms";
import {
  listRoomsFromCanister,
  listRoomsFromMirror,
} from "@/lib/ic/room-service";
import { isCanisterConfigured } from "@/lib/ic/canisters";
import { useGhEventStream } from "@/hooks/use-gh-event-stream";
import { GH_TABLES } from "@/lib/supabase/tables";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<EsportsRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isCanisterConfigured()) {
        const list = await listRoomsFromCanister();
        if (list.length) {
          setRooms(list);
          return;
        }
      }
      setRooms(await listRoomsFromMirror());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useGhEventStream({
    channel: "gh-rooms-page",
    table: GH_TABLES.rooms,
    onChange: () => {
      void listRoomsFromMirror().then(setRooms);
    },
  });

  const liveCount = rooms.filter((r) => r.live).length;
  const totalOnline = rooms.reduce(
    (n, r) => n + r.online.filter((m) => m.status === "online").length,
    0,
  );

  return (
    <VStack align="stretch" gap="0" pb="phi5">
      <ModeHeader
        mode="host"
        icon={Gamepad2}
        title="Esports rooms"
        description="Group lobbies from the canister — chat, pots, leaderboards, member markets."
        badge="Lobbies · live"
        action={
          <Link href="/create?type=room">
            <GhButton size="sm" variant="prize" leftIcon={<Plus size={16} />}>
              Host room
            </GhButton>
          </Link>
        }
      />

      {/* Explainer — same pattern as Moderator console */}
      <GhSurface
        variant="elevated"
        p={{ base: "phi3", md: "phi4" }}
        mb="phi4"
        borderColor="live.solid"
        boxShadow="glow"
      >
        <HStack gap="2" mb="phi3" flexWrap="wrap" align="flex-start">
          <Box
            w="10"
            h="10"
            borderRadius="xl"
            bg="live.muted"
            color="live.fg"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <DoorOpen size={20} />
          </Box>
          <Box minW="0" flex="1">
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              fontSize="md"
              letterSpacing="0.03em"
            >
              How rooms work
            </Text>
            <Text fontSize="xs" color="fg.subtle">
              Shared lobbies · real-time chat · pots &amp; member markets
            </Text>
          </Box>
          {!loading && rooms.length > 0 ? (
            <HStack gap="2" flexWrap="wrap">
              <GhBadge tone="live" pulse={liveCount > 0}>
                {liveCount} live
              </GhBadge>
              <GhBadge tone="muted">
                <Users size={11} /> {totalOnline} online
              </GhBadge>
              <GhBadge tone="muted">{rooms.length} rooms</GhBadge>
            </HStack>
          ) : null}
        </HStack>
        <Grid
          templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
          gap="phi3"
        >
          {[
            {
              icon: MessageCircle,
              t: "Join the lobby",
              d: "Drop into a room chat — Gmail-style dock or full thread. Coordinate loadouts before the match.",
            },
            {
              icon: Coins,
              t: "Pool & play",
              d: "Buy-ins, room pots, and host takes settle with the group game. Track winnings on-chain.",
            },
            {
              icon: ChartCandlestick,
              t: "Optional markets",
              d: "Hosts can open spectator books on lobby outcomes when betable markets go live.",
            },
          ].map((x) => {
            const Icon = x.icon;
            return (
              <Box
                key={x.t}
                p="phi3"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border.default"
                bg="bg.glass"
              >
                <Box color="live.fg" mb="2">
                  <Icon size={18} />
                </Box>
                <Text
                  fontFamily="heading"
                  fontWeight="bold"
                  fontSize="sm"
                  mb="1"
                >
                  {x.t}
                </Text>
                <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
                  {x.d}
                </Text>
              </Box>
            );
          })}
        </Grid>
      </GhSurface>

      <Box mb="phi4">
        <LiveTicker label="Rooms" />
      </Box>

      <SectionDivider label="Open lobbies" tone="live" my="0" />

      {loading ? (
        <VStack py="phi6" gap="2" mt="phi3">
          <GhSpinner />
          <Text fontSize="sm" color="fg.muted">
            Loading rooms…
          </Text>
        </VStack>
      ) : rooms.length === 0 ? (
        <Box mt="phi3">
          <GhEmptyState
            icon={Hash}
            title="No rooms yet"
            description={
              isCanisterConfigured()
                ? "Create one from Host booth — createRoom lands on-chain."
                : "Configure gh_backend canister to list rooms."
            }
            action={
              <Link href="/create?type=room">
                <GhButton variant="prize" leftIcon={<Plus size={16} />}>
                  Host room
                </GhButton>
              </Link>
            }
          />
        </Box>
      ) : (
        <Grid
          templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" }}
          gap="phi3"
          alignItems="stretch"
          mt="phi3"
        >
          {rooms.map((r) => {
            const onlineN = r.online.filter((m) => m.status === "online").length;
            const fillPct =
              r.maxMembers > 0
                ? Math.min(100, Math.round((r.membersCount / r.maxMembers) * 100))
                : 0;
            return (
              <Link
                key={r.id}
                href={`/chat/${encodeURIComponent(r.id)}`}
                style={{ textDecoration: "none", height: "100%" }}
              >
                <GhSurface
                  variant="elevated"
                  p="phi4"
                  h="100%"
                  display="flex"
                  flexDirection="column"
                  position="relative"
                  overflow="hidden"
                  _hover={{
                    borderColor: "live.solid",
                    boxShadow: "glow",
                    transform: "translateY(-2px)",
                  }}
                  transition="all 0.18s ease"
                >
                  {/* Top accent */}
                  <Box
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    h="3px"
                    bg={
                      r.live
                        ? "linear-gradient(90deg, #22d3ee, #a3ff3d)"
                        : "linear-gradient(90deg, rgba(34,211,238,0.35), transparent)"
                    }
                  />

                  <Flex justify="space-between" align="flex-start" gap="2" mb="phi2">
                    <HStack gap="2" minW="0" flex="1" align="flex-start">
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
                        flexShrink={0}
                      >
                        <Hash size={16} />
                      </Box>
                      <Box minW="0">
                        <Text
                          fontFamily="heading"
                          fontWeight="extrabold"
                          fontSize="md"
                          lineClamp={1}
                          letterSpacing="0.02em"
                        >
                          {r.name}
                        </Text>
                        <Text fontSize="2xs" color="fg.subtle" lineClamp={1}>
                          Host @{r.host.username}
                        </Text>
                      </Box>
                    </HStack>
                    {r.live ? (
                      <GhBadge tone="live" pulse flexShrink={0}>
                        <Radio size={10} /> Live
                      </GhBadge>
                    ) : (
                      <GhBadge tone="muted" flexShrink={0}>
                        Idle
                      </GhBadge>
                    )}
                  </Flex>

                  <HStack gap="1.5" mb="phi2" flexWrap="wrap">
                    <GhBadge tone="brand">
                      <Gamepad2 size={11} /> {r.game}
                    </GhBadge>
                  </HStack>

                  <Text
                    fontSize="sm"
                    color="fg.muted"
                    lineClamp={2}
                    mb="phi3"
                    lineHeight="1.45"
                    minH="2.5rem"
                  >
                    {r.topic || "Open lobby — join chat to coordinate."}
                  </Text>

                  {/* Capacity bar */}
                  <Box mb="phi3">
                    <HStack justify="space-between" mb="1">
                      <Text
                        fontSize="2xs"
                        fontFamily="heading"
                        fontWeight="bold"
                        letterSpacing="0.1em"
                        textTransform="uppercase"
                        color="fg.subtle"
                      >
                        Seats
                      </Text>
                      <Text fontSize="2xs" color="fg.muted" fontWeight="bold">
                        {r.membersCount}/{r.maxMembers}
                      </Text>
                    </HStack>
                    <Box
                      h="1.5"
                      borderRadius="full"
                      bg="blackAlpha.500"
                      overflow="hidden"
                    >
                      <Box
                        h="100%"
                        w={`${fillPct}%`}
                        borderRadius="full"
                        bg={r.live ? "live.solid" : "brand.solid"}
                        transition="width 0.2s ease"
                      />
                    </Box>
                  </Box>

                  <HStack
                    gap="phi2"
                    fontSize="xs"
                    color="fg.subtle"
                    flexWrap="wrap"
                    mb="phi3"
                  >
                    <HStack
                      gap="1"
                      px="2"
                      py="1"
                      borderRadius="md"
                      bg="blackAlpha.400"
                      borderWidth="1px"
                      borderColor="border.default"
                    >
                      <Users size={12} />
                      <Text>{r.membersCount} members</Text>
                    </HStack>
                    <HStack
                      gap="1"
                      px="2"
                      py="1"
                      borderRadius="md"
                      bg="blackAlpha.400"
                      borderWidth="1px"
                      borderColor="border.default"
                    >
                      <Wifi size={12} color={onlineN > 0 ? "var(--gh-colors-live-fg)" : undefined} />
                      <Text color={onlineN > 0 ? "live.fg" : undefined}>
                        {onlineN} online
                      </Text>
                    </HStack>
                    <HStack
                      gap="1"
                      px="2"
                      py="1"
                      borderRadius="md"
                      bg="prize.muted"
                      borderWidth="1px"
                      borderColor="prize.solid"
                    >
                      <Trophy size={12} color="var(--gh-colors-prize-fg)" />
                      <Text className="gh-text-prize" fontWeight="bold">
                        {formatIcp(r.totalWinningsIcp)}
                      </Text>
                    </HStack>
                  </HStack>

                  <Flex
                    mt="auto"
                    align="center"
                    justify="space-between"
                    pt="phi2"
                    borderTopWidth="1px"
                    borderColor="border.default"
                  >
                    <HStack gap="1.5" color="live.fg">
                      <MessageCircle size={14} />
                      <Text
                        fontFamily="heading"
                        fontSize="xs"
                        fontWeight="bold"
                        letterSpacing="0.04em"
                      >
                        Open chat
                      </Text>
                    </HStack>
                    <ArrowRight size={14} color="var(--gh-colors-fg-subtle)" />
                  </Flex>
                </GhSurface>
              </Link>
            );
          })}
        </Grid>
      )}

      {/* Footer tip */}
      <GhSurface variant="muted" p="phi3" mt="phi5">
        <HStack gap="2" align="flex-start">
          <Radio size={16} color="var(--gh-colors-live-fg)" style={{ marginTop: 2 }} />
          <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
            Hosts create rooms from{" "}
            <Text as="span" color="prize.fg" fontWeight="bold">
              Host booth
            </Text>
            . Members join via chat; pots and optional spectator markets settle
            with the lobby game.
          </Text>
        </HStack>
      </GhSurface>
    </VStack>
  );
}
