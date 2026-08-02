"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  ArrowRight,
  CalendarClock,
  ChartCandlestick,
  ChevronDown,
  ChevronUp,
  Coins,
  Copy,
  Gamepad2,
  Info,
  Plus,
  RefreshCw,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import {
  GhAlert,
  GhBadge,
  GhButton,
  GhEmptyState,
  GhField,
  GhInput,
  GhSurface,
  GhSwitch,
  GhTextarea,
  ghToast,
} from "@/components/ui";
import { myTeams } from "@/lib/teams";
import { useSession } from "@/components/providers/session-context";
import { createTournament, listTournaments } from "@/lib/ic/tournament-service";
import {
  createRoomOnChain,
  listRoomsFromCanister,
} from "@/lib/ic/room-service";
import { listOfficialGameNames } from "@/lib/ic/gamer-service";
import { isCanisterConfigured } from "@/lib/ic/canisters";
import type { EsportsRoom } from "@/lib/rooms";
import type { TournamentDetail } from "@/lib/tournaments";

export type HostCreateMode = "tournament" | "room";

/** Policy ceiling for host fee % (display + clamp) */
const HOST_FEE_MAX_PCT = 10;
/** Winner share of betable volume (policy placeholder until market config wires %) */
const BETABLE_WINNER_PCT = 8;

/**
 * Host create hub — Tournament or Game Room only.
 * Host fee as % · live max earnings · betable schedule · helper notes.
 */
export function HostCreateView() {
  const params = useSearchParams();
  const router = useRouter();
  const { principal, profile, isLoggedIn, login, identity } = useSession();
  const raw = params.get("type");
  const mode: HostCreateMode = raw === "room" ? "room" : "tournament";
  const [gameOptions, setGameOptions] = useState<string[]>([]);
  const [hostedRooms, setHostedRooms] = useState<EsportsRoom[]>([]);
  const [pastTournaments, setPastTournaments] = useState<TournamentDetail[]>([]);

  const setMode = (m: HostCreateMode) => {
    router.replace(`/create?type=${m}`);
    setFormOpen(true);
  };

  const [formOpen, setFormOpen] = useState(true);
  const [recreateFrom, setRecreateFrom] = useState<TournamentDetail | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<EsportsRoom | null>(null);

  // Tournament
  const [tTitle, setTTitle] = useState("");
  const [tGame, setTGame] = useState<string>("");
  const [tConsole, setTConsole] = useState("PC");
  const [tEntry, setTEntry] = useState("0.5");
  const [tMax, setTMax] = useState("16");
  const [tHostPct, setTHostPct] = useState("2.5");
  const [tDesc, setTDesc] = useState("");
  const [tBetable, setTBetable] = useState(false);
  const [tDate, setTDate] = useState("");
  const [tTime, setTTime] = useState("");
  /** Solo player bracket vs team-entry bracket */
  const [tTeamMode, setTTeamMode] = useState(false);
  const who = profile?.username || principal || "";
  const userTeams = useMemo(() => (who ? myTeams(who) : []), [who]);
  const [tHostTeamId, setTHostTeamId] = useState("");
  useEffect(() => {
    if (userTeams[0]?.id && !tHostTeamId) setTHostTeamId(userTeams[0].id);
  }, [userTeams, tHostTeamId]);
  const hostTeam = userTeams.find((t) => t.id === tHostTeamId);

  // Room
  const [rName, setRName] = useState("");
  const [rGame, setRGame] = useState<string>("");
  const [rConsole, setRConsole] = useState("PC");
  const [rMax, setRMax] = useState("8");
  const [rGroupPot, setRGroupPot] = useState(true);
  const [rBuyIn, setRBuyIn] = useState("1.5");
  const [rTakePct, setRTakePct] = useState("5");
  const [rRules, setRRules] = useState("");
  const [rBetable, setRBetable] = useState(false);
  const [rDate, setRDate] = useState("");
  const [rTime, setRTime] = useState("");

  const tournamentEarnings = useMemo(() => {
    const entry = parseFloat(tEntry);
    const players = parseInt(tMax, 10);
    const hostPct = parseFloat(tHostPct);
    if (
      !Number.isFinite(entry) ||
      entry < 0 ||
      !Number.isFinite(players) ||
      players < 2 ||
      !Number.isFinite(hostPct) ||
      hostPct < 0
    ) {
      return null;
    }
    const pot = entry * players;
    const hostCut = pot * (Math.min(hostPct, HOST_FEE_MAX_PCT) / 100);
    const prizePool = pot - hostCut;
    return {
      entry,
      players,
      hostPct: Math.min(hostPct, HOST_FEE_MAX_PCT),
      pot,
      hostCut,
      prizePool,
      ready: true as const,
    };
  }, [tEntry, tMax, tHostPct]);

  const roomEarnings = useMemo(() => {
    if (!rGroupPot) return null;
    const buyIn = parseFloat(rBuyIn);
    const seats = parseInt(rMax, 10);
    const takePct = parseFloat(rTakePct);
    if (
      !Number.isFinite(buyIn) ||
      buyIn < 0 ||
      !Number.isFinite(seats) ||
      seats < 2 ||
      !Number.isFinite(takePct) ||
      takePct < 0
    ) {
      return null;
    }
    const pot = buyIn * seats;
    const hostCut = pot * (Math.min(takePct, HOST_FEE_MAX_PCT) / 100);
    const prizePool = pot - hostCut;
    return {
      entry: buyIn,
      players: seats,
      hostPct: Math.min(takePct, HOST_FEE_MAX_PCT),
      pot,
      hostCut,
      prizePool,
      ready: true as const,
    };
  }, [rGroupPot, rBuyIn, rMax, rTakePct]);

  const earnings = mode === "tournament" ? tournamentEarnings : roomEarnings;

  const applyRecreate = (t: TournamentDetail) => {
    setRecreateFrom(t);
    setMode("tournament");
    setTTitle(`${t.title} (rerun)`);
    setTGame(t.game);
    setTConsole(t.console);
    setTEntry(String(t.entryFeeIcp || 0.5));
    setTMax(String(t.maxPlayers));
    setTHostPct(String(t.hostFeePct));
    setTDesc(`Recreated from ${t.title}`);
    setFormOpen(true);
    ghToast({
      title: "Template loaded",
      description: `Recreate settings from “${t.title}”`,
      type: "info",
    });
    document
      .getElementById("gh-host-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    void listOfficialGameNames().then((names) => {
      if (names.length) {
        setGameOptions(names);
        setTGame((g) => (g && names.includes(g) ? g : names[0]!));
        setRGame((g) => (g && names.includes(g) ? g : names[0]!));
      }
    });
    if (!isCanisterConfigured()) return;
    const whoName = profile?.username || principal || "";
    void listRoomsFromCanister(identity).then((rooms) => {
      const mine = whoName
        ? rooms.filter(
            (r) =>
              r.creatorId === whoName ||
              r.creatorId === principal ||
              r.host?.username === whoName ||
              r.host?.username === principal ||
              r.host?.id === principal,
          )
        : rooms;
      setHostedRooms(mine);
    });
    void listTournaments(identity).then((list) => {
      const settled = list.filter((t) => t.status === "settled");
      const mine = whoName
        ? settled.filter(
            (t) =>
              t.hostUsername === whoName || t.hostUsername === principal,
          )
        : settled;
      setPastTournaments(mine);
    });
  }, [identity, principal, profile?.username]);

  const selectRoomForPot = (room: EsportsRoom) => {
    setSelectedRoom(room);
    setMode("room");
    setRName(room.name);
    setRGame(room.game);
    setRConsole(room.console || "PC");
    setRMax(String(room.maxMembers));
    setRGroupPot(true);
    setFormOpen(true);
    ghToast({
      title: "Room selected",
      description: `Group pot setup for “${room.name}”`,
      type: "info",
    });
    document
      .getElementById("gh-host-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const validateBetableSchedule = (
    betable: boolean,
    date: string,
    time: string,
  ): string | null => {
    if (!betable) return null;
    if (!date || !time) {
      return "Betable markets require a scheduled start (date + time)";
    }
    const at = new Date(`${date}T${time}:00`);
    if (Number.isNaN(at.getTime())) return "Invalid schedule";
    const min = new Date();
    min.setHours(min.getHours() + 1);
    if (at.getTime() < min.getTime()) {
      return "Betable events must start at least 1 hour from now";
    }
    return null;
  };

  const submitTournament = async () => {
    if (!tTitle.trim()) {
      ghToast({ title: "Title required", type: "error" });
      return;
    }
    if (!isLoggedIn) {
      void login();
      ghToast({ title: "Sign in required", type: "error" });
      return;
    }
    if (!isCanisterConfigured()) {
      ghToast({
        title: "Canister not configured",
        description:
          "Deploy gh_backend and set NEXT_PUBLIC_GH_BACKEND_CANISTER_ID",
        type: "error",
      });
      return;
    }
    if (tTeamMode) {
      if (!tHostTeamId || !hostTeam) {
        ghToast({
          title: "Select your team",
          description: "Team brackets need a host squad — create one on /teams.",
          type: "error",
        });
        return;
      }
    }
    const err = validateBetableSchedule(tBetable, tDate, tTime);
    if (err) {
      ghToast({ title: "Schedule required", description: err, type: "error" });
      return;
    }
    let scheduled: Date | null = null;
    if (tDate && tTime) scheduled = new Date(`${tDate}T${tTime}:00`);
    try {
      const creator = profile?.username || principal;
      const id = await createTournament({
        creator,
        title: tTitle.trim(),
        game: tGame,
        console: tConsole,
        entryFeeIcp: parseFloat(tEntry) || 0,
        maxPlayers: parseInt(tMax, 10) || 16,
        hostFeePct: parseFloat(tHostPct) || 2.5,
        description: tDesc,
        scheduledAt: scheduled,
        betable: tBetable,
        teamEntry: tTeamMode,
      });
      ghToast({
        title: "Tournament created on-chain",
        description: `${tTitle} · ${tEntry} ICP · host ${tHostPct}%${
          tBetable ? " · betable" : ""
        }`,
        type: "success",
      });
      router.push(`/tournaments/${encodeURIComponent(id)}`);
    } catch (e) {
      ghToast({
        title: "Create failed",
        description: e instanceof Error ? e.message : String(e),
        type: "error",
      });
    }
  };

  const submitRoom = async () => {
    if (!rName.trim()) {
      ghToast({ title: "Room name required", type: "error" });
      return;
    }
    if (!isCanisterConfigured()) {
      ghToast({
        title: "Canister not configured",
        description: "Deploy gh_backend and set NEXT_PUBLIC_GH_BACKEND_CANISTER_ID",
        type: "error",
      });
      return;
    }
    try {
      const creator = profile?.username || principal || "";
      if (!creator) throw new Error("Sign in required");
      const id = await createRoomOnChain({
        creator,
        name: rName.trim(),
        description: rRules || `${rGame} room`,
        gameTypes: [rGame],
        console: rConsole,
        rules: rRules,
        imageUrl: "",
      });
      ghToast({
        title: "Room created on-chain",
        description: rGroupPot
          ? `${rName} · buy-in ${rBuyIn} ICP · take ${rTakePct}%${
              rBetable ? " · betable" : ""
            }`
          : `${rName}`,
        type: "success",
      });
      router.push(`/chat/${encodeURIComponent(id)}`);
    } catch (e) {
      ghToast({
        title: "Create room failed",
        description: e instanceof Error ? e.message : String(e),
        type: "error",
      });
    }
  };

  const modeLabel =
    mode === "tournament" ? "Host tournament" : "Host game room";

  return (
    <VStack
      align="stretch"
      gap={{ base: "phi4", md: "phi5" }}
      pb="phi4"
    >
      {/* Hero */}
      <Box
        position="relative"
        borderRadius="3xl"
        borderWidth="1px"
        borderColor="prize.solid"
        overflow="hidden"
        boxShadow="glow-prize"
      >
        <Box
          position="absolute"
          inset="0"
          bg="linear-gradient(120deg, rgba(244,63,168,0.18) 0%, rgba(13,11,26,0.92) 50%, rgba(163,255,61,0.08) 100%)"
        />
        <Box position="relative" p={{ base: "phi4", md: "phi5" }}>
          <GhBadge tone="prize" mb="phi2">
            Host booth
          </GhBadge>
          <Heading
            as="h1"
            fontFamily="heading"
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="extrabold"
            letterSpacing="0.03em"
            textTransform="uppercase"
            lineHeight="1.1"
            mb="phi2"
          >
            Create &{" "}
            <Text as="span" className="gh-text-prize">
              earn
            </Text>
          </Heading>
          <Text fontSize="md" color="fg.muted" maxW="32rem" lineHeight="1.6">
            Host a bracket or game room. Set host fee as a percentage of the pot.
            Optional betable markets need a scheduled start — participants register
            on the market too.
          </Text>
          <HStack gap="phi2" mt="phi3" flexWrap="wrap">
            <GhButton
              size="sm"
              variant="outline"
              onClick={() => router.push("/teams")}
              leftIcon={<Users size={14} />}
            >
              Team management
            </GhButton>
            <GhButton
              size="sm"
              variant="soft"
              onClick={() => router.push("/dashboard")}
            >
              Back to dashboard
            </GhButton>
          </HStack>
        </Box>
      </Box>

      {/* Two primary options */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="phi3">
        <ModeCard
          active={mode === "tournament"}
          icon={Trophy}
          title="Host tournament"
          subtitle="Bracket · host fee %"
          body="Entry fee, max players, start time, host % of pot on finalize. Recreate past brackets in one click."
          onClick={() => setMode("tournament")}
        />
        <ModeCard
          active={mode === "room"}
          icon={Gamepad2}
          title="Host game room"
          subtitle="Lobby · group pot"
          body="Custom lobbies with optional group pot. Pick an existing room to open or refresh a pot game."
          onClick={() => setMode("room")}
        />
      </SimpleGrid>

      {/* History lists */}
      {mode === "tournament" ? (
        <Box>
          <SectionLabel
            icon={<RefreshCw size={14} />}
            title="Your past tournaments"
            hint="Recreate loads settings into the form below"
          />
          {pastTournaments.length === 0 ? (
            <GhEmptyState
              icon={Trophy}
              title="No past tournaments"
              description="Settled brackets from the canister appear here for recreate."
            />
          ) : (
            <VStack align="stretch" gap="phi2">
              {pastTournaments.map((t) => (
                <GhSurface key={t.id} variant="glass" p="phi3">
                  <Flex
                    direction={{ base: "column", sm: "row" }}
                    gap="phi3"
                    justify="space-between"
                    align={{ sm: "center" }}
                  >
                    <Box minW="0">
                      <HStack gap="2" mb="1" flexWrap="wrap">
                        <GhBadge tone="prize">Completed</GhBadge>
                        <Text
                          fontFamily="heading"
                          fontWeight="extrabold"
                          fontSize="sm"
                          lineClamp={1}
                        >
                          {t.title}
                        </Text>
                      </HStack>
                      <Text fontSize="xs" color="fg.muted">
                        {t.game} · {t.console} · entry {t.entryFeeIcp} ICP · host{" "}
                        {t.hostFeePct}% · pot {t.prizePotIcp ?? "—"} ICP
                      </Text>
                      <Text fontSize="2xs" color="fg.subtle" mt="0.5">
                        Settled · {t.scheduledAt || t.createdAt}
                      </Text>
                    </Box>
                    <GhButton
                      size="sm"
                      variant="prize"
                      leftIcon={<Copy size={14} />}
                      onClick={() => applyRecreate(t)}
                      flexShrink={0}
                    >
                      Recreate
                    </GhButton>
                  </Flex>
                </GhSurface>
              ))}
            </VStack>
          )}
        </Box>
      ) : (
        <Box>
          <SectionLabel
            icon={<Gamepad2 size={14} />}
            title="Your game rooms"
            hint="Select a room to create or update a group pot game"
          />
          {hostedRooms.length === 0 ? (
            <GhEmptyState
              icon={Gamepad2}
              title="No game rooms yet"
              description="Create a room below — lives on gh_backend createRoom."
            />
          ) : (
            <VStack align="stretch" gap="phi2">
              {hostedRooms.map((room) => {
                const selected = selectedRoom?.id === room.id;
                return (
                  <GhSurface
                    key={room.id}
                    variant={selected ? "prize" : "glass"}
                    p="phi3"
                    borderColor={selected ? "prize.solid" : undefined}
                  >
                    <Flex
                      direction={{ base: "column", sm: "row" }}
                      gap="phi3"
                      justify="space-between"
                      align={{ sm: "center" }}
                    >
                      <Box minW="0">
                        <HStack gap="2" mb="1" flexWrap="wrap">
                          <GhBadge
                            tone={
                              room.live
                                ? "live"
                                : room.status === "open"
                                  ? "brand"
                                  : "muted"
                            }
                            pulse={room.live}
                          >
                            {room.status}
                          </GhBadge>
                          {room.activePots.length > 0 ? (
                            <GhBadge tone="prize">Group pot</GhBadge>
                          ) : null}
                          <Text
                            fontFamily="heading"
                            fontWeight="extrabold"
                            fontSize="sm"
                            lineClamp={1}
                          >
                            {room.name}
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color="fg.muted">
                          {room.game} · {room.console || "PC"} ·{" "}
                          {room.membersCount}/{room.maxMembers} players
                          {room.activePots[0]
                            ? ` · pot ${room.activePots[0].potIcp} ICP`
                            : ""}
                        </Text>
                      </Box>
                      <GhButton
                        size="sm"
                        variant={selected ? "prize" : "outline"}
                        leftIcon={<Plus size={14} />}
                        onClick={() => selectRoomForPot(room)}
                        flexShrink={0}
                      >
                        {selected ? "Selected" : "Group pot for room"}
                      </GhButton>
                    </Flex>
                  </GhSurface>
                );
              })}
            </VStack>
          )}
        </Box>
      )}

      {/* Max earnings — above form, when economics filled */}
      {earnings ? (
        <HostEarningsPanel
          kind={mode}
          entry={earnings.entry}
          players={earnings.players}
          hostPct={earnings.hostPct}
          pot={earnings.pot}
          hostCut={earnings.hostCut}
          prizePool={earnings.prizePool}
          betable={mode === "tournament" ? tBetable : rBetable}
        />
      ) : (
        <GhSurface variant="muted" p="phi4">
          <HStack gap="2" mb="1" color="fg.subtle">
            <Coins size={16} />
            <Text
              fontFamily="heading"
              fontSize="xs"
              fontWeight="bold"
              letterSpacing="0.12em"
              textTransform="uppercase"
            >
              Max host earnings
            </Text>
          </HStack>
          <Text fontSize="sm" color="fg.muted" lineHeight="1.5">
            Enter{" "}
            {mode === "tournament"
              ? "entry fee, max players, and host fee %"
              : "buy-in, seats, and room take %"}{" "}
            below to preview your cut at a full lobby.
          </Text>
        </GhSurface>
      )}

      {/* Form */}
      <Box id="gh-host-form" scrollMarginTop="5.5rem">
        <GhSurface
          variant={mode === "tournament" ? "prize" : "live"}
          p="0"
          overflow="hidden"
        >
          <Flex
            as="button"
            w="100%"
            align="center"
            justify="space-between"
            px="phi4"
            py="phi3"
            cursor="pointer"
            onClick={() => setFormOpen((v) => !v)}
            _hover={{ bg: "whiteAlpha.50" }}
          >
            <HStack gap="phi2">
              <Box
                w="10"
                h="10"
                borderRadius="xl"
                bg={mode === "tournament" ? "prize.muted" : "live.muted"}
                color={mode === "tournament" ? "prize.fg" : "live.fg"}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderWidth="1px"
                borderColor={
                  mode === "tournament" ? "prize.solid" : "live.solid"
                }
              >
                {mode === "tournament" ? (
                  <Trophy size={18} />
                ) : (
                  <Gamepad2 size={18} />
                )}
              </Box>
              <Box textAlign="left">
                <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
                  {modeLabel}
                  {recreateFrom && mode === "tournament"
                    ? " · recreate"
                    : selectedRoom && mode === "room"
                      ? " · room pot"
                      : ""}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {formOpen
                    ? "In-page form · no modal (II-safe)"
                    : "Show form to continue"}
                </Text>
              </Box>
            </HStack>
            {formOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </Flex>

          {formOpen ? (
            <Box
              px="phi4"
              pb="phi4"
              borderTopWidth="1px"
              borderColor="border.default"
              bg="bg.elevated"
            >
              {mode === "tournament" ? (
                <VStack align="stretch" gap="phi3" pt="phi3">
                  {recreateFrom ? (
                    <GhAlert tone="prize" title="Recreating template">
                      Loaded from “{recreateFrom.title}”. Adjust fields then
                      create.
                    </GhAlert>
                  ) : null}

                  {/* Solo vs team entry */}
                  <Box
                    p="phi3"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={tTeamMode ? "border.brand" : "border.default"}
                    bg={tTeamMode ? "brand.muted" : "blackAlpha.400"}
                  >
                    <HStack justify="space-between" mb="phi2" flexWrap="wrap" gap="2">
                      <HStack gap="2">
                        <Users size={16} color="var(--gh-colors-brand-fg)" />
                        <Text fontFamily="heading" fontSize="sm" fontWeight="bold">
                          Team tournament
                        </Text>
                      </HStack>
                      <GhSwitch
                        checked={tTeamMode}
                        onCheckedChange={setTTeamMode}
                        tone="brand"
                      />
                    </HStack>
                    <Text fontSize="xs" color="fg.muted" lineHeight="1.45" mb="phi2">
                      When on, entries are whole squads (one fee per team). Prizes
                      split by each roster’s win-split %. Manage rosters on{" "}
                      <Text
                        as="span"
                        color="brand.fg"
                        cursor="pointer"
                        onClick={() => router.push("/teams")}
                        textDecoration="underline"
                      >
                        /teams
                      </Text>
                      .
                    </Text>
                    {tTeamMode ? (
                      userTeams.length === 0 ? (
                        <GhAlert tone="warning" title="No teams yet">
                          Create a squad first, then host a team bracket.
                          <Box mt="phi2">
                            <GhButton
                              size="sm"
                              variant="primary"
                              leftIcon={<Users size={14} />}
                              onClick={() => router.push("/teams")}
                            >
                              Go to teams
                            </GhButton>
                          </Box>
                        </GhAlert>
                      ) : (
                        <GhField
                          label="Your host team"
                          required
                          helperText="Squad listed as host / seed 1"
                        >
                          <select
                            value={tHostTeamId}
                            onChange={(e) => setTHostTeamId(e.target.value)}
                            style={{
                              width: "100%",
                              height: "2.75rem",
                              paddingInline: "0.875rem",
                              borderRadius: "0.75rem",
                              border: "1px solid rgba(255,255,255,0.1)",
                              background: "rgba(0,0,0,0.35)",
                              color: "#f4f2ff",
                              fontSize: "0.875rem",
                            }}
                          >
                            {userTeams.map((t) => (
                              <option
                                key={t.id}
                                value={t.id}
                                style={{ background: "#16132a" }}
                              >
                                [{t.tag}] {t.name} · {t.game} · {t.console}
                              </option>
                            ))}
                          </select>
                        </GhField>
                      )
                    ) : null}
                    {tTeamMode && hostTeam ? (
                      <Text fontSize="2xs" color="fg.subtle" mt="phi2">
                        Hosting as [{hostTeam.tag}] · {hostTeam.members.length}{" "}
                        members · entry counts as 1 team slot
                      </Text>
                    ) : null}
                  </Box>

                  <GhField label="Title" required>
                    <GhInput
                      value={tTitle}
                      onChange={(e) => setTTitle(e.target.value)}
                      placeholder={
                        tTeamMode
                          ? "Squad Rumble — team bracket"
                          : "Friday Night Bracket"
                      }
                    />
                  </GhField>
                  <HStack gap="phi2" flexWrap="wrap" align="flex-start">
                    <Box flex="1" minW="10rem">
                      <GhField label="Game" required>
                        <NativeSelect
                          value={tGame}
                          onChange={setTGame}
                          options={[...gameOptions]}
                        />
                      </GhField>
                    </Box>
                    <Box flex="1" minW="8rem">
                      <GhField label="Console">
                        <GhInput
                          value={tConsole}
                          onChange={(e) => setTConsole(e.target.value)}
                        />
                      </GhField>
                    </Box>
                  </HStack>
                  <HStack gap="phi2" flexWrap="wrap" align="flex-start">
                    <Box flex="1" minW="7rem">
                      <GhField label="Entry fee (ICP)" required>
                        <GhInput
                          type="number"
                          min="0"
                          step="0.01"
                          value={tEntry}
                          onChange={(e) => setTEntry(e.target.value)}
                          tone="prize"
                        />
                      </GhField>
                    </Box>
                    <Box flex="1" minW="7rem">
                      <GhField
                        label={tTeamMode ? "Max teams" : "Max players"}
                        helperText={
                          tTeamMode ? "Whole squads in bracket" : undefined
                        }
                      >
                        <GhInput
                          type="number"
                          min="2"
                          max="128"
                          value={tMax}
                          onChange={(e) => setTMax(e.target.value)}
                        />
                      </GhField>
                    </Box>
                    <Box flex="1" minW="7rem">
                      <GhField
                        label="Host fee (%)"
                        helperText={`e.g. 1 · 1.5 · 2 · max ${HOST_FEE_MAX_PCT}%`}
                      >
                        <GhInput
                          type="number"
                          min="0"
                          max={HOST_FEE_MAX_PCT}
                          step="0.1"
                          value={tHostPct}
                          onChange={(e) => setTHostPct(e.target.value)}
                          tone="prize"
                        />
                      </GhField>
                    </Box>
                  </HStack>

                  <BetableBlock
                    betable={tBetable}
                    onBetable={(on) => setTBetable(on)}
                    date={tDate}
                    time={tTime}
                    onDate={setTDate}
                    onTime={setTTime}
                    eventLabel="tournament"
                  />

                  <GhField label="Description">
                    <GhTextarea
                      value={tDesc}
                      onChange={(e) => setTDesc(e.target.value)}
                      placeholder="Format, rules, stream links…"
                    />
                  </GhField>
                  <HStack gap="phi2" flexWrap="wrap">
                    <GhButton
                      variant="prize"
                      leftIcon={<Trophy size={16} />}
                      rightIcon={<ArrowRight size={16} />}
                      onClick={submitTournament}
                    >
                      {tTeamMode ? "Create team tournament" : "Create tournament"}
                    </GhButton>
                    <GhButton
                      variant="ghost"
                      onClick={() => setFormOpen(false)}
                    >
                      Hide form
                    </GhButton>
                  </HStack>
                </VStack>
              ) : (
                <VStack align="stretch" gap="phi3" pt="phi3">
                  {selectedRoom ? (
                    <GhAlert tone="live" title="Room selected for group pot">
                      Configuring pot for “{selectedRoom.name}”. Create a new
                      room instead by clearing selection.
                    </GhAlert>
                  ) : null}
                  <GhField label="Room name" required>
                    <GhInput
                      value={rName}
                      onChange={(e) => setRName(e.target.value)}
                      placeholder="Warzone customs"
                    />
                  </GhField>
                  <HStack gap="phi2" flexWrap="wrap" align="flex-start">
                    <Box flex="1" minW="10rem">
                      <GhField label="Game" required>
                        <NativeSelect
                          value={rGame}
                          onChange={setRGame}
                          options={[...gameOptions]}
                        />
                      </GhField>
                    </Box>
                    <Box flex="1" minW="8rem">
                      <GhField label="Console">
                        <GhInput
                          value={rConsole}
                          onChange={(e) => setRConsole(e.target.value)}
                        />
                      </GhField>
                    </Box>
                    <Box flex="1" minW="7rem">
                      <GhField label="Max seats">
                        <GhInput
                          type="number"
                          min="2"
                          max="64"
                          value={rMax}
                          onChange={(e) => setRMax(e.target.value)}
                        />
                      </GhField>
                    </Box>
                  </HStack>

                  <Box
                    p="phi3"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={rGroupPot ? "prize.solid" : "border.default"}
                    bg={rGroupPot ? "prize.muted" : "blackAlpha.400"}
                  >
                    <HStack justify="space-between" mb="phi2">
                      <Text
                        fontFamily="heading"
                        fontSize="sm"
                        fontWeight="bold"
                        color={rGroupPot ? "prize.fg" : "fg.default"}
                      >
                        Group pot game
                      </Text>
                      <GhSwitch
                        checked={rGroupPot}
                        onCheckedChange={setRGroupPot}
                        tone="prize"
                      />
                    </HStack>
                    <Text fontSize="xs" color="fg.muted" mb="phi2">
                      Players buy in; host take % applies when the room settles.
                    </Text>
                    {rGroupPot ? (
                      <HStack gap="phi2" flexWrap="wrap" align="flex-start">
                        <Box flex="1" minW="7rem">
                          <GhField label="Buy-in (ICP)">
                            <GhInput
                              type="number"
                              min="0"
                              step="0.01"
                              value={rBuyIn}
                              onChange={(e) => setRBuyIn(e.target.value)}
                              tone="prize"
                            />
                          </GhField>
                        </Box>
                        <Box flex="1" minW="7rem">
                          <GhField
                            label="Room take (%)"
                            helperText={`e.g. 1 · 5 · max ${HOST_FEE_MAX_PCT}%`}
                          >
                            <GhInput
                              type="number"
                              min="0"
                              max={HOST_FEE_MAX_PCT}
                              step="0.1"
                              value={rTakePct}
                              onChange={(e) => setRTakePct(e.target.value)}
                              tone="prize"
                            />
                          </GhField>
                        </Box>
                      </HStack>
                    ) : null}
                  </Box>

                  <BetableBlock
                    betable={rBetable}
                    onBetable={(on) => setRBetable(on)}
                    date={rDate}
                    time={rTime}
                    onDate={setRDate}
                    onTime={setRTime}
                    eventLabel="group game"
                  />

                  <GhField label="Lobby rules">
                    <GhTextarea
                      value={rRules}
                      onChange={(e) => setRRules(e.target.value)}
                      placeholder="Squad size, maps, stream required…"
                    />
                  </GhField>

                  <HStack gap="phi2" flexWrap="wrap">
                    <GhButton
                      variant="live"
                      leftIcon={<Gamepad2 size={16} />}
                      rightIcon={<ArrowRight size={16} />}
                      onClick={submitRoom}
                    >
                      {selectedRoom ? "Save group pot" : "Create game room"}
                    </GhButton>
                    {selectedRoom ? (
                      <GhButton
                        variant="outline"
                        onClick={() => {
                          setSelectedRoom(null);
                          setRName("");
                        }}
                      >
                        New room instead
                      </GhButton>
                    ) : null}
                    <GhButton
                      variant="ghost"
                      onClick={() => setFormOpen(false)}
                    >
                      Hide form
                    </GhButton>
                  </HStack>
                </VStack>
              )}
            </Box>
          ) : null}
        </GhSurface>
      </Box>

      {/* Helper notes (replaces Teams moved banner) */}
      <HelperNotes mode={mode} />
    </VStack>
  );
}

function HostEarningsPanel({
  kind,
  entry,
  players,
  hostPct,
  pot,
  hostCut,
  prizePool,
  betable,
}: {
  kind: HostCreateMode;
  entry: number;
  players: number;
  hostPct: number;
  pot: number;
  hostCut: number;
  prizePool: number;
  betable: boolean;
}) {
  return (
    <Box
      position="relative"
      borderRadius="3xl"
      borderWidth="1px"
      borderColor="prize.solid"
      overflow="hidden"
      boxShadow="glow-prize"
    >
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(125deg, rgba(244,63,168,0.2) 0%, rgba(13,11,26,0.95) 50%, rgba(163,255,61,0.1) 100%)"
      />
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        h="1.5"
        bg="linear-gradient(90deg, #f43fa8, #a3ff3d)"
      />
      <Box position="relative" p={{ base: "phi4", md: "phi5" }}>
        <HStack justify="space-between" mb="phi3" flexWrap="wrap" gap="2">
          <HStack gap="2">
            <Box
              w="10"
              h="10"
              borderRadius="xl"
              bg="prize.muted"
              color="prize.fg"
              borderWidth="1px"
              borderColor="prize.solid"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Coins size={18} />
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
                Max host earnings
              </Text>
              <Text fontSize="xs" color="fg.muted">
                Full lobby · {kind === "tournament" ? "entry × players" : "buy-in × seats"}
              </Text>
            </Box>
          </HStack>
          <GhBadge tone="prize" pulse>
            Live preview
          </GhBadge>
        </HStack>

        <HStack align="baseline" gap="2" mb="phi1">
          <Text
            fontFamily="heading"
            fontSize={{ base: "3xl", md: "4xl" }}
            fontWeight="extrabold"
            className="gh-text-prize"
            lineHeight="1"
            fontVariantNumeric="tabular-nums"
          >
            {hostCut.toFixed(2)}
          </Text>
          <Text fontFamily="heading" fontWeight="bold" color="prize.fg" fontSize="lg">
            ICP
          </Text>
        </HStack>
        <Text fontSize="sm" color="fg.muted" mb="phi4">
          Your cut at {hostPct}% of a full {players}-player pot
        </Text>

        <SimpleGrid columns={{ base: 2, sm: 4 }} gap="phi2">
          <EarnCell
            label={kind === "tournament" ? "Entry" : "Buy-in"}
            value={`${entry} ICP`}
          />
          <EarnCell label="Players" value={String(players)} />
          <EarnCell label="Gross pot" value={`${pot.toFixed(2)} ICP`} />
          <EarnCell
            label="Prize pool"
            value={`${prizePool.toFixed(2)} ICP`}
            tone="brand"
          />
        </SimpleGrid>

        {betable ? (
          <HStack
            mt="phi3"
            gap="2"
            p="phi2"
            borderRadius="xl"
            bg="blackAlpha.500"
            borderWidth="1px"
            borderColor="prize.solid"
          >
            <ChartCandlestick size={14} color="var(--gh-colors-prize-fg)" />
            <Text fontSize="xs" color="fg.muted" lineHeight="1.45">
              Betable on — winner of the match earns ~{BETABLE_WINNER_PCT}% of market
              volume (policy). Host cut above is from the entry pot only.
            </Text>
          </HStack>
        ) : null}
      </Box>
    </Box>
  );
}

function EarnCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "brand";
}) {
  return (
    <Box
      p="phi2"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.default"
      bg="blackAlpha.500"
    >
      <Text
        fontSize="2xs"
        color="fg.subtle"
        fontFamily="heading"
        letterSpacing="0.08em"
        textTransform="uppercase"
        mb="0.5"
      >
        {label}
      </Text>
      <Text
        fontFamily="heading"
        fontWeight="extrabold"
        fontSize="sm"
        color={tone === "brand" ? "brand.fg" : "fg.default"}
        fontVariantNumeric="tabular-nums"
      >
        {value}
      </Text>
    </Box>
  );
}

function BetableBlock({
  betable,
  onBetable,
  date,
  time,
  onDate,
  onTime,
  eventLabel,
}: {
  betable: boolean;
  onBetable: (on: boolean) => void;
  date: string;
  time: string;
  onDate: (v: string) => void;
  onTime: (v: string) => void;
  eventLabel: string;
}) {
  return (
    <Box
      p="phi3"
      borderRadius="xl"
      borderWidth="1px"
      borderColor={betable ? "prize.solid" : "border.default"}
      bg={betable ? "prize.muted" : "blackAlpha.400"}
    >
      <HStack justify="space-between" mb="phi2" flexWrap="wrap" gap="2">
        <HStack gap="2">
          <ChartCandlestick size={16} color="var(--gh-colors-prize-fg)" />
          <Text
            fontFamily="heading"
            fontSize="sm"
            fontWeight="bold"
            color="prize.fg"
          >
            Betable market
          </Text>
        </HStack>
        <GhSwitch checked={betable} onCheckedChange={onBetable} tone="prize" />
      </HStack>
      <Text fontSize="xs" color="fg.muted" lineHeight="1.5" mb={betable ? "phi3" : 0}>
        Open an esports market on this {eventLabel}. Spectators wager on the outcome.
        A policy % of betable volume goes to the winner. Start must be scheduled
        ≥ 1 hour out.
      </Text>
      {betable ? (
        <>
          <HStack gap="2" mb="phi2" color="prize.fg">
            <CalendarClock size={14} />
            <Text
              fontFamily="heading"
              fontSize="2xs"
              fontWeight="bold"
              letterSpacing="0.1em"
              textTransform="uppercase"
            >
              Schedule {eventLabel}
            </Text>
          </HStack>
          <HStack gap="phi2" flexWrap="wrap" align="flex-start">
            <Box flex="1" minW="8rem">
              <GhField label="Date" required>
                <GhInput
                  type="date"
                  value={date}
                  onChange={(e) => onDate(e.target.value)}
                />
              </GhField>
            </Box>
            <Box flex="1" minW="8rem">
              <GhField label="Time" required>
                <GhInput
                  type="time"
                  value={time}
                  onChange={(e) => onTime(e.target.value)}
                />
              </GhField>
            </Box>
          </HStack>
        </>
      ) : null}
    </Box>
  );
}

function HelperNotes({ mode }: { mode: HostCreateMode }) {
  const notes =
    mode === "tournament"
      ? [
          {
            icon: ChartCandlestick,
            title: "Betable → winner share",
            body: `If betable is on, ~${BETABLE_WINNER_PCT}% of market volume (policy) goes to the tournament/match winner — separate from your host fee % on the entry pot.`,
          },
          {
            icon: Users,
            title: "Host must be a betable member",
            body: "The tournament host creates the Esports market and must hold Esports category access on betable. Teams/players are free-text outcomes — they do not need betable accounts. Winner fee share pays the tournament escrow; 1% creator fee pays the host.",
          },
          {
            icon: CalendarClock,
            title: "Schedule is required for betable",
            body: "Betable brackets need a public start time at least 1 hour from creation so markets can open with clear odds.",
          },
          {
            icon: Coins,
            title: "Host fee is % of pot",
            body: `Use values like 1, 1.5, or 2.5. Cap is ${HOST_FEE_MAX_PCT}% of the full-lobby pot. Max earnings update live above the form.`,
          },
          {
            icon: Sparkles,
            title: "Team tournament toggle",
            body: "Turn on “Team tournament” above to accept whole squads. Pick your host team; entry is one fee per team and prizes pay out by each roster’s win-split % on /teams.",
          },
        ]
      : [
          {
            icon: ChartCandlestick,
            title: "Betable group games",
            body: `Enable betable to open a market on the room outcome. Winner share (~${BETABLE_WINNER_PCT}% of volume) is independent of room take %.`,
          },
          {
            icon: Users,
            title: "Lobby + market registration",
            body: "Players join the room and must register on the betable market if one is attached — same principal for both.",
          },
          {
            icon: CalendarClock,
            title: "Schedule group pot start",
            body: "Betable group games require a scheduled start ≥ 1 hour out so spectators can find the market.",
          },
          {
            icon: Coins,
            title: "Room take is % of pot",
            body: `Buy-in × seats = pot. Your take is a percent (e.g. 5). Preview max earnings when seats, buy-in, and take % are set.`,
          },
          {
            icon: Info,
            title: "Teams",
            body: "Squad create/manage lives on /teams. Use this booth only for rooms and pots.",
          },
        ];

  return (
    <Box
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="border.default"
      bg="bg.glass"
      backdropFilter="blur(12px)"
      p={{ base: "phi3", md: "phi4" }}
    >
      <HStack gap="2" mb="phi3">
        <Info size={16} color="var(--gh-colors-brand-fg)" />
        <Text
          fontFamily="heading"
          fontWeight="extrabold"
          fontSize="sm"
          letterSpacing="0.04em"
        >
          Host helper notes
        </Text>
      </HStack>
      <VStack align="stretch" gap="phi2">
        {notes.map(({ icon: Icon, title, body }) => (
          <HStack
            key={title}
            align="flex-start"
            gap="phi2"
            p="phi3"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.default"
            bg="blackAlpha.400"
          >
            <Box
              w="8"
              h="8"
              borderRadius="lg"
              bg="brand.muted"
              color="brand.fg"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Icon size={14} />
            </Box>
            <Box minW="0">
              <Text
                fontFamily="heading"
                fontWeight="bold"
                fontSize="sm"
                mb="0.5"
              >
                {title}
              </Text>
              <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
                {body}
              </Text>
            </Box>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}

function ModeCard({
  active,
  icon: Icon,
  title,
  subtitle,
  body,
  onClick,
}: {
  active: boolean;
  icon: typeof Trophy;
  title: string;
  subtitle: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <Box
      as="button"
      textAlign="left"
      onClick={onClick}
      cursor="pointer"
      w="100%"
    >
      <Box
        p="phi4"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor={active ? "prize.solid" : "border.default"}
        bg={active ? "prize.muted" : "bg.glass"}
        backdropFilter="blur(12px)"
        boxShadow={active ? "glow-prize" : undefined}
        transition="all 0.15s"
        h="100%"
        _hover={{ borderColor: "prize.solid", transform: "translateY(-2px)" }}
      >
        <HStack gap="phi2" mb="phi2">
          <Box
            w="12"
            h="12"
            borderRadius="xl"
            bg="prize.muted"
            color="prize.fg"
            borderWidth="1px"
            borderColor="prize.solid"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon size={22} />
          </Box>
          <Box>
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              fontSize="lg"
              letterSpacing="0.02em"
            >
              {title}
            </Text>
            <Text fontSize="xs" color="prize.fg" fontWeight="bold">
              {subtitle}
            </Text>
          </Box>
        </HStack>
        <Text fontSize="sm" color="fg.muted" lineHeight="1.55">
          {body}
        </Text>
        {active ? (
          <GhBadge tone="prize" mt="phi2">
            Selected
          </GhBadge>
        ) : null}
      </Box>
    </Box>
  );
}

function SectionLabel({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <Box mb="phi3">
      <HStack gap="2" mb="0.5">
        <Box color="prize.fg">{icon}</Box>
        <Text fontFamily="heading" fontWeight="extrabold" fontSize="md">
          {title}
        </Text>
      </HStack>
      {hint ? (
        <Text fontSize="xs" color="fg.subtle">
          {hint}
        </Text>
      ) : null}
    </Box>
  );
}

function NativeSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        height: "2.75rem",
        paddingInline: "0.875rem",
        borderRadius: "0.75rem",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(0,0,0,0.35)",
        color: "#f4f2ff",
        fontSize: "0.875rem",
      }}
    >
      {options.map((g) => (
        <option key={g} value={g} style={{ background: "#16132a" }}>
          {g}
        </option>
      ))}
    </select>
  );
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
