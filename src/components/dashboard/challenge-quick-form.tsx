"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Box, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import {
  CalendarClock,
  ChartCandlestick,
  ChevronDown,
  ChevronUp,
  Coins,
  Gamepad2,
  Plus,
  Radio,
  Shield,
  Swords,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  EntryFeeNotice,
  GhAlert,
  GhAvatar,
  GhBadge,
  GhButton,
  GhCheckbox,
  GhField,
  GhInput,
  GhModal,
  GhSpinner,
  GhSurface,
  GhSwitch,
  GhTextarea,
  ghToast,
  toastLowBalance,
} from "@/components/ui";
import type { ChatUser } from "@/lib/chat/types";
import {
  isTeamCaptain,
  myTeams,
  searchTeamsAsync,
  teamGames,
  type Team,
} from "@/lib/teams";
import {
  CHALLENGE_CONSOLES,
  profileConsoleToChallenge,
} from "@/lib/profile";
import { useSession } from "@/components/providers/session-context";
import { createChallenge } from "@/lib/ic/challenge-service";
import { friendlyIcError } from "@/lib/ic/local-identity";
import {
  getUserPlayIcpBalance,
  ICP_TRANSFER_FEE,
  requiredIcpForChallengeEntry,
  searchChallengeUsers,
} from "@/lib/ic/gamer-service";
import { isCanisterConfigured } from "@/lib/ic/canisters";
import { challengeHref } from "@/lib/challenges";
import { getProfileCompleteness } from "@/lib/profile";

type CreatePhase =
  | "idle"
  | "validating"
  | "submitting"
  | "confirming"
  | "redirecting"
  | "error";

const CREATE_STEPS: {
  key: Exclude<CreatePhase, "idle" | "error">;
  label: string;
  detail: string;
}[] = [
  {
    key: "validating",
    label: "Checking balance & form",
    detail: "Entry fee, stake, and ICP transfer fee",
  },
  {
    key: "submitting",
    label: "Submitting to canister",
    detail: "Creating the challenge on-chain via Internet Computer",
  },
  {
    key: "confirming",
    label: "Challenge recorded",
    detail: "On-chain id confirmed — preparing your match page",
  },
  {
    key: "redirecting",
    label: "Opening challenge",
    detail: "Taking you to the live challenge page",
  },
];

/**
 * Quick challenge create — **show/hide panel** (not a modal).
 * Internet Identity / wallet connect must not open inside dialogs.
 *
 * Solo 1v1 or team vs team. Betable markets: coming soon.
 * Entry fee triggers live balance checks (stake + ICP transfer fee).
 */
export function ChallengeQuickForm({
  open,
  onOpenChange,
  opponent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opponent?: ChatUser | null;
}) {
  const { principal, profile, isLoggedIn, login, identity } = useSession();
  const who = profile?.username || principal || "";
  /** Squads where user is captain or roster member */
  const userTeams = useMemo(() => {
    const byName = myTeams(who);
    if (byName.length) return byName;
    // Demo teams list captains as "you" — use when profile not set yet
    if (!who || who.length < 2) return myTeams("you");
    return byName;
  }, [who]);
  const [mode, setMode] = useState<"solo" | "team">("solo");
  const [opponentName, setOpponentName] = useState(opponent?.username ?? "");
  const [opponentUser, setOpponentUser] = useState<ChatUser | null>(
    opponent ?? null,
  );
  const [opponentTeam, setOpponentTeam] = useState("");
  const [opponentTeamPick, setOpponentTeamPick] = useState<Team | null>(null);
  const [myTeamId, setMyTeamId] = useState("");
  const profileGames = useMemo(
    () => (profile?.games ?? []).map((g) => g.trim()).filter(Boolean),
    [profile?.games],
  );
  const [game, setGame] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [entryFee, setEntryFee] = useState("0");
  const [consoleName, setConsoleName] = useState<string>(() =>
    profileConsoleToChallenge(profile?.console),
  );
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createPhase, setCreatePhase] = useState<CreatePhase>("idle");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Opponent user typeahead (solo)
  const [suggestions, setSuggestions] = useState<ChatUser[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const suggestRef = useRef<HTMLDivElement | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Opponent team typeahead
  const [teamSuggestions, setTeamSuggestions] = useState<Team[]>([]);
  const [teamSuggestOpen, setTeamSuggestOpen] = useState(false);
  const [teamSuggestLoading, setTeamSuggestLoading] = useState(false);
  const teamSuggestRef = useRef<HTMLDivElement | null>(null);
  const teamSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Play balances — live check on wager input
  const [myBalanceIcp, setMyBalanceIcp] = useState<number | null>(null);
  const [oppBalanceIcp, setOppBalanceIcp] = useState<number | null>(null);
  const [balanceChecking, setBalanceChecking] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const balanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!error) return;
    errorAnchorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [error]);

  const selectedTeam = userTeams.find((t) => t.id === myTeamId) ?? null;
  const teamPlayGames = useMemo(
    () => (selectedTeam ? teamGames(selectedTeam) : []),
    [selectedTeam],
  );
  const availableGames = mode === "team" ? teamPlayGames : profileGames;
  const hasTeamAccess = userTeams.length > 0;

  useEffect(() => {
    if (opponent?.username) {
      setOpponentName(opponent.username);
      setOpponentUser(opponent);
    }
  }, [opponent?.username, opponent]);

  useEffect(() => {
    if (open) {
      document
        .getElementById("gh-challenge-create-panel")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [open]);

  // Default / keep my team selection
  useEffect(() => {
    if (!userTeams.length) {
      setMyTeamId("");
      return;
    }
    setMyTeamId((prev) =>
      prev && userTeams.some((t) => t.id === prev) ? prev : userTeams[0]!.id,
    );
  }, [userTeams]);

  // Games: profile for solo · team roster games for team mode
  useEffect(() => {
    if (availableGames.length === 0) {
      setGame("");
      return;
    }
    setGame((prev) =>
      prev && availableGames.includes(prev) ? prev : availableGames[0]!,
    );
  }, [availableGames]);

  // Console follows selected squad in team mode
  useEffect(() => {
    if (mode === "team" && selectedTeam) {
      setConsoleName(profileConsoleToChallenge(selectedTeam.console));
      return;
    }
    if (profile?.console) {
      setConsoleName(profileConsoleToChallenge(profile.console));
    }
  }, [mode, selectedTeam, profile?.console]);

  const feeNum = useMemo(() => {
    const n = parseFloat(entryFee);
    return Number.isFinite(n) ? n : NaN;
  }, [entryFee]);

  const requiredIcp = useMemo(
    () => requiredIcpForChallengeEntry(Number.isFinite(feeNum) ? feeNum : 0),
    [feeNum],
  );

  const resolveOpponentPrincipal = useCallback((): string | null => {
    if (mode !== "solo") return null;
    if (opponentUser?.principal) return opponentUser.principal;
    const raw = opponentName.trim();
    // Principal-shaped text
    if (raw.includes("-") && raw.length > 20) return raw;
    return null;
  }, [mode, opponentUser, opponentName]);

  /**
   * When entry fee changes (or opponent is picked), load balances and
   * flag if either side lacks stake + ICP transfer fee.
   */
  const runBalanceCheck = useCallback(async () => {
    if (!open || !isCanisterConfigured()) {
      setBalanceError(null);
      setBalanceChecking(false);
      return;
    }
    const entry = Number.isFinite(feeNum) ? feeNum : 0;
    const need = requiredIcpForChallengeEntry(entry);

    if (entry <= 0 || need <= 0) {
      setBalanceError(null);
      setBalanceChecking(false);
      // still refresh creator balance for display
      if (principal) {
        const bal = await getUserPlayIcpBalance(principal, identity);
        setMyBalanceIcp(bal);
      }
      setOppBalanceIcp(null);
      return;
    }

    setBalanceChecking(true);
    try {
      const oppP = resolveOpponentPrincipal();
      const [mine, opp] = await Promise.all([
        principal
          ? getUserPlayIcpBalance(principal, identity)
          : Promise.resolve(null),
        oppP
          ? getUserPlayIcpBalance(oppP, identity)
          : Promise.resolve(null),
      ]);
      setMyBalanceIcp(mine);
      setOppBalanceIcp(opp);

      const parts: string[] = [];
      if (mine != null && mine < need) {
        parts.push(
          `You need ${need.toFixed(4)} ICP (stake ${entry} + fee ${ICP_TRANSFER_FEE}) but only have ${mine.toFixed(4)} ICP.`,
        );
      }
      if (oppP && opp != null && opp < need) {
        const who = opponentUser?.username || opponentName || "Opponent";
        parts.push(
          `@${who.replace(/^@/, "")} needs ${need.toFixed(4)} ICP but only has ${opp.toFixed(4)} ICP.`,
        );
      }
      if (mode === "solo" && !oppP && entry > 0) {
        // Can't verify opponent until selected — soft note, not hard error
        setBalanceError(
          parts.length
            ? parts.join(" ")
            : null,
        );
      } else {
        setBalanceError(parts.length ? parts.join(" ") : null);
      }
    } finally {
      setBalanceChecking(false);
    }
  }, [
    open,
    feeNum,
    principal,
    identity,
    resolveOpponentPrincipal,
    opponentUser?.username,
    opponentName,
    mode,
  ]);

  // Debounce balance check when form open / fee / opponent changes
  useEffect(() => {
    if (!open) return;
    if (balanceTimer.current) clearTimeout(balanceTimer.current);
    balanceTimer.current = setTimeout(() => {
      void runBalanceCheck();
    }, 350);
    return () => {
      if (balanceTimer.current) clearTimeout(balanceTimer.current);
    };
  }, [open, entryFee, opponentUser?.principal, opponentName, principal, runBalanceCheck]);

  // Close suggestions on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!suggestRef.current?.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
      if (!teamSuggestRef.current?.contains(e.target as Node)) {
        setTeamSuggestOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const runOpponentSearch = useCallback(
    (q: string) => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (!q.trim()) {
        setSuggestions([]);
        setSuggestOpen(false);
        setSuggestLoading(false);
        return;
      }
      setSuggestLoading(true);
      searchTimer.current = setTimeout(() => {
        void searchChallengeUsers(q, identity, 12).then((list) => {
          // Exclude self
          const me = (profile?.username || "").toLowerCase();
          const meP = (principal || "").toLowerCase();
          const filtered = list.filter((u) => {
            const un = (u.username || "").toLowerCase();
            const up = (u.principal || u.id || "").toLowerCase();
            if (me && un === me) return false;
            if (meP && (up === meP || up.startsWith(meP.slice(0, 10))))
              return false;
            return true;
          });
          setSuggestions(filtered);
          setSuggestOpen(true);
          setSuggestLoading(false);
        });
      }, 220);
    },
    [identity, profile?.username, principal],
  );

  const runTeamSearch = useCallback(
    (q: string) => {
      if (teamSearchTimer.current) clearTimeout(teamSearchTimer.current);
      if (!q.trim()) {
        setTeamSuggestions([]);
        setTeamSuggestOpen(false);
        setTeamSuggestLoading(false);
        return;
      }
      setTeamSuggestLoading(true);
      teamSearchTimer.current = setTimeout(() => {
        void searchTeamsAsync(q, {
          excludeIds: userTeams.map((t) => t.id),
          limit: 12,
        }).then((list) => {
          setTeamSuggestions(list);
          setTeamSuggestOpen(true);
          setTeamSuggestLoading(false);
        });
      }, 220);
    },
    [userTeams],
  );

  const pickOpponent = (u: ChatUser) => {
    setOpponentName(u.username);
    setOpponentUser(u);
    setSuggestOpen(false);
    setError(null);
    setBalanceError(null);
  };

  const pickOpponentTeam = (t: Team) => {
    setOpponentTeam(t.name);
    setOpponentTeamPick(t);
    setTeamSuggestOpen(false);
    setError(null);
  };

  const scheduledAt = useMemo(() => {
    if (!date || !time) return null;
    const d = new Date(`${date}T${time}:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [date, time]);

  const validate = (): string | null => {
    if (mode === "solo") {
      if (!opponentName.trim())
        return "Opponent username or principal is required";
      if (profileGames.length === 0) {
        return "Add games you play on your profile before creating a challenge";
      }
      if (!game.trim() || !profileGames.includes(game)) {
        return "Select a game from your profile list";
      }
    } else {
      if (!hasTeamAccess) {
        return "Join or create a team to post team vs team challenges";
      }
      if (!myTeamId || !selectedTeam) {
        return "Select the squad you are challenging with";
      }
      if (!opponentTeam.trim()) {
        return "Pick an opponent team from the list";
      }
      if (teamPlayGames.length === 0) {
        return "Your team has no games set — update the squad on /teams";
      }
      if (!game.trim() || !teamPlayGames.includes(game)) {
        return "Select a game your team plays";
      }
    }
    if (!title.trim()) return "Title is required";
    if (isNaN(feeNum) || feeNum < 0) {
      return "Entry fee must be 0 or a positive amount (ICP)";
    }
    if (scheduleEnabled && scheduledAt) {
      if (scheduledAt.getTime() < Date.now()) {
        return "Scheduled start must be in the future";
      }
    }
    if (feeNum > 0 && balanceError) {
      return balanceError;
    }
    return null;
  };

  const onSubmit = async () => {
    // Fresh balance check right before create
    await runBalanceCheck();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    if (feeNum > 0 && balanceError) {
      setError(balanceError);
      toastLowBalance({
        action: "create this challenge",
        needIcp: requiredIcpForChallengeEntry(feeNum),
        balanceIcp: myBalanceIcp ?? 0,
        description: balanceError,
      });
      return;
    }
    if (!isLoggedIn) {
      setError("Connect Internet Identity first");
      void login();
      return;
    }
    const complete = getProfileCompleteness(profile);
    if (!complete.ok) {
      setError(complete.message);
      ghToast({
        title: "Complete your profile",
        description: complete.message,
        type: "error",
      });
      return;
    }
    if (!isCanisterConfigured()) {
      setError(
        "Canister not configured. Deploy gh_backend and set NEXT_PUBLIC_GH_BACKEND_CANISTER_ID.",
      );
      return;
    }

    // Final hard checks (stake + transfer fee)
    if (feeNum > 0) {
      const need = requiredIcpForChallengeEntry(feeNum);
      const creatorBal =
        myBalanceIcp != null
          ? myBalanceIcp
          : principal
            ? await getUserPlayIcpBalance(principal, identity)
            : null;

      if (creatorBal != null && creatorBal < need) {
        const msg = `You need ${need.toFixed(4)} ICP (stake ${feeNum} + fee ${ICP_TRANSFER_FEE}) but only have ${creatorBal.toFixed(4)} ICP. Deposit on Wallet first.`;
        setError(msg);
        setBalanceError(msg);
        toastLowBalance({
          action: "create this challenge",
          needIcp: need,
          balanceIcp: creatorBal,
          description: msg,
        });
        return;
      }

      if (mode === "solo") {
        const oppPrincipal = resolveOpponentPrincipal();
        if (oppPrincipal) {
          const oppBal =
            oppBalanceIcp != null
              ? oppBalanceIcp
              : await getUserPlayIcpBalance(oppPrincipal, identity);
          if (oppBal != null && oppBal < need) {
            const msg = `@${opponentUser?.username || opponentName} needs ${need.toFixed(4)} ICP (stake + fee) but only has ${oppBal.toFixed(4)} ICP. Lower the wager or wait for them to deposit.`;
            setError(msg);
            setBalanceError(msg);
            ghToast({
              title: "Opponent insufficient balance",
              description: msg,
              type: "error",
            });
            return;
          }
        }
      }
    }

    setLoading(true);
    setError(null);
    setBalanceError(null);
    setCreateError(null);
    setCreatedId(null);
    setCreatePhase("validating");
    try {
      // Brief beat so the modal shows the first step
      await new Promise((r) => setTimeout(r, 280));
      setCreatePhase("submitting");
      const creator = profile?.username || principal;
      const teamNote =
        mode === "team" && selectedTeam
          ? `[${selectedTeam.tag}] vs ${
              opponentTeamPick
                ? `[${opponentTeamPick.tag}] ${opponentTeamPick.name}`
                : opponentTeam.trim()
            }`
          : "";
      const id = await createChallenge(
        {
          creator,
          opponent:
            mode === "solo" ? opponentName.trim() : opponentTeam.trim(),
          game,
          title: title.trim(),
          console: consoleName,
          entryFeeIcp: feeNum,
          description: [description.trim(), teamNote].filter(Boolean).join(" · "),
          scheduledAt: scheduleEnabled ? scheduledAt : null,
          betable: false,
          creatorStream: streamUrl.trim(),
        },
        identity,
      );
      setCreatedId(id);
      setCreatePhase("confirming");
      ghToast({
        title: "Challenge created on-chain",
        description: `${title} · ${feeNum} ICP · id ${id}`,
        type: "success",
      });
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setScheduleEnabled(false);
      setOpponentTeam("");
      setStreamUrl("");
      setEntryFee("0");
      setCreatePhase("redirecting");
      // Hard navigate to always-built shell (static export / IC assets)
      const href = challengeHref(id);
      await new Promise((r) => setTimeout(r, 450));
      window.location.assign(href);
    } catch (e) {
      const msg = friendlyIcError(e);
      setError(msg);
      setCreateError(msg);
      setCreatePhase("error");
      ghToast({
        title: "Create failed",
        description: msg,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const createModalOpen = createPhase !== "idle";
  const stepIndex = CREATE_STEPS.findIndex((s) => s.key === createPhase);

  return (
    <Box id="gh-challenge-create-panel" scrollMarginTop="5.5rem">
      <GhModal
        open={createModalOpen}
        onOpenChange={(open) => {
          if (!open && (createPhase === "error" || createPhase === "idle")) {
            setCreatePhase("idle");
            setCreateError(null);
          }
        }}
        title={
          createPhase === "error"
            ? "Challenge not created"
            : createPhase === "redirecting"
              ? "Challenge ready"
              : "Creating challenge"
        }
        description={
          createPhase === "error"
            ? "Something went wrong while posting on-chain."
            : createPhase === "redirecting"
              ? "Opening your challenge page…"
              : "Posting to the Internet Computer. Keep this tab open."
        }
        tone={createPhase === "error" ? "prize" : "brand"}
        hideClose={
          createPhase !== "error" && createPhase !== "idle"
        }
        size="md"
        footer={
          createPhase === "error" ? (
            <GhButton
              variant="primary"
              onClick={() => {
                setCreatePhase("idle");
                setCreateError(null);
              }}
            >
              Close
            </GhButton>
          ) : createPhase === "redirecting" && createdId ? (
            <GhButton
              variant="primary"
              onClick={() => window.location.assign(challengeHref(createdId))}
            >
              Open challenge
            </GhButton>
          ) : undefined
        }
      >
        <VStack align="stretch" gap="phi3" py="phi1">
          {createPhase !== "error" ? (
            <HStack gap="phi3" align="center">
              <Box
                w="12"
                h="12"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="brand.muted"
                color="brand.fg"
                borderWidth="1px"
                borderColor="border.brand"
                flexShrink={0}
              >
                {createPhase === "redirecting" ||
                createPhase === "confirming" ? (
                  <Swords size={22} />
                ) : (
                  <GhSpinner size="md" />
                )}
              </Box>
              <Box minW="0">
                <Text
                  fontFamily="heading"
                  fontWeight="extrabold"
                  fontSize="sm"
                  letterSpacing="0.04em"
                >
                  {CREATE_STEPS[Math.max(0, stepIndex)]?.label ||
                    "Working…"}
                </Text>
                <Text fontSize="xs" color="fg.muted" mt="0.5" lineHeight="1.5">
                  {CREATE_STEPS[Math.max(0, stepIndex)]?.detail}
                </Text>
                {title.trim() ? (
                  <Text
                    fontSize="xs"
                    color="brand.fg"
                    mt="1"
                    fontWeight="bold"
                    lineClamp={1}
                  >
                    {title.trim()}
                    {feeNum > 0 ? ` · ${feeNum} ICP` : " · free entry"}
                  </Text>
                ) : null}
              </Box>
            </HStack>
          ) : (
            <GhAlert tone="error" title="Create failed">
              {createError || "Unknown error"}
            </GhAlert>
          )}

          <VStack align="stretch" gap="2">
            {CREATE_STEPS.map((step, i) => {
              const active = step.key === createPhase;
              const done =
                createPhase !== "error" &&
                stepIndex > i &&
                createPhase !== "idle";
              return (
                <HStack
                  key={step.key}
                  gap="phi2"
                  px="phi3"
                  py="2"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={
                    active
                      ? "border.brand"
                      : done
                        ? "border.default"
                        : "transparent"
                  }
                  bg={active ? "brand.muted" : "transparent"}
                  opacity={createPhase === "error" ? 0.45 : done || active ? 1 : 0.5}
                >
                  <Box
                    w="6"
                    h="6"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="2xs"
                    fontWeight="extrabold"
                    fontFamily="heading"
                    bg={
                      done
                        ? "brand.solid"
                        : active
                          ? "bg.elevated"
                          : "whiteAlpha.100"
                    }
                    color={done ? "black" : "fg.default"}
                    borderWidth="1px"
                    borderColor={active ? "border.brand" : "transparent"}
                    flexShrink={0}
                  >
                    {done ? "✓" : i + 1}
                  </Box>
                  <Box minW="0">
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      fontFamily="heading"
                      letterSpacing="0.03em"
                    >
                      {step.label}
                    </Text>
                    {active ? (
                      <Text fontSize="2xs" color="fg.muted">
                        {step.detail}
                      </Text>
                    ) : null}
                  </Box>
                  {active && createPhase !== "redirecting" ? (
                    <Box ml="auto" flexShrink={0}>
                      <GhSpinner size="sm" />
                    </Box>
                  ) : null}
                </HStack>
              );
            })}
          </VStack>

          {createdId ? (
            <Text
              fontSize="2xs"
              fontFamily="mono"
              color="fg.subtle"
              wordBreak="break-all"
            >
              id · {createdId}
            </Text>
          ) : null}
        </VStack>
      </GhModal>
      <GhSurface
        variant={open ? "brand" : "glass"}
        p="0"
        overflow="hidden"
        borderColor={open ? "border.brand" : undefined}
      >
        <Flex
          as="button"
          w="100%"
          align="center"
          justify="space-between"
          gap="phi3"
          px="phi4"
          py="phi3"
          cursor="pointer"
          onClick={() => onOpenChange(!open)}
          _hover={{ bg: "whiteAlpha.50" }}
        >
          <HStack gap="phi2">
            <Box
              w="10"
              h="10"
              borderRadius="xl"
              bg="brand.muted"
              color="brand.fg"
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderWidth="1px"
              borderColor="border.brand"
              flexShrink={0}
            >
              <Swords size={18} />
            </Box>
            <Box textAlign="left">
              <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
                {open ? "Creating challenge" : "Direct challenge"}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {open
                  ? "In-page form · profile games · balance check"
                  : "Show form · pick opponent · set stake (0 OK)"}
              </Text>
            </Box>
          </HStack>
          <HStack gap="2" color="brand.fg">
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </HStack>
        </Flex>

        {open ? (
          <Box
            px="phi4"
            pb="phi4"
            borderTopWidth="1px"
            borderColor="border.default"
          >
            {!getProfileCompleteness(profile).ok ? (
              <GhAlert tone="warning" title="Profile incomplete" mb="phi3" mt="phi2">
                {getProfileCompleteness(profile).message}{" "}
                <Link href="/profile" style={{ color: "inherit", fontWeight: 700 }}>
                  Complete profile →
                </Link>
              </GhAlert>
            ) : null}
            <HStack justify="flex-end" pt="phi2" mb="phi2">
              <GhButton
                size="sm"
                variant="ghost"
                leftIcon={<X size={14} />}
                onClick={() => onOpenChange(false)}
              >
                Hide form
              </GhButton>
            </HStack>

            <VStack align="stretch" gap="phi3">
              <Box>
                <Text
                  fontFamily="heading"
                  fontSize="2xs"
                  fontWeight="bold"
                  letterSpacing="0.1em"
                  textTransform="uppercase"
                  color="fg.subtle"
                  mb="phi2"
                >
                  Challenge type
                </Text>
                <HStack gap="2" flexWrap="wrap">
                  <ModeChip
                    active={mode === "solo"}
                    icon={<Swords size={14} />}
                    label="Solo 1v1"
                    onClick={() => {
                      setMode("solo");
                      setError(null);
                    }}
                  />
                  <ModeChip
                    active={mode === "team"}
                    icon={<Users size={14} />}
                    label="Team vs team"
                    onClick={() => {
                      setMode("team");
                      setError(null);
                      setSuggestOpen(false);
                    }}
                  />
                </HStack>
              </Box>

              {mode === "team" && !hasTeamAccess ? (
                <Box
                  p={{ base: "phi3", md: "phi4" }}
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor="border.brand"
                  bg="bg.glass"
                  boxShadow="glow"
                  position="relative"
                  overflow="hidden"
                >
                  <Box
                    position="absolute"
                    inset="0"
                    backgroundImage="
                      radial-gradient(ellipse 60% 80% at 0% 0%, rgba(163,255,61,0.12), transparent 55%),
                      radial-gradient(ellipse 50% 60% at 100% 100%, rgba(34,211,238,0.1), transparent 50%)
                    "
                    pointerEvents="none"
                  />
                  <VStack align="stretch" gap="phi3" position="relative">
                    <HStack gap="phi2" align="flex-start">
                      <Box
                        w="11"
                        h="11"
                        borderRadius="xl"
                        bg="brand.muted"
                        color="brand.fg"
                        borderWidth="1px"
                        borderColor="border.brand"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                      >
                        <Users size={22} />
                      </Box>
                      <Box minW="0">
                        <Text
                          fontFamily="heading"
                          fontWeight="extrabold"
                          fontSize="md"
                          letterSpacing="0.02em"
                        >
                          You need a team first
                        </Text>
                        <Text fontSize="sm" color="fg.muted" mt="1" lineHeight="1.5">
                          Team vs team challenges are for squads you’re on — as{" "}
                          <Text as="span" color="brand.fg" fontWeight="bold">
                            captain
                          </Text>{" "}
                          or roster member. Create a team or accept an invite,
                          then come back to post the match.
                        </Text>
                      </Box>
                    </HStack>
                    <HStack gap="phi2" flexWrap="wrap">
                      {[
                        {
                          icon: Shield,
                          t: "Captain or member",
                          d: "Either role can open a team challenge.",
                        },
                        {
                          icon: Gamepad2,
                          t: "Team games only",
                          d: "Match title must be one your squad plays.",
                        },
                      ].map((x) => {
                        const Icon = x.icon;
                        return (
                          <Box
                            key={x.t}
                            flex="1"
                            minW="10rem"
                            p="phi2"
                            borderRadius="xl"
                            borderWidth="1px"
                            borderColor="border.default"
                            bg="whiteAlpha.50"
                          >
                            <HStack gap="1.5" mb="1" color="brand.fg">
                              <Icon size={14} />
                              <Text
                                fontFamily="heading"
                                fontSize="xs"
                                fontWeight="bold"
                              >
                                {x.t}
                              </Text>
                            </HStack>
                            <Text fontSize="2xs" color="fg.muted" lineHeight="1.4">
                              {x.d}
                            </Text>
                          </Box>
                        );
                      })}
                    </HStack>
                    <HStack gap="2" flexWrap="wrap">
                      <Link href="/teams">
                        <GhButton
                          variant="primary"
                          leftIcon={<Plus size={16} />}
                        >
                          Create or join a team
                        </GhButton>
                      </Link>
                      <GhButton
                        variant="outline"
                        onClick={() => {
                          setMode("solo");
                          setError(null);
                        }}
                      >
                        Switch to solo 1v1
                      </GhButton>
                    </HStack>
                  </VStack>
                </Box>
              ) : null}

              {mode === "solo" ? (
                <Box position="relative" ref={suggestRef}>
                  <GhField
                    label="Opponent"
                    required
                    helperText="Start typing a username — pick from the list"
                  >
                    <GhInput
                      placeholder="Search players…"
                      value={opponentName}
                      autoComplete="off"
                      onChange={(e) => {
                        const v = e.target.value;
                        setOpponentName(v);
                        setOpponentUser(null);
                        setError(null);
                        runOpponentSearch(v);
                      }}
                      onFocus={() => {
                        if (opponentName.trim()) {
                          runOpponentSearch(opponentName);
                        }
                      }}
                    />
                  </GhField>
                  {suggestOpen &&
                  (suggestions.length > 0 || suggestLoading) ? (
                    <Box
                      position="absolute"
                      zIndex={20}
                      left="0"
                      right="0"
                      mt="1"
                      maxH="14rem"
                      overflowY="auto"
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor="border.brand"
                      bg="bg.elevated"
                      boxShadow="glow"
                    >
                      {suggestLoading && suggestions.length === 0 ? (
                        <Text fontSize="xs" color="fg.muted" p="phi3">
                          Searching…
                        </Text>
                      ) : (
                        suggestions.map((u) => (
                          <Box
                            key={u.id + u.username}
                            as="button"
                            w="100%"
                            textAlign="left"
                            px="phi3"
                            py="2.5"
                            borderBottomWidth="1px"
                            borderColor="border.default"
                            cursor="pointer"
                            _hover={{ bg: "brand.muted" }}
                            onClick={() => pickOpponent(u)}
                          >
                            <HStack gap="2">
                              <GhAvatar
                                name={u.username}
                                size="sm"
                                src={u.avatarUrl}
                              />
                              <Box minW="0">
                                <Text
                                  fontFamily="heading"
                                  fontWeight="bold"
                                  fontSize="sm"
                                  lineClamp={1}
                                >
                                  @{u.username}
                                </Text>
                                <Text
                                  fontSize="2xs"
                                  color="fg.subtle"
                                  lineClamp={1}
                                >
                                  {u.status === "online" ? "Online" : "Offline"}
                                  {u.game ? ` · ${u.game}` : ""}
                                  {u.games?.length
                                    ? ` · ${u.games.slice(0, 2).join(", ")}`
                                    : ""}
                                </Text>
                              </Box>
                            </HStack>
                          </Box>
                        ))
                      )}
                    </Box>
                  ) : null}
                  {opponentUser ? (
                    <HStack gap="2" mt="2" flexWrap="wrap">
                      <GhBadge tone="brand">Selected @{opponentUser.username}</GhBadge>
                      {opponentUser.principal ? (
                        <GhBadge tone="muted">
                          {opponentUser.principal.length > 16
                            ? `${opponentUser.principal.slice(0, 6)}…${opponentUser.principal.slice(-4)}`
                            : opponentUser.principal}
                        </GhBadge>
                      ) : null}
                    </HStack>
                  ) : null}
                </Box>
              ) : hasTeamAccess ? (
                <VStack align="stretch" gap="phi3">
                  <GhField
                    label="Your team"
                    required
                    helperText="Must be captain or member of this squad"
                  >
                    <select
                      value={myTeamId}
                      onChange={(e) => {
                        setMyTeamId(e.target.value);
                        setError(null);
                      }}
                      style={selectStyle}
                    >
                      {userTeams.map((t) => {
                        const capt = isTeamCaptain(t, who || "you");
                        return (
                          <option
                            key={t.id}
                            value={t.id}
                            style={{ background: "#16132a" }}
                          >
                            [{t.tag}] {t.name}
                            {capt ? " · captain" : " · member"} ·{" "}
                            {teamGames(t).join(", ")}
                          </option>
                        );
                      })}
                    </select>
                  </GhField>
                  {selectedTeam ? (
                    <HStack gap="2" flexWrap="wrap">
                      <GhBadge tone={isTeamCaptain(selectedTeam, who || "you") ? "brand" : "live"}>
                        {isTeamCaptain(selectedTeam, who || "you")
                          ? "Captain"
                          : "Member"}
                      </GhBadge>
                      <GhBadge tone="muted">
                        [{selectedTeam.tag}] {selectedTeam.name}
                      </GhBadge>
                      <GhBadge tone="muted">
                        {selectedTeam.members.length} roster
                      </GhBadge>
                    </HStack>
                  ) : null}

                  <Box position="relative" ref={teamSuggestRef}>
                    <GhField
                      label="Opponent team"
                      required
                      helperText="Start typing a team name or tag — pick from the list"
                    >
                      <GhInput
                        placeholder="Search teams…"
                        value={opponentTeam}
                        autoComplete="off"
                        onChange={(e) => {
                          const v = e.target.value;
                          setOpponentTeam(v);
                          setOpponentTeamPick(null);
                          setError(null);
                          runTeamSearch(v);
                        }}
                        onFocus={() => {
                          if (opponentTeam.trim()) runTeamSearch(opponentTeam);
                        }}
                      />
                    </GhField>
                    {teamSuggestOpen &&
                    (teamSuggestions.length > 0 || teamSuggestLoading) ? (
                      <Box
                        position="absolute"
                        zIndex={20}
                        left="0"
                        right="0"
                        mt="1"
                        maxH="14rem"
                        overflowY="auto"
                        borderRadius="xl"
                        borderWidth="1px"
                        borderColor="border.brand"
                        bg="bg.elevated"
                        boxShadow="glow"
                      >
                        {teamSuggestLoading && teamSuggestions.length === 0 ? (
                          <Text fontSize="xs" color="fg.muted" p="phi3">
                            Searching teams…
                          </Text>
                        ) : (
                          teamSuggestions.map((t) => (
                            <Box
                              key={t.id}
                              as="button"
                              w="100%"
                              textAlign="left"
                              px="phi3"
                              py="2.5"
                              borderBottomWidth="1px"
                              borderColor="border.default"
                              cursor="pointer"
                              _hover={{ bg: "brand.muted" }}
                              onClick={() => pickOpponentTeam(t)}
                            >
                              <HStack gap="2">
                                <Box
                                  w="8"
                                  h="8"
                                  borderRadius="lg"
                                  overflow="hidden"
                                  bg="brand.muted"
                                  flexShrink={0}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={t.avatarUrl}
                                    alt=""
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                </Box>
                                <Box minW="0">
                                  <Text
                                    fontFamily="heading"
                                    fontWeight="bold"
                                    fontSize="sm"
                                    lineClamp={1}
                                  >
                                    [{t.tag}] {t.name}
                                  </Text>
                                  <Text
                                    fontSize="2xs"
                                    color="fg.subtle"
                                    lineClamp={1}
                                  >
                                    {teamGames(t).join(" · ")} · {t.console} ·{" "}
                                    {t.members.length} members
                                  </Text>
                                </Box>
                              </HStack>
                            </Box>
                          ))
                        )}
                      </Box>
                    ) : null}
                    {opponentTeamPick ? (
                      <HStack gap="2" mt="2" flexWrap="wrap">
                        <GhBadge tone="brand">
                          Selected [{opponentTeamPick.tag}] {opponentTeamPick.name}
                        </GhBadge>
                        <GhBadge tone="muted">
                          {teamGames(opponentTeamPick).slice(0, 2).join(", ")}
                        </GhBadge>
                      </HStack>
                    ) : null}
                  </Box>
                </VStack>
              ) : null}

              {/* Shared fields only when solo, or team with access */}
              {(mode === "solo" || hasTeamAccess) ? (
              <HStack gap="phi2" align="flex-start" flexWrap="wrap">
                <Box flex="1" minW="10rem">
                  <GhField
                    label="Game"
                    required
                    helperText={
                      mode === "team"
                        ? "Only games this team plays"
                        : "Only games from your profile"
                    }
                  >
                    {availableGames.length === 0 ? (
                      <Box
                        p="phi3"
                        borderRadius="xl"
                        borderWidth="1px"
                        borderColor="border.default"
                        bg="whiteAlpha.50"
                      >
                        <HStack gap="2" mb="2" color="fg.muted">
                          <Gamepad2 size={14} />
                          <Text fontSize="sm">
                            {mode === "team"
                              ? "No games on this team"
                              : "No games on your profile"}
                          </Text>
                        </HStack>
                        <Link href={mode === "team" ? "/teams" : "/profile"}>
                          <GhButton size="sm" variant="soft">
                            {mode === "team"
                              ? "Edit team"
                              : "Edit profile games"}
                          </GhButton>
                        </Link>
                      </Box>
                    ) : (
                      <select
                        value={game}
                        onChange={(e) => setGame(e.target.value)}
                        style={selectStyle}
                      >
                        {availableGames.map((g) => (
                          <option
                            key={g}
                            value={g}
                            style={{ background: "#16132a" }}
                          >
                            {g}
                          </option>
                        ))}
                      </select>
                    )}
                  </GhField>
                </Box>
                <Box flex="1" minW="8rem">
                  <GhField
                    label="Console"
                    required
                    helperText={
                      mode === "team"
                        ? "Defaults to your team platform"
                        : "Platform for the match"
                    }
                  >
                    <select
                      value={consoleName}
                      onChange={(e) => {
                        setConsoleName(e.target.value);
                        setError(null);
                      }}
                      style={selectStyle}
                      aria-label="Gaming console"
                    >
                      {CHALLENGE_CONSOLES.map((c) => (
                        <option
                          key={c}
                          value={c}
                          style={{ background: "#16132a" }}
                        >
                          {c}
                        </option>
                      ))}
                    </select>
                  </GhField>
                </Box>
              </HStack>
              ) : null}

              {(mode === "solo" || hasTeamAccess) ? (
              <>
              <GhField label="Title" required>
                <GhInput
                  placeholder={
                    mode === "team"
                      ? "Squad money match — 3v3"
                      : "Ranked 1v1 — Apex"
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </GhField>

              <GhField label="Description / rules notes">
                <GhTextarea
                  placeholder="Bo3, no legends banned…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </GhField>

              <Box
                p="phi3"
                borderRadius="xl"
                borderWidth="2px"
                borderColor={
                  feeNum > 0 && balanceError
                    ? "danger.solid"
                    : feeNum > 0
                      ? "prize.solid"
                      : "border.brand"
                }
                bg={
                  feeNum > 0 && balanceError
                    ? "rgba(244, 63, 94, 0.12)"
                    : "prize.muted"
                }
                boxShadow={feeNum > 0 ? "glow-prize" : undefined}
              >
                <HStack gap="2" mb="2" flexWrap="wrap">
                  <Coins size={16} color="var(--gh-colors-prize-fg)" />
                  <Text
                    fontFamily="heading"
                    fontSize="sm"
                    fontWeight="extrabold"
                    color="prize.fg"
                    letterSpacing="0.04em"
                  >
                    Wager (ICP)
                  </Text>
                  <GhBadge tone="prize">Both sides deposit</GhBadge>
                </HStack>
                <Text
                  fontSize="sm"
                  color="fg.default"
                  fontWeight="semibold"
                  lineHeight="1.5"
                  mb="phi2"
                >
                  {feeNum > 0
                    ? `Each player needs ${requiredIcp.toFixed(4)} ICP in their play wallet (stake ${feeNum} + ${ICP_TRANSFER_FEE} network fee). Free match = 0.`
                    : "Set 0 for a free challenge, or enter a stake. Both sides must cover stake + network fee from their play balance."}
                </Text>
                <GhField label="Entry fee (ICP)" required>
                  <GhInput
                    type="number"
                    min="0"
                    step="0.01"
                    value={entryFee}
                    onChange={(e) => {
                      setEntryFee(e.target.value);
                      setError(null);
                      setBalanceError(null);
                    }}
                    onBlur={() => {
                      void runBalanceCheck();
                    }}
                    tone="prize"
                    fontSize="lg"
                    fontWeight="bold"
                    h="12"
                  />
                </GhField>

                {feeNum > 0 ? (
                  <Box mt="phi2">
                    <EntryFeeNotice amountIcp={feeNum} kind="challenge" />
                  </Box>
                ) : null}

                {feeNum > 0 ? (
                  <Box
                    mt="phi3"
                    p="phi3"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={balanceError ? "danger.solid" : "border.default"}
                    bg="bg.elevated"
                  >
                    <HStack gap="2" mb="phi2" flexWrap="wrap">
                      <Wallet size={15} color="var(--gh-colors-brand-fg)" />
                      <Text
                        fontFamily="heading"
                        fontSize="xs"
                        fontWeight="extrabold"
                        letterSpacing="0.08em"
                        textTransform="uppercase"
                        color="fg.default"
                      >
                        Play balance check
                      </Text>
                      {balanceChecking ? (
                        <GhBadge tone="muted">Checking…</GhBadge>
                      ) : balanceError ? (
                        <GhBadge tone="danger">Deposit needed</GhBadge>
                      ) : (
                        <GhBadge tone="success">Ready</GhBadge>
                      )}
                    </HStack>
                    <Text fontSize="sm" color="fg.default" mb="phi2" fontWeight="medium">
                      Required each:{" "}
                      <Text as="span" className="gh-text-prize" fontWeight="extrabold">
                        {requiredIcp.toFixed(4)} ICP
                      </Text>
                    </Text>
                    <VStack align="stretch" gap="2">
                      <HStack justify="space-between" fontSize="sm" gap="2">
                        <Text fontWeight="bold" color="fg.default">
                          You
                        </Text>
                        <Text
                          fontWeight="extrabold"
                          color={
                            myBalanceIcp != null && myBalanceIcp < requiredIcp
                              ? "danger.solid"
                              : "brand.fg"
                          }
                        >
                          {myBalanceIcp == null
                            ? balanceChecking
                              ? "…"
                              : "—"
                            : `${myBalanceIcp.toFixed(4)} ICP`}
                          {myBalanceIcp != null && myBalanceIcp < requiredIcp
                            ? " · short"
                            : myBalanceIcp != null
                              ? " · OK"
                              : ""}
                        </Text>
                      </HStack>
                      {mode === "solo" ? (
                        <HStack justify="space-between" fontSize="sm" gap="2">
                          <Text fontWeight="bold" color="fg.default" lineClamp={1}>
                            Opponent
                            {opponentUser?.username
                              ? ` @${opponentUser.username}`
                              : ""}
                          </Text>
                          <Text
                            fontWeight="extrabold"
                            color={
                              !resolveOpponentPrincipal()
                                ? "fg.subtle"
                                : oppBalanceIcp != null &&
                                    oppBalanceIcp < requiredIcp
                                  ? "danger.solid"
                                  : "brand.fg"
                            }
                          >
                            {!resolveOpponentPrincipal()
                              ? "Select opponent"
                              : oppBalanceIcp == null
                                ? balanceChecking
                                  ? "…"
                                  : "—"
                                : `${oppBalanceIcp.toFixed(4)} ICP`}
                            {resolveOpponentPrincipal() &&
                            oppBalanceIcp != null &&
                            oppBalanceIcp < requiredIcp
                              ? " · short"
                              : resolveOpponentPrincipal() &&
                                  oppBalanceIcp != null
                                ? " · OK"
                                : ""}
                          </Text>
                        </HStack>
                      ) : null}
                    </VStack>
                    {balanceError ? (
                      <Box
                        mt="phi3"
                        p="phi2"
                        borderRadius="md"
                        bg="rgba(244, 63, 94, 0.15)"
                        borderWidth="1px"
                        borderColor="danger.solid"
                      >
                        <Text
                          fontSize="sm"
                          color="danger.solid"
                          lineHeight="1.5"
                          fontWeight="bold"
                        >
                          {balanceError}
                        </Text>
                        <Text fontSize="sm" color="fg.default" mt="2" lineHeight="1.45">
                          Deposit ICP to your{" "}
                          <Text as="span" fontWeight="extrabold" color="brand.fg">
                            play wallet
                          </Text>{" "}
                          before creating this challenge.
                        </Text>
                        <Link href="/wallet" style={{ display: "inline-block", marginTop: 10 }}>
                          <GhButton size="sm" variant="prize" leftIcon={<Wallet size={14} />}>
                            Deposit to wallet
                          </GhButton>
                        </Link>
                      </Box>
                    ) : (
                      <Text fontSize="xs" color="fg.muted" mt="phi2">
                        Short on funds?{" "}
                        <Link href="/wallet" style={{ color: "var(--gh-colors-prize-fg)", fontWeight: 700 }}>
                          Deposit ICP →
                        </Link>
                      </Text>
                    )}
                  </Box>
                ) : (
                  <Text fontSize="xs" color="fg.muted" mt="phi2">
                    Enter a stake above to check play balances. Deposit anytime from{" "}
                    <Link href="/wallet" style={{ color: "var(--gh-colors-brand-fg)", fontWeight: 700 }}>
                      Wallet
                    </Link>
                    .
                  </Text>
                )}
              </Box>

              <Box
                p="phi3"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="live.solid"
                bg="whiteAlpha.50"
              >
                <HStack gap="2" mb="phi2">
                  <Radio size={16} color="var(--gh-colors-live-fg)" />
                  <Text fontFamily="heading" fontSize="sm" fontWeight="bold">
                    Your stream URL
                  </Text>
                  <GhBadge tone="muted">Optional</GhBadge>
                </HStack>
                <Text fontSize="xs" color="fg.muted" mb="phi2" lineHeight="1.45">
                  Optional — spectators can watch if you add a link. You can
                  attach one later; opponent can add theirs when they accept.
                </Text>
                <GhField
                  label="Stream link"
                  helperText="Twitch · YouTube Live · Kick · etc."
                >
                  <GhInput
                    value={streamUrl}
                    onChange={(e) => {
                      setStreamUrl(e.target.value);
                      setError(null);
                    }}
                    placeholder="https://twitch.tv/your_name"
                  />
                </GhField>
              </Box>

              <Box
                p="phi3"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border.default"
                bg="whiteAlpha.50"
              >
                <HStack justify="space-between" mb="phi2">
                  <HStack gap="2">
                    <CalendarClock size={16} color="var(--gh-colors-live-fg)" />
                    <Text fontFamily="heading" fontSize="sm" fontWeight="bold">
                      Schedule match
                    </Text>
                  </HStack>
                  <GhSwitch
                    checked={scheduleEnabled}
                    onCheckedChange={(c) => {
                      setScheduleEnabled(c);
                      setError(null);
                    }}
                    tone="live"
                  />
                </HStack>
                <Text fontSize="xs" color="fg.muted" mb="phi2">
                  Optional. Set a future start time for the match.
                </Text>
                {scheduleEnabled ? (
                  <HStack gap="phi2" flexWrap="wrap">
                    <Box flex="1" minW="8rem">
                      <GhField label="Date">
                        <GhInput
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </GhField>
                    </Box>
                    <Box flex="1" minW="8rem">
                      <GhField label="Time">
                        <GhInput
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                        />
                      </GhField>
                    </Box>
                  </HStack>
                ) : null}
              </Box>

              {/* Betable — muted / coming soon */}
              <Box
                position="relative"
                p="phi3"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border.default"
                bg="whiteAlpha.50"
                opacity={0.72}
              >
                <GhBadge
                  tone="muted"
                  position="absolute"
                  top="-0.45rem"
                  right="0.75rem"
                  fontSize="2xs"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                >
                  Coming soon
                </GhBadge>
                <HStack justify="space-between" mb="phi2">
                  <HStack gap="2">
                    <ChartCandlestick
                      size={16}
                      color="var(--gh-colors-fg-subtle)"
                    />
                    <Text
                      fontFamily="heading"
                      fontSize="sm"
                      fontWeight="bold"
                      color="fg.muted"
                    >
                      Betable market
                    </Text>
                  </HStack>
                  <GhSwitch
                    checked={false}
                    onCheckedChange={() => undefined}
                    disabled
                    tone="prize"
                  />
                </HStack>
                <Text fontSize="xs" color="fg.subtle" lineHeight="1.45">
                  Spectator prediction markets on heads-up outcomes are not
                  available yet. Create the match now — markets ship soon.
                </Text>
              </Box>

              <GhCheckbox
                label="I accept escrow rules (deposit, report, claim)"
                defaultChecked
              />

              <HStack gap="phi2" flexWrap="wrap" pt="phi1">
                <GhButton
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </GhButton>
                <GhButton
                  variant="primary"
                  leftIcon={
                    mode === "team" ? <Users size={16} /> : <Swords size={16} />
                  }
                  onClick={() => void onSubmit()}
                  disabled={
                    loading ||
                    availableGames.length === 0 ||
                    (mode === "team" && !hasTeamAccess)
                  }
                >
                  {loading
                    ? "Creating…"
                    : mode === "team"
                      ? "Create team challenge"
                      : "Create challenge"}
                </GhButton>
              </HStack>

              </>
              ) : null}

              {error ? (
                <Box
                  ref={errorAnchorRef}
                  id="gh-challenge-form-error"
                  scrollMarginTop="5rem"
                >
                  <GhAlert tone="error" title="Fix form">
                    {error}
                  </GhAlert>
                </Box>
              ) : null}
            </VStack>
          </Box>
        ) : null}
      </GhSurface>
    </Box>
  );
}

function ModeChip({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Box
      as="button"
      onClick={onClick}
      px="3"
      py="2"
      borderRadius="xl"
      borderWidth="1px"
      borderColor={active ? "border.brand" : "border.default"}
      bg={active ? "brand.muted" : "whiteAlpha.50"}
      color={active ? "brand.fg" : "fg.muted"}
      cursor="pointer"
      _hover={{ borderColor: "border.brand" }}
    >
      <HStack gap="2">
        {icon}
        <Text fontFamily="heading" fontSize="xs" fontWeight="bold">
          {label}
        </Text>
      </HStack>
    </Box>
  );
}

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
