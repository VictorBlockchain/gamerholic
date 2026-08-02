"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  Grid,
  Text,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { ModeHeader } from "@/components/spectacle/mode-header";
import { HostMoneyStrip } from "@/components/spectacle/money-strip";
import { MatchCard } from "@/components/cards/match-card";
import {
  GhButton,
  GhEmptyState,
  GhSurface,
  GhSpinner,
  SectionDivider,
} from "@/components/ui";
import {
  DollarSign,
  Trophy,
  Gamepad2,
  ArrowRight,
  Clapperboard,
} from "lucide-react";
import { useSession } from "@/components/providers/session-context";
import { loadArenaStats } from "@/lib/ic/gamer-service";
import { listTournaments } from "@/lib/ic/tournament-service";
import { listRoomsFromCanister } from "@/lib/ic/room-service";
import { isCanisterConfigured } from "@/lib/ic/canisters";
import type { TournamentDetail } from "@/lib/tournaments";
import type { EsportsRoom } from "@/lib/rooms";

/**
 * Host hub — real canister stats / open events only (no mock feed or fake cards).
 */
export default function HostPage() {
  const { isLoggedIn, principal, profile, identity, login } = useSession();
  const who = profile?.username || principal || "";

  const [loading, setLoading] = useState(true);
  const [bankIcp, setBankIcp] = useState(0);
  const [openTournaments, setOpenTournaments] = useState<TournamentDetail[]>(
    [],
  );
  const [openRooms, setOpenRooms] = useState<EsportsRoom[]>([]);
  const [hostingCount, setHostingCount] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const addr = principal || "";
      const [stats, tours, rooms] = await Promise.all([
        addr
          ? loadArenaStats(addr, identity).catch(() => null)
          : Promise.resolve(null),
        isCanisterConfigured()
          ? listTournaments(identity).catch(() => [] as TournamentDetail[])
          : Promise.resolve([] as TournamentDetail[]),
        isCanisterConfigured()
          ? listRoomsFromCanister(identity).catch(() => [] as EsportsRoom[])
          : Promise.resolve([] as EsportsRoom[]),
      ]);

      if (stats) {
        // Host bank ≈ tournament earnings (e8s→ICP already in service) + subaccount
        setBankIcp(
          Math.max(
            0,
            (stats as { subaccountIcp?: number }).subaccountIcp ?? 0,
          ),
        );
      } else {
        setBankIcp(0);
      }

      const openT = tours.filter(
        (t) => t.status === "open" || t.status === "live",
      );
      setOpenTournaments(openT.slice(0, 6));

      const openR = rooms.filter(
        (r) => r.status === "open" || r.live || r.status === "live",
      );
      setOpenRooms(openR.slice(0, 6));

      if (who) {
        const hostingT = tours.filter(
          (t) =>
            t.hostUsername === who ||
            t.hostUsername === addr ||
            (t.status !== "settled" && t.status !== "cancelled"),
        ).filter(
          (t) => t.hostUsername === who || t.hostUsername === addr,
        );
        const hostingR = rooms.filter(
          (r) =>
            r.creatorId === who ||
            r.creatorId === addr ||
            r.host?.username === who ||
            r.host?.username === addr ||
            r.host?.id === addr,
        );
        setHostingCount(hostingT.length + hostingR.length);
      } else {
        setHostingCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [principal, identity, who]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const estCut = useMemo(() => {
    // Rough estimate: sum open tournament pots * host fee % when known
    let cut = 0;
    for (const t of openTournaments) {
      const pot = Number(t.prizePotIcp ?? t.entryFeeIcp * (t.maxPlayers || 0));
      const pct = Number(t.hostFeePct ?? 0);
      if (Number.isFinite(pot) && Number.isFinite(pct)) {
        cut += pot * (pct / 100);
      }
    }
    return Math.round(cut * 100) / 100;
  }, [openTournaments]);

  const opportunities = useMemo(() => {
    const cards: React.ReactNode[] = [];
    for (const t of openTournaments) {
      cards.push(
        <MatchCard
          key={`t-${t.id}`}
          kind="tournament"
          title={t.title}
          game={t.game}
          console={t.console}
          stake={`${t.entryFeeIcp} ICP entry`}
          status={t.status === "live" ? "live" : "open"}
          players={`${t.entrants?.length ?? 0}/${t.maxPlayers}`}
          hostEarn={`${t.hostFeePct ?? 0}% host fee`}
          username={t.hostUsername}
        />,
      );
    }
    for (const r of openRooms) {
      cards.push(
        <MatchCard
          key={`r-${r.id}`}
          kind="room"
          title={r.name}
          game={r.game}
          console={r.console}
          stake={
            r.activePots?.[0]
              ? `Pot ${r.activePots[0].potIcp} ICP`
              : "Pot TBD"
          }
          status={r.live ? "live" : "open"}
          players={`${r.membersCount}/${r.maxMembers}`}
          hostEarn="Room host"
          username={r.host?.username || r.creatorId}
        />,
      );
    }
    return cards;
  }, [openTournaments, openRooms]);

  return (
    <VStack align="stretch" gap="0">
      <ModeHeader
        mode="host"
        icon={Clapperboard}
        title="Take your cut — run the arena"
        description="Tournaments and game rooms pay the host. Set fees, fill seats, settle on-chain. You're the director, not just another entrant."
        badge="Host-to-earn"
        action={
          <HStack gap="2" flexWrap="wrap">
            {!isLoggedIn ? (
              <GhButton variant="primary" size="lg" onClick={() => void login()}>
                Connect
              </GhButton>
            ) : null}
            <Link href="/create?type=tournament">
              <GhButton
                variant="prize"
                size="lg"
                leftIcon={<DollarSign size={18} />}
              >
                Host now
              </GhButton>
            </Link>
          </HStack>
        }
      />

      <HostMoneyStrip
        bankIcp={bankIcp}
        weekIcp={0}
        openPots={openTournaments.length + openRooms.length}
        estCut={estCut}
      />

      <Grid
        templateColumns={{ base: "1fr", md: "1fr 1fr" }}
        gap="phi3"
        mb="phi4"
      >
        <Link href="/create?type=tournament" style={{ textDecoration: "none" }}>
          <GhSurface
            variant="elevated"
            h="100%"
            p="phi4"
            _hover={{ borderColor: "prize.solid" }}
            transition="border-color 0.15s"
          >
            <HStack gap="phi2" mb="phi3">
              <Box
                w="12"
                h="12"
                borderRadius="xl"
                bg="prize.muted"
                color="prize.fg"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Trophy size={24} />
              </Box>
              <Box>
                <Text fontFamily="heading" fontWeight="bold">
                  Host a tournament
                </Text>
                <Text fontSize="xs" color="fg.subtle">
                  Bracket · entry · host bps · finalize
                </Text>
              </Box>
            </HStack>
            <Text fontSize="sm" color="fg.muted" mb="phi3" lineHeight="1.6">
              Players buy in. You set host fee within policy. On completion you
              claim host earnings — your cut is the product.
            </Text>
            <HStack
              color="prize.fg"
              fontSize="sm"
              fontWeight="semibold"
              fontFamily="heading"
            >
              <Text>Create tournament</Text>
              <ArrowRight size={14} />
            </HStack>
          </GhSurface>
        </Link>
        <Link href="/create?type=room" style={{ textDecoration: "none" }}>
          <GhSurface
            variant="elevated"
            h="100%"
            p="phi4"
            _hover={{ borderColor: "live.solid" }}
            transition="border-color 0.15s"
          >
            <HStack gap="phi2" mb="phi3">
              <Box
                w="12"
                h="12"
                borderRadius="xl"
                bg="live.muted"
                color="live.fg"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Gamepad2 size={24} />
              </Box>
              <Box>
                <Text fontFamily="heading" fontWeight="bold">
                  Host a game room
                </Text>
                <Text fontSize="xs" color="fg.subtle">
                  Lobby · pot · settle · host cut
                </Text>
              </Box>
            </HStack>
            <Text fontSize="sm" color="fg.muted" mb="phi3" lineHeight="1.6">
              Customs, party games, community nights. Fill the room, play,
              settle — host take pays you for running the show.
            </Text>
            <HStack
              color="live.fg"
              fontSize="sm"
              fontWeight="semibold"
              fontFamily="heading"
            >
              <Text>Create room</Text>
              <ArrowRight size={14} />
            </HStack>
          </GhSurface>
        </Link>
      </Grid>

      {isLoggedIn && hostingCount > 0 ? (
        <Text fontSize="sm" color="fg.muted" mb="phi3">
          You are hosting {hostingCount} open event
          {hostingCount === 1 ? "" : "s"}.
        </Text>
      ) : null}

      <SectionDivider label="Open events" tone="prize" my="0" />

      <Text fontFamily="heading" fontWeight="bold" mb="phi3" mt="phi3">
        Live host opportunities
      </Text>

      {loading ? (
        <HStack justify="center" py="phi5" color="fg.muted" gap="2">
          <GhSpinner />
          <Text fontSize="sm">Loading from canister…</Text>
        </HStack>
      ) : opportunities.length === 0 ? (
        <GhEmptyState
          icon={Trophy}
          title="No open host events"
          description={
            isCanisterConfigured()
              ? "When tournaments or rooms are open on-chain, they show here. Create one to get started."
              : "Configure NEXT_PUBLIC_GH_BACKEND_CANISTER_ID to load live host events."
          }
          action={
            <Link href="/create?type=tournament">
              <GhButton variant="prize" leftIcon={<Trophy size={16} />}>
                Host a tournament
              </GhButton>
            </Link>
          }
        />
      ) : (
        <Grid
          templateColumns={{
            base: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          }}
          gap="phi3"
          alignItems="stretch"
        >
          {opportunities}
        </Grid>
      )}
    </VStack>
  );
}
