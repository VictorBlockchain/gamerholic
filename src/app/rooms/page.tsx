"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Box,
  Flex,
  Grid,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ModeHeader } from "@/components/spectacle/mode-header";
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
  ArrowRight,
} from "lucide-react";
import {
  formatIcp,
  GROUP_AVATAR_DEFAULT,
  GROUP_COVER_DEFAULT,
  type EsportsRoom,
} from "@/lib/rooms";
import {
  listRoomsFromCanister,
  listRoomsFromMirror,
} from "@/lib/ic/room-service";
import { isCanisterConfigured } from "@/lib/ic/canisters";
import { useGhEventStream } from "@/hooks/use-gh-event-stream";
import { GH_TABLES } from "@/lib/supabase/tables";
import { chatHref } from "@/lib/deep-links";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<EsportsRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Canister is source of truth. Mirror is discovery-only and goes stale after
      // upgrades (rooms are transient on-chain) — never list ghosts that 404 on open.
      if (isCanisterConfigured()) {
        setRooms(await listRoomsFromCanister());
        return;
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
      void load();
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
        title="Community groups"
        description="Host group games (poker (where legal), domino's, cod, or tournaments)"
        badge="Groups · live"
        action={
          <Link href="/create?type=room">
            <GhButton size="sm" variant="prize" leftIcon={<Plus size={16} />}>
              Create group
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
              How groups work
            </Text>
            <Text fontSize="xs" color="fg.subtle">
              Community first · then group games · chat &amp; leaderboard
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
              t: "Group lounge",
              d: "Open the group page for chat and members-only online list — like Community, scoped to your crew.",
            },
            {
              icon: Coins,
              t: "Group games",
              d: "Any member can host poker, FFA, spades, COD tables. Seats & buy-in live on the game, not the group.",
            },
            {
              icon: Trophy,
              t: "History & board",
              d: "Past tables, winners, and a group leaderboard for pot earnings inside this community.",
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

      <SectionDivider label="Open groups" tone="live" my="0" />

      {loading ? (
        <VStack py="phi6" gap="2" mt="phi3">
          <GhSpinner />
          <Text fontSize="sm" color="fg.muted">
            Loading groups…
          </Text>
        </VStack>
      ) : rooms.length === 0 ? (
        <Box mt="phi3">
          <GhEmptyState
            icon={Hash}
            title="No groups yet"
            description={
              isCanisterConfigured()
                ? "No groups on the local canister yet (redeploys wipe transient rooms). Create one from Host booth."
                : "Configure gh_backend canister to list groups."
            }
            action={
              <Link href="/create?type=room">
                <GhButton variant="prize" leftIcon={<Plus size={16} />}>
                  Create group
                </GhButton>
              </Link>
            }
          />
        </Box>
      ) : (
        <Grid
          templateColumns={{
            base: "1fr",
            sm: "repeat(2, 1fr)",
            xl: "repeat(3, 1fr)",
          }}
          gap={{ base: "phi3", md: "phi4" }}
          alignItems="stretch"
          mt="phi4"
        >
          {rooms.map((r) => (
            <RoomLobbyCard key={r.id} room={r} />
          ))}
        </Grid>
      )}

      {/* Footer tip */}
      <GhSurface variant="muted" p="phi3" mt="phi5">
        <HStack gap="2" align="flex-start">
          <Radio
            size={16}
            color="var(--gh-colors-live-fg)"
            style={{ marginTop: 2 }}
          />
          <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
            Create groups from{" "}
            <Text as="span" color="prize.fg" fontWeight="bold">
              Host booth
            </Text>
            . Open a group for chat, members, free-for-all tables, and the board
            — brackets stay under tournaments.
          </Text>
        </HStack>
      </GhSurface>
    </VStack>
  );
}

function RoomLobbyCard({ room: r }: { room: EsportsRoom }) {
  const onlineMembers = r.online.filter((m) => m.status === "online");
  const onlineN = onlineMembers.length;
  const openTables = r.activePots?.length ?? 0;
  const cover = r.coverUrl || r.avatarUrl || GROUP_COVER_DEFAULT;
  const avatar = r.avatarUrl || r.coverUrl || GROUP_AVATAR_DEFAULT;
  const gameTags = (r.games?.length ? r.games : r.game ? [r.game] : []).slice(
    0,
    3,
  );

  return (
    <Link
      href={chatHref(r.id)}
      style={{ textDecoration: "none", height: "100%" }}
    >
      <GhSurface
        variant="elevated"
        p="0"
        h="100%"
        display="flex"
        flexDirection="column"
        position="relative"
        overflow="hidden"
        borderColor={r.live ? "live.solid" : "border.default"}
        boxShadow={r.live ? "glow" : undefined}
        _hover={{
          borderColor: "live.solid",
          boxShadow: "0 0 0 1px rgba(34,211,238,0.45), 0 16px 40px -12px rgba(34,211,238,0.35)",
          transform: "translateY(-3px)",
        }}
        transition="transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease"
      >
        {/* Cover banner */}
        <Box position="relative" h="7.5rem" flexShrink={0}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.55) saturate(1.15)",
            }}
          />
          <Box
            position="absolute"
            inset="0"
            bg="linear-gradient(180deg, rgba(8,6,18,0.15) 0%, rgba(8,6,18,0.92) 100%)"
          />
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            h="2px"
            bg={
              r.live
                ? "linear-gradient(90deg, #22d3ee, #a3ff3d, #f43fa8)"
                : "linear-gradient(90deg, rgba(34,211,238,0.5), transparent 70%)"
            }
          />
          <HStack
            position="absolute"
            top="phi2"
            left="phi3"
            right="phi3"
            justify="space-between"
            zIndex={1}
          >
            {r.live ? (
              <GhBadge tone="live" pulse>
                <Radio size={10} /> Live table
              </GhBadge>
            ) : (
              <GhBadge tone="muted">Open group</GhBadge>
            )}
            {openTables > 0 ? (
              <GhBadge tone="prize">
                {openTables} open game{openTables === 1 ? "" : "s"}
              </GhBadge>
            ) : null}
          </HStack>
        </Box>

        {/* Avatar + title strip */}
        <Box px="phi4" mt="-1.75rem" position="relative" zIndex={1}>
          <Flex gap="phi3" align="flex-end" mb="phi2">
            <Box
              w="3.75rem"
              h="3.75rem"
              borderRadius="xl"
              borderWidth="2px"
              borderColor={r.live ? "live.solid" : "border.brand"}
              overflow="hidden"
              bg="bg.elevated"
              boxShadow="0 8px 24px -8px rgba(0,0,0,0.65)"
              flexShrink={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatar}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
            <Box minW="0" flex="1" pb="0.5">
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
                Host @{r.host?.username || r.creatorId || "—"}
                {r.console ? ` · ${r.console}` : ""}
              </Text>
            </Box>
          </Flex>
        </Box>

        <Flex direction="column" flex="1" px="phi4" pb="phi4" pt="phi1" minH="0">
          {/* Game tags */}
          <HStack gap="1.5" mb="phi2" flexWrap="wrap">
            {gameTags.map((g) => (
              <GhBadge key={g} tone="live">
                <Gamepad2 size={10} /> {g}
              </GhBadge>
            ))}
            {gameTags.length === 0 ? (
              <GhBadge tone="muted">Multi</GhBadge>
            ) : null}
          </HStack>

          <Text
            fontSize="sm"
            color="fg.muted"
            lineClamp={2}
            mb="phi3"
            lineHeight="1.5"
            minH="2.5rem"
          >
            {r.topic || "Community group — lounge, tables, leaderboard."}
          </Text>

          {/* Open tables strip */}
          {openTables > 0 ? (
            <Box
              mb="phi3"
              p="phi2"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="prize.solid"
              bg="prize.muted"
            >
              <HStack gap="1" mb="1.5">
                <Trophy size={12} color="var(--gh-colors-prize-fg)" />
                <Text
                  fontSize="2xs"
                  fontFamily="heading"
                  fontWeight="bold"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                  color="prize.fg"
                >
                  Open tables
                </Text>
              </HStack>
              <HStack gap="1.5" flexWrap="wrap">
                {r.activePots.slice(0, 3).map((p) => (
                  <Box
                    key={p.id}
                    px="2"
                    py="0.5"
                    borderRadius="md"
                    bg="blackAlpha.500"
                    borderWidth="1px"
                    borderColor="whiteAlpha.200"
                  >
                    <Text fontSize="2xs" fontWeight="bold" color="fg.default">
                      {p.game}{" "}
                      <Text as="span" color="fg.subtle" fontWeight="semibold">
                        {p.players}
                      </Text>
                    </Text>
                  </Box>
                ))}
              </HStack>
            </Box>
          ) : (
            <Box
              mb="phi3"
              p="phi2"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="border.default"
              bg="blackAlpha.300"
            >
              <Text fontSize="2xs" color="fg.subtle">
                No open tables — join and host a free-for-all inside.
              </Text>
            </Box>
          )}

          {/* Stats row */}
          <Grid templateColumns="repeat(3, 1fr)" gap="2" mb="phi3">
            <StatPill
              icon={<Users size={12} />}
              label="Members"
              value={String(r.membersCount)}
            />
            <StatPill
              icon={<Wifi size={12} />}
              label="Online"
              value={String(onlineN)}
              live={onlineN > 0}
            />
            <StatPill
              icon={<Trophy size={12} />}
              label="Won"
              value={formatIcp(r.totalWinningsIcp).replace(" ICP", "")}
              prize
              unit="ICP"
            />
          </Grid>

          {/* Online faces + CTA */}
          <Flex
            mt="auto"
            align="center"
            justify="space-between"
            gap="phi2"
            pt="phi3"
            borderTopWidth="1px"
            borderColor="border.default"
          >
            <HStack gap="0" minW="0">
              {onlineMembers.slice(0, 4).map((m, i) => (
                <Box
                  key={m.id}
                  w="7"
                  h="7"
                  borderRadius="full"
                  borderWidth="2px"
                  borderColor="bg.elevated"
                  bg="live.muted"
                  color="live.fg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  ml={i === 0 ? 0 : "-0.45rem"}
                  fontSize="2xs"
                  fontFamily="heading"
                  fontWeight="extrabold"
                  title={`@${m.username}`}
                >
                  {(m.username || "?").slice(0, 1).toUpperCase()}
                </Box>
              ))}
              {onlineN === 0 ? (
                <Text fontSize="2xs" color="fg.subtle">
                  Nobody online
                </Text>
              ) : onlineN > 4 ? (
                <Text fontSize="2xs" color="fg.subtle" ml="1.5">
                  +{onlineN - 4}
                </Text>
              ) : null}
            </HStack>
            <HStack
              gap="1.5"
              px="3"
              py="1.5"
              borderRadius="full"
              bg="live.muted"
              borderWidth="1px"
              borderColor="live.solid"
              color="live.fg"
              flexShrink={0}
            >
              <MessageCircle size={13} />
              <Text
                fontFamily="heading"
                fontSize="2xs"
                fontWeight="extrabold"
                letterSpacing="0.06em"
                textTransform="uppercase"
              >
                Enter
              </Text>
              <ArrowRight size={12} />
            </HStack>
          </Flex>
        </Flex>
      </GhSurface>
    </Link>
  );
}

function StatPill({
  icon,
  label,
  value,
  live,
  prize,
  unit,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  live?: boolean;
  prize?: boolean;
  unit?: string;
}) {
  return (
    <Box
      p="phi2"
      borderRadius="xl"
      borderWidth="1px"
      borderColor={
        prize ? "prize.solid" : live ? "live.solid" : "border.default"
      }
      bg={prize ? "prize.muted" : live ? "live.muted" : "blackAlpha.400"}
      textAlign="center"
    >
      <HStack
        gap="1"
        justify="center"
        mb="0.5"
        color={prize ? "prize.fg" : live ? "live.fg" : "fg.subtle"}
      >
        {icon}
        <Text
          fontSize="2xs"
          fontFamily="heading"
          fontWeight="bold"
          letterSpacing="0.06em"
          textTransform="uppercase"
        >
          {label}
        </Text>
      </HStack>
      <Text
        fontFamily="heading"
        fontWeight="extrabold"
        fontSize="sm"
        className={prize ? "gh-text-prize" : undefined}
        color={live && !prize ? "live.fg" : undefined}
        fontVariantNumeric="tabular-nums"
      >
        {value}
        {unit ? (
          <Text as="span" fontSize="2xs" fontWeight="bold" ml="0.5" opacity={0.8}>
            {unit}
          </Text>
        ) : null}
      </Text>
    </Box>
  );
}
