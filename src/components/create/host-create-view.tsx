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
  GameChipPicker,
  GhAlert,
  GhBadge,
  GhButton,
  GhEmptyState,
  GhField,
  GhInput,
  GhProcessModal,
  GhSurface,
  GhSwitch,
  GhTextarea,
  ghToast,
  processBeat,
} from "@/components/ui";
import { useProcessModal } from "@/hooks/use-process-modal";
import { myTeams } from "@/lib/teams";
import { useSession } from "@/components/providers/session-context";
import { createTournament, listTournaments } from "@/lib/ic/tournament-service";
import {
  createRoomGameOnChain,
  createRoomOnChain,
  listRoomsFromCanister,
} from "@/lib/ic/room-service";
import { listOfficialGameNames } from "@/lib/ic/gamer-service";
import { isCanisterConfigured } from "@/lib/ic/canisters";
import type { EsportsRoom } from "@/lib/rooms";
import type { TournamentDetail } from "@/lib/tournaments";
import { chatHref, tournamentHref } from "@/lib/deep-links";
import {
  GROUP_AVATAR_DEFAULT,
  GROUP_COVER_DEFAULT,
} from "@/lib/rooms";

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
  const { processState, closeProcess, runProcess } = useProcessModal();
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

  // Room (community group) — games from profile; no max seats here
  const [rName, setRName] = useState("");
  const [rGames, setRGames] = useState<string[]>([]);
  const [rGame, setRGame] = useState<string>("");
  const [rConsole, setRConsole] = useState("PC");
  // Group game (inside a selected room) — max seats / pot apply here only
  const [rMax, setRMax] = useState("8");
  const [rBuyIn, setRBuyIn] = useState("1.5");
  const [rTakePct, setRTakePct] = useState("5");
  const [rRules, setRRules] = useState("");
  const [rBetable, setRBetable] = useState(false);
  const [rDate, setRDate] = useState("");
  const [rTime, setRTime] = useState("");

  /** Games the user plays (profile) — room tags & group-game picker */
  const profileGames = useMemo(() => {
    const fromProfile = profile?.games?.filter(Boolean) ?? [];
    if (fromProfile.length) return fromProfile;
    return gameOptions;
  }, [profile?.games, gameOptions]);

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
    // 0 buy-in = free game (no pot preview needed beyond seats)
    if (buyIn === 0) return null;
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
  }, [rBuyIn, rMax, rTakePct]);

  // Earnings preview only when configuring a group game (room selected)
  const earnings =
    mode === "tournament"
      ? tournamentEarnings
      : selectedRoom
        ? roomEarnings
        : null;

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
      }
    });
    // Prefer profile games for room / group-game pickers
    const pg = profile?.games?.filter(Boolean) ?? [];
    if (pg.length) {
      setRGames((prev) => (prev.length ? prev : [...pg]));
      setRGame((g) => (g && pg.includes(g) ? g : pg[0]!));
    }
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
  }, [identity, principal, profile?.username, profile?.games]);

  /** Select room to create a group game (not re-create the room). */
  const selectRoomForGame = (room: EsportsRoom) => {
    setSelectedRoom(room);
    setMode("room");
    setRName(room.name);
    const roomGames = room.games?.length
      ? room.games
      : room.game
        ? [room.game]
        : profileGames;
    setRGame(roomGames[0] || profileGames[0] || "");
    setRConsole(room.console || "PC");
    setRMax("8");
    setFormOpen(true);
    ghToast({
      title: "Room selected",
      description: `Create a group game for “${room.name}”`,
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
    const creator = profile?.username || principal;
    await runProcess({
      title: "Creating tournament",
      description: "Posting bracket to Internet Computer.",
      contextLine: tTitle.trim(),
      tone: "prize",
      steps: [
        {
          key: "validate",
          label: "Validating host settings",
          detail: "Entry · schedule · host fee",
        },
        {
          key: "create",
          label: "Create on canister",
          detail: "createTournamentEx",
        },
        {
          key: "redirect",
          label: "Opening tournament",
          detail: "Redirect to bracket page",
        },
      ],
      successTitle: "Tournament created",
      successDetail: `${tTitle} · ${tEntry} ICP · host ${tHostPct}%`,
      action: async (setStep) => {
        setStep(0);
        await processBeat();
        setStep(1);
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
        setStep(2);
        ghToast({
          title: "Tournament created on-chain",
          description: `${tTitle} · ${tEntry} ICP · host ${tHostPct}%${
            tBetable ? " · betable" : ""
          }`,
          type: "success",
        });
        await processBeat(400);
        window.location.assign(tournamentHref(id));
      },
    });
  };

  /** Step 1 — create community room only (no seats / pot). */
  const submitRoom = async () => {
    if (selectedRoom) {
      await submitRoomGame();
      return;
    }
    if (!rName.trim()) {
      ghToast({ title: "Room name required", type: "error" });
      return;
    }
    if (!rGames.length) {
      ghToast({
        title: "Pick at least one game",
        description:
          "Games come from your profile. Edit profile if the list is empty.",
        type: "error",
      });
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
    const creator = profile?.username || principal || "";
    if (!creator) {
      ghToast({ title: "Sign in required", type: "error" });
      return;
    }
    await runProcess({
      title: "Creating community room",
      description: "Rooms are groups first — add table games after.",
      contextLine: rName.trim(),
      tone: "live",
      steps: [
        {
          key: "validate",
          label: "Validating community",
          detail: "Name · profile games · no seat cap yet",
        },
        {
          key: "create",
          label: "Create room on canister",
          detail: "createRoom · community group",
        },
        {
          key: "redirect",
          label: "Opening room",
          detail: "Then create group games inside",
        },
      ],
      successTitle: "Room created",
      successDetail: `${rName.trim()} · ${rGames.length} game tag(s)`,
      action: async (setStep) => {
        setStep(0);
        await processBeat();
        setStep(1);
        const id = await createRoomOnChain(
          {
            creator,
            name: rName.trim(),
            description: rRules || `${rName.trim()} community`,
            gameTypes: rGames,
            console: rConsole || "Multi",
            rules: rRules,
            coverUrl: GROUP_COVER_DEFAULT,
            avatarUrl: GROUP_AVATAR_DEFAULT,
          },
          identity,
        );
        setStep(2);
        ghToast({
          title: "Community group created",
          description:
            "Opening group page — chat, members, then create tables inside.",
          type: "success",
        });
        await processBeat(400);
        window.location.assign(chatHref(id));
      },
    });
  };

  /** Step 2 — group game inside a selected room (max seats + buy-in). */
  const submitRoomGame = async () => {
    if (!selectedRoom) {
      ghToast({
        title: "Select a room first",
        description: "Create the community room, then host a group game.",
        type: "error",
      });
      return;
    }
    if (!rGame.trim()) {
      ghToast({ title: "Pick a game", type: "error" });
      return;
    }
    if (
      groupGameOptions.length &&
      !groupGameOptions.includes(rGame.trim())
    ) {
      ghToast({
        title: "Game not in this room",
        description:
          "Group games must use a title tagged on the room (from your profile).",
        type: "error",
      });
      return;
    }
    const seats = parseInt(rMax, 10);
    if (!Number.isFinite(seats) || seats < 2 || seats > 8) {
      ghToast({
        title: "Max seats 2–8",
        description: "Seat cap is for the group game, not the room.",
        type: "error",
      });
      return;
    }
    if (!isCanisterConfigured()) {
      ghToast({ title: "Canister not configured", type: "error" });
      return;
    }
    const creator = profile?.username || principal || "";
    if (!creator) {
      ghToast({ title: "Sign in required", type: "error" });
      return;
    }
    const buyIn = Math.max(0, parseFloat(rBuyIn) || 0);
    const takeNote =
      buyIn > 0 && rTakePct
        ? `Host take target ${rTakePct}% (policy).`
        : buyIn === 0
          ? "Free game (0 ICP buy-in)."
          : "";
    await runProcess({
      title: "Creating group game",
      description: `Table / FFA inside “${selectedRoom.name}”.`,
      contextLine: `${rGame} · ${seats} seats`,
      tone: "prize",
      steps: [
        {
          key: "validate",
          label: "Validating game",
          detail: `Max seats ${seats} · buy-in ${buyIn} ICP`,
        },
        {
          key: "create",
          label: "Create room challenge",
          detail: "createRoomChallenge on canister",
        },
        {
          key: "done",
          label: "Game open",
          detail: "Members can join the table",
        },
      ],
      successTitle: "Group game created",
      successDetail: `${rGame} in ${selectedRoom.name}`,
      action: async (setStep) => {
        setStep(0);
        await processBeat();
        setStep(1);
        const id = await createRoomGameOnChain(
          {
            creator,
            roomId: selectedRoom.id,
            gameType: rGame.trim(),
            console: rConsole || "PC",
            maxPlayers: seats,
            entryFeeIcp: buyIn,
            rules: [rRules.trim(), takeNote].filter(Boolean).join(" · "),
          },
          identity,
        );
        setStep(2);
        ghToast({
          title: "Group game created",
          description: `${rGame} · id ${id}`,
          type: "success",
        });
        await processBeat(400);
        window.location.assign(chatHref(selectedRoom.id));
      },
    });
  };

  const modeLabel =
    mode === "tournament"
      ? "Host tournament"
      : selectedRoom
        ? "Create group game"
        : "Create community room";

  /** Games available when hosting a table inside a room — room tags first, else profile only */
  const groupGameOptions = useMemo(() => {
    if (!selectedRoom) return profileGames;
    const roomTags =
      selectedRoom.games?.length > 0
        ? selectedRoom.games
        : selectedRoom.game
          ? [selectedRoom.game]
          : [];
    if (roomTags.length) return roomTags;
    return profileGames;
  }, [selectedRoom, profileGames]);

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
            Host a bracket, or a community room first — then table games for that
            group. Host fee is a percentage of the pot. Optional betable markets
            need a scheduled start.
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
          title="Community room"
          subtitle="Group first · games later"
          body="Community first, then free-for-all tables (not brackets) — poker, COD FFA, spades… one winner per table."
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
            title="Your community rooms"
            hint="Select a room to create a group game (seats · buy-in)"
          />
          {hostedRooms.length === 0 ? (
            <GhEmptyState
              icon={Gamepad2}
              title="No rooms yet"
              description="Create a community room below first, then add group games inside it."
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
                          {(room.games?.length
                            ? room.games.join(", ")
                            : room.game) || "Multi"}{" "}
                          · {room.console || "PC"} · {room.membersCount} member
                          {room.membersCount === 1 ? "" : "s"}
                          {room.activePots[0]
                            ? ` · live table ${room.activePots[0].game} (${room.activePots[0].players})`
                            : " · no open games yet"}
                        </Text>
                      </Box>
                      <GhButton
                        size="sm"
                        variant={selected ? "prize" : "outline"}
                        leftIcon={<Plus size={14} />}
                        onClick={() => selectRoomForGame(room)}
                        flexShrink={0}
                      >
                        {selected ? "Selected" : "Create group game"}
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
            {mode === "tournament"
              ? "Enter entry fee, max players, and host fee % below to preview your cut at a full lobby."
              : selectedRoom
                ? "Enter buy-in, max seats, and host take % for this group game to preview pot split."
                : "Create the community room first. Host earnings preview appears when you create a group game (seats + buy-in) inside a room."}
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
                      ? ` · ${selectedRoom.name}`
                      : mode === "room"
                        ? " · step 1"
                        : ""}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {formOpen
                    ? mode === "room" && !selectedRoom
                      ? "Community only · no seats · games from profile"
                      : mode === "room" && selectedRoom
                        ? "Step 2 · max seats + buy-in for this table"
                        : "In-page form · no modal (II-safe)"
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
                    <GhAlert tone="live" title="Create free-for-all table">
                      “{selectedRoom.name}” is selected. This is{" "}
                      <Text as="span" fontWeight="bold">
                        not a bracket
                      </Text>{" "}
                      — multi-seat FFA, one winner. Max seats & buy-in apply to
                      this table only.
                    </GhAlert>
                  ) : (
                    <GhAlert tone="live" title="Step 1 · Community room">
                      Rooms are groups. Tag games you play (from your profile).
                      After the room exists, select it above to create table
                      games (poker, FFA, spades…).
                    </GhAlert>
                  )}

                  {!selectedRoom ? (
                    <>
                      <GhField label="Room name" required>
                        <GhInput
                          value={rName}
                          onChange={(e) => setRName(e.target.value)}
                          placeholder="Friday night crew"
                        />
                      </GhField>
                      <GhField
                        label="Games this room plays"
                        required
                        helperText={
                          profileGames.length
                            ? "From your profile · pick one or more tags"
                            : "Add games on your profile first"
                        }
                      >
                        {profileGames.length ? (
                          <GameChipPicker
                            selected={rGames}
                            onChange={setRGames}
                            catalog={profileGames}
                            tone="live"
                            placeholder="Add another title from your list…"
                            helperText="Only games you listed on profile."
                          />
                        ) : (
                          <GhAlert tone="warning" title="No profile games">
                            Edit your profile and select games you play, then
                            return here.
                          </GhAlert>
                        )}
                      </GhField>
                      <GhField label="Primary console (optional)">
                        <GhInput
                          value={rConsole}
                          onChange={(e) => setRConsole(e.target.value)}
                          placeholder="PC · Multi · PS5…"
                        />
                      </GhField>
                      <GhField label="About / rules (optional)">
                        <GhTextarea
                          value={rRules}
                          onChange={(e) => setRRules(e.target.value)}
                          placeholder="Vibe, schedule, how to join…"
                        />
                      </GhField>
                    </>
                  ) : (
                    <>
                      <HStack gap="phi2" flexWrap="wrap" align="flex-start">
                        <Box flex="1" minW="10rem">
                          <GhField
                            label="Game"
                            required
                            helperText="From this room’s tags (set from your profile when the room was created)"
                          >
                            {groupGameOptions.length ? (
                              <NativeSelect
                                value={
                                  groupGameOptions.includes(rGame)
                                    ? rGame
                                    : groupGameOptions[0]!
                                }
                                onChange={setRGame}
                                options={[...groupGameOptions]}
                              />
                            ) : (
                              <GhAlert tone="warning" title="No games on this room">
                                Room has no game tags. Edit the room or create a
                                new community with profile games first.
                              </GhAlert>
                            )}
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
                          <GhField
                            label="Max seats"
                            required
                            helperText="2–8 for this game"
                          >
                            <GhInput
                              type="number"
                              min="2"
                              max="8"
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
                        borderColor="prize.solid"
                        bg="prize.muted"
                      >
                        <Text
                          fontFamily="heading"
                          fontSize="sm"
                          fontWeight="bold"
                          color="prize.fg"
                          mb="1"
                        >
                          Buy-in / pot
                        </Text>
                        <Text fontSize="xs" color="fg.muted" mb="phi2">
                          Enter 0 for a free game. Seat cap is always required.
                        </Text>
                        <HStack gap="phi2" flexWrap="wrap" align="flex-start">
                          <Box flex="1" minW="7rem">
                            <GhField
                              label="Buy-in (ICP)"
                              helperText="0 = free"
                            >
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
                              label="Host take (%)"
                              helperText={`Note only · max ${HOST_FEE_MAX_PCT}%`}
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

                      <GhField label="Game rules (optional)">
                        <GhTextarea
                          value={rRules}
                          onChange={(e) => setRRules(e.target.value)}
                          placeholder="Buy-in rules, format, stream…"
                        />
                      </GhField>
                    </>
                  )}

                  <HStack gap="phi2" flexWrap="wrap">
                    <GhButton
                      variant={selectedRoom ? "prize" : "live"}
                      leftIcon={<Gamepad2 size={16} />}
                      rightIcon={<ArrowRight size={16} />}
                      onClick={submitRoom}
                    >
                      {selectedRoom
                        ? "Create group game"
                        : "Create community room"}
                    </GhButton>
                    {selectedRoom ? (
                      <GhButton
                        variant="outline"
                        onClick={() => {
                          setSelectedRoom(null);
                          setRName("");
                          setRRules("");
                        }}
                      >
                        Create new room instead
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

      <GhProcessModal state={processState} onClose={closeProcess} />
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
            icon: Users,
            title: "Room first, games second",
            body: "A room is a community group. Create it with name + games you play (from profile). No seat cap on the room.",
          },
          {
            icon: Gamepad2,
            title: "Group games inside the room",
            body: "Select your room, then create free-for-all tables (poker, COD FFA, spades…). Not an elimination bracket — one winner when the table settles. Max seats 2–8 + buy-in (0 = free).",
          },
          {
            icon: Coins,
            title: "Buy-in is per game",
            body: "Optional buy-in × seats previews pot for that table. Host take % is noted for settlement policy.",
          },
          {
            icon: ChartCandlestick,
            title: "Betable (optional)",
            body: `Spectator markets on group games are optional and muted product-wide for now. Winner share policy ~${BETABLE_WINNER_PCT}%.`,
          },
          {
            icon: Info,
            title: "Profile games",
            body: "Game tags on create come from games you selected on your profile. Update profile to add titles.",
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
