"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  ChartCandlestick,
  Check,
  ClipboardCheck,
  Clock,
  Coins,
  Copy,
  ExternalLink,
  Flag,
  Flame,
  Gavel,
  Handshake,
  Info,
  Radio,
  Share2,
  Shield,
  Snowflake,
  Swords,
  Trophy,
  UserCheck,
  XCircle,
} from "lucide-react";
import {
  GhAlert,
  GhAvatar,
  GhBadge,
  GhButton,
  GhCheckbox,
  GhEmptyState,
  GhField,
  GhInput,
  GhSpinner,
  GhSurface,
  GhSwitch,
  GhTextarea,
  ghToast,
} from "@/components/ui";
import {
  DEMO_VIEWER,
  basePotIcp,
  canConfirmReport,
  canCreateBetable,
  canDisputeCancel,
  canMutualCancel,
  canReportScore,
  filledLabel,
  formatCountdown,
  formatIcp,
  formatTournamentWhen,
  formatWhen,
  getMonitorProfile,
  hasPostedScore,
  isMonitor,
  isPlayer,
  isTournamentHost,
  isValidVideoProofUrl,
  matchLineForPlayer,
  needsConfirmFrom,
  otherPlayer,
  parentTournament,
  potFrom,
  reportRoleFor,
  secondsUntil,
  statusLabel,
  tournamentLinesForPlayer,
  type ChallengeDetail,
  type ChallengeDispute,
  type ChallengeSide,
  type ScoreReport,
} from "@/lib/challenges";
import type { TournamentDetail } from "@/lib/tournaments";
import { useChallengeRealtime } from "@/hooks/use-gh-event-stream";
import {
  acceptMutualCancel,
  confirmScore as confirmScoreOnChain,
  disputeMutualCancel,
  disputeScore as disputeScoreOnChain,
  getChallengeServiceMode,
  joinChallenge,
  loadChallenge,
  openChallengeBetable,
  requestMutualCancel,
  submitScore as submitScoreOnChain,
  withdrawMutualCancel,
} from "@/lib/ic/challenge-service";
import { isCanisterConfigured } from "@/lib/ic/canisters";
import { useGhEvents } from "@/context/event-context";
import { useSession } from "@/components/providers/session-context";

/**
 * Heads-up challenge detail — canister SoT + Supabase Realtime.
 */
export function ChallengeDetailView({ challengeId }: { challengeId: string }) {
  const [c, setC] = useState<ChallengeDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { emit } = useGhEvents();
  const { principal, profile, isLoggedIn, loginDemo } = useSession();
  const serviceMode = getChallengeServiceMode();
  const viewer = profile?.username || principal || DEMO_VIEWER;

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (!isCanisterConfigured()) {
        setLoadError(
          "Canister not configured. Deploy gh_backend and set NEXT_PUBLIC_GH_BACKEND_CANISTER_ID.",
        );
        setC(null);
        return;
      }
      const data = await loadChallenge(challengeId);
      setC(data);
      if (!data) setLoadError("Challenge not found on canister.");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
      setC(null);
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Live row from Supabase when mirror is configured
  useChallengeRealtime(challengeId, () => {
    void reload();
  });
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [streamUrl, setStreamUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [accepting, setAccepting] = useState(false);

  // Score report form
  const [scoreA, setScoreA] = useState("0");
  const [scoreB, setScoreB] = useState("0");
  const [isFinal, setIsFinal] = useState(false);

  // Create betable
  const [monitorName, setMonitorName] = useState("");
  const [betableDate, setBetableDate] = useState("");
  const [betableTime, setBetableTime] = useState("");

  // Mutual cancel + dispute
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeVideo, setDisputeVideo] = useState("");
  const [disputeReason, setDisputeReason] = useState("");

  // Tick countdown for pending confirm
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Sync form scores when challenge loads / score updates
  useEffect(() => {
    if (!c) return;
    setScoreA(String(c.scoreCreator));
    setScoreB(String(c.scoreOpponent));
  }, [c?.id, c?.scoreCreator, c?.scoreOpponent]);

  if (loading) {
    return (
      <VStack py="phi6" gap="phi3">
        <GhSpinner />
        <Text fontSize="sm" color="fg.muted">
          Loading challenge from canister…
        </Text>
      </VStack>
    );
  }

  if (!c) {
    return (
      <VStack align="stretch" gap="phi4" pb="phi4">
        <GhEmptyState
          icon={Swords}
          title={loadError ? "Load failed" : "Challenge not found"}
          description={
            loadError ??
            "This heads-up match does not exist on the canister yet."
          }
          action={
            <HStack gap="2">
              <Link href="/challenges">
                <GhButton variant="primary" leftIcon={<ArrowLeft size={16} />}>
                  All challenges
                </GhButton>
              </Link>
              <GhButton variant="outline" onClick={() => void reload()}>
                Retry
              </GhButton>
            </HStack>
          }
        />
      </VStack>
    );
  }
  const isOpen = c.status === "open" && !c.opponent;
  /** Tournament bracket: heads-up wager is 0; pot is tips only */
  const pot = c.tournamentId ? c.potExtraIcp : basePotIcp(c);
  const role = reportRoleFor(c, viewer);
  const canReport = canReportScore(c, viewer);
  const canConfirm = canConfirmReport(c, viewer);
  const betableGate = canCreateBetable(c, viewer);
  const cancelAllowed = canMutualCancel(c, viewer);
  const disputeAllowed = canDisputeCancel(c, viewer);
  const iRequestedCancel =
    c.cancelRequest?.status === "pending" &&
    c.cancelRequest.requestedBy === viewer;
  const theyRequestedCancel =
    c.cancelRequest?.status === "pending" &&
    c.cancelRequest.requestedBy !== viewer &&
    isPlayer(c, viewer);
  const pending = c.pendingReport;
  const confirmSecs =
    pending?.confirmDeadlineAt && pending.status === "pending"
      ? secondsUntil(pending.confirmDeadlineAt)
      : null;

  const copy = (text: string, label: string) => {
    void navigator.clipboard?.writeText(text);
    ghToast({ title: label, type: "success" });
  };

  const share = () => {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `/challenges/${c.id}`;
    copy(url, "Challenge link copied");
  };

  const accept = async () => {
    if (!isLoggedIn) {
      loginDemo();
      ghToast({ title: "Sign in required", type: "error" });
      return;
    }
    if (!streamUrl.trim()) {
      ghToast({
        title: "Stream URL required",
        description: "Add your Twitch / YouTube / Kick link.",
        type: "error",
      });
      return;
    }
    const raw = streamUrl.trim();
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      // eslint-disable-next-line no-new
      new URL(normalized);
    } catch {
      ghToast({ title: "Invalid stream URL", type: "error" });
      return;
    }
    setAccepting(true);
    try {
      const ok = await joinChallenge(c.id, viewer, normalized);
      if (!ok) throw new Error("joinChallenge returned false");
      emit({
        type: "challenge.joined",
        origin: "canister",
        challengeId: c.id,
      });
      setAcceptOpen(false);
      ghToast({
        title: "Challenge accepted",
        description: `${formatIcp(c.entryFeeIcp)} → challenge escrow`,
        type: "success",
      });
      await reload();
    } catch (e) {
      ghToast({
        title: "Accept failed",
        description: e instanceof Error ? e.message : String(e),
        type: "error",
      });
    } finally {
      setAccepting(false);
    }
  };

  const submitScore = async () => {
    if (!role) return;
    const a = parseInt(scoreA, 10);
    const b = parseInt(scoreB, 10);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b < 0) {
      ghToast({ title: "Invalid scores", type: "error" });
      return;
    }
    try {
      const ok = await submitScoreOnChain(c.id, a, b, viewer, isFinal);
      if (!ok) throw new Error("submitScore returned false");
      emit({
        type: "challenge.score_submitted",
        origin: "canister",
        challengeId: c.id,
      });
      ghToast({
        title: isFinal ? "Final score submitted" : "Score update submitted",
        description: "Waiting for confirmation on-chain",
        type: "info",
      });
      await reload();
    } catch (e) {
      ghToast({
        title: "Score submit failed",
        description: e instanceof Error ? e.message : String(e),
        type: "error",
      });
    }
  };

  const confirmScore = async () => {
    try {
      const ok = await confirmScoreOnChain(c.id, viewer);
      if (!ok) throw new Error("confirmScore returned false");
      emit({
        type: "challenge.score_confirmed",
        origin: "canister",
        challengeId: c.id,
      });
      ghToast({ title: "Score confirmed on-chain", type: "success" });
      await reload();
    } catch (e) {
      ghToast({
        title: "Confirm failed",
        description: e instanceof Error ? e.message : String(e),
        type: "error",
      });
    }
  };

  const disputeScore = async () => {
    if (!canConfirm) return;
    const reason =
      typeof window !== "undefined"
        ? window.prompt("Why dispute this score?", "Incorrect score report") ||
          ""
        : "Incorrect score report";
    if (!reason.trim()) return;
    try {
      const ok = await disputeScoreOnChain(c.id, reason.trim());
      if (!ok) throw new Error("disputeChallenge returned false");
      emit({
        type: "challenge.disputed",
        origin: "canister",
        challengeId: c.id,
      });
      ghToast({
        title: "Score disputed",
        description: "Challenge moved to disputed status on-chain",
        type: "warning",
      });
      await reload();
    } catch (e) {
      ghToast({
        title: "Dispute failed",
        description: e instanceof Error ? e.message : String(e),
        type: "error",
      });
    }
  };

  const requestCancel = async () => {
    if (!cancelAllowed) return;
    try {
      const ok = await requestMutualCancel(c.id, viewer);
      if (!ok) throw new Error("requestMutualCancel returned false");
      setDisputeOpen(false);
      ghToast({
        title: "Mutual cancel requested",
        description: hasPostedScore(c)
          ? "Other player can accept or dispute with video proof"
          : "Waiting for the other player to confirm",
        type: "info",
      });
      await reload();
    } catch (e) {
      ghToast({
        title: "Cancel request failed",
        description: e instanceof Error ? e.message : String(e),
        type: "error",
      });
    }
  };

  const withdrawCancel = async () => {
    try {
      await withdrawMutualCancel(c.id, viewer);
      ghToast({ title: "Cancel request withdrawn", type: "info" });
      await reload();
    } catch (e) {
      ghToast({
        title: "Withdraw failed",
        description: e instanceof Error ? e.message : String(e),
        type: "error",
      });
    }
  };

  const acceptCancel = async () => {
    try {
      const ok = await acceptMutualCancel(c.id, viewer);
      if (!ok) throw new Error("acceptMutualCancel returned false");
      ghToast({
        title: "Match cancelled",
        description: "Mutual cancel confirmed on-chain",
        type: "success",
      });
      await reload();
    } catch (e) {
      ghToast({
        title: "Accept cancel failed",
        description: e instanceof Error ? e.message : String(e),
        type: "error",
      });
    }
  };

  const openDispute = async () => {
    if (!disputeAllowed) return;
    if (!disputeVideo.trim() || !isValidVideoProofUrl(disputeVideo)) {
      ghToast({
        title: "Video proof required",
        description: "Proof must be an https video or clip URL",
        type: "error",
      });
      return;
    }
    const raw = disputeVideo.trim();
    const videoProofUrl = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      const ok = await disputeMutualCancel(
        c.id,
        viewer,
        videoProofUrl,
        disputeReason.trim() || "Disputing mutual cancel after scored play",
      );
      if (!ok) throw new Error("disputeMutualCancel returned false");
      setDisputeOpen(false);
      setDisputeVideo("");
      setDisputeReason("");
      ghToast({
        title: "Dispute opened on-chain",
        description: "Monitor / support will review the video proof",
        type: "success",
      });
      await reload();
    } catch (e) {
      ghToast({
        title: "Dispute failed",
        description: e instanceof Error ? e.message : String(e),
        type: "error",
      });
    }
  };

  const openBetable = async () => {
    const gate = canCreateBetable(c, viewer);
    if (!gate.ok) {
      ghToast({
        title: "Cannot open betable",
        description: gate.reason,
        type: "error",
      });
      return;
    }
    const mon = (c.monitorUsername || monitorName).trim();
    if (!mon) {
      ghToast({
        title: "Monitor required",
        description: "Assign a monitor before opening the market",
        type: "error",
      });
      return;
    }
    let scheduled: Date | null = c.scheduledAt ? new Date(c.scheduledAt) : null;
    if (betableDate && betableTime) {
      scheduled = new Date(`${betableDate}T${betableTime}:00`);
    }
    try {
      const ok = await openChallengeBetable(c.id, viewer, scheduled, mon);
      if (!ok) throw new Error("openChallengeBetable returned false");
      ghToast({
        title: "Betable market opened on-chain",
        description: `Monitor · ${mon}`,
        type: "success",
      });
      await reload();
    } catch (e) {
      ghToast({
        title: "Open betable failed",
        description: e instanceof Error ? e.message : String(e),
        type: "error",
      });
    }
  };

  const neededConfirm = pending ? needsConfirmFrom(c, pending) : [];

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={c.coverUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.48) saturate(1.1)",
            }}
          />
          <Box
            position="absolute"
            inset="0"
            bg="linear-gradient(180deg, rgba(7,6,18,0.15) 0%, rgba(7,6,18,0.95) 100%)"
          />
          <HStack
            position="absolute"
            top="phi3"
            left="phi3"
            right="phi3"
            justify="space-between"
            flexWrap="wrap"
            gap="2"
          >
            <Link href="/challenges">
              <GhButton size="sm" variant="soft" leftIcon={<ArrowLeft size={14} />}>
                Challenges
              </GhButton>
            </Link>
            <HStack gap="2">
              <GhButton
                size="sm"
                variant="outline"
                leftIcon={<Share2 size={14} />}
                onClick={share}
              >
                Share
              </GhButton>
              {c.betable && c.marketId ? (
                <Link href={`/markets/${c.marketId}`}>
                  <GhButton
                    size="sm"
                    variant="prize"
                    leftIcon={<ChartCandlestick size={14} />}
                  >
                    Betable
                  </GhButton>
                </Link>
              ) : null}
            </HStack>
          </HStack>
        </Box>

        <Box px={{ base: "phi3", md: "phi5" }} pb="phi4" mt="-1rem" position="relative">
          <HStack gap="2" mb="phi2" flexWrap="wrap">
            <GhBadge
              tone={
                c.status === "live"
                  ? "live"
                  : c.status === "open"
                    ? "brand"
                    : c.status === "settled"
                      ? "success"
                      : "muted"
              }
              pulse={c.status === "live"}
            >
              {c.status}
            </GhBadge>
            <GhBadge tone="live">{c.console}</GhBadge>
            {c.betable ? <GhBadge tone="prize">Betable</GhBadge> : null}
            {c.tournamentId ? (
              <GhBadge tone="prize">
                <Trophy size={10} /> Bracket match
              </GhBadge>
            ) : null}
            {c.monitorUsername ? (
              <GhBadge tone="attr">
                <Shield size={10} /> Monitor · {c.monitorUsername}
              </GhBadge>
            ) : null}
            {isPlayer(c) ? <GhBadge tone="brand">You play</GhBadge> : null}
            {isMonitor(c) ? <GhBadge tone="attr">You monitor</GhBadge> : null}
            {isTournamentHost(c) ? (
              <GhBadge tone="prize">You host tournament</GhBadge>
            ) : null}
            {c.cancelRequest?.status === "pending" ? (
              <GhBadge tone="live" pulse>
                Cancel pending
              </GhBadge>
            ) : null}
            {c.dispute?.status === "open" ? (
              <GhBadge tone="danger">Dispute open</GhBadge>
            ) : null}
          </HStack>
          <Heading
            as="h1"
            fontFamily="heading"
            fontSize={{ base: "xl", md: "2xl" }}
            fontWeight="extrabold"
            letterSpacing="0.03em"
            textTransform="uppercase"
          >
            {c.title}
          </Heading>
          <Text fontSize="sm" color="fg.muted" mt="phi2" maxW="36rem" lineHeight="1.55">
            {c.description}
          </Text>
          <Text fontSize="xs" color="fg.subtle" mt="phi2">
            {c.game} · stake {formatIcp(c.entryFeeIcp)} · start{" "}
            {formatWhen(c.scheduledAt)}
            {c.tournamentMatchLabel ? ` · ${c.tournamentMatchLabel}` : ""}
          </Text>
        </Box>
      </Box>

      {/* ── Lead: scoreboard + challenger / opponent ── */}
      {c.opponent ? (
        <Scoreboard
          c={c}
          pending={pending}
          confirmSecs={confirmSecs}
          neededConfirm={neededConfirm}
          canConfirm={canConfirm}
          onConfirm={confirmScore}
          onDisputeScore={disputeScore}
        />
      ) : null}

      <SimpleGrid columns={{ base: 1, md: 3 }} gap="phi3" alignItems="stretch">
        <SideCard
          side={c.creator}
          label="Challenger"
          tone="brand"
          score={c.scoreCreator}
          game={c.game}
        />
        <GhSurface
          variant="glass"
          p="phi4"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
        >
          <Text
            fontFamily="heading"
            fontSize="2xs"
            fontWeight="bold"
            letterSpacing="0.14em"
            color="fg.subtle"
            mb="1"
          >
            POT
          </Text>
          <Text
            fontFamily="heading"
            fontSize="2xl"
            fontWeight="extrabold"
            className="gh-text-prize"
          >
            {formatIcp(pot)}
          </Text>
          <Text fontSize="xs" color="fg.muted" mt="1">
            {c.tournamentId
              ? `Wager 0 ICP${c.potExtraIcp > 0 ? ` · tips ${formatIcp(c.potExtraIcp)}` : ""}`
              : `Wager ${formatIcp(c.entryFeeIcp)} × paid${
                  c.potExtraIcp > 0 ? ` + ${formatIcp(c.potExtraIcp)} tips` : ""
                }`}
          </Text>
          <Box
            mt="phi3"
            w="12"
            h="12"
            borderRadius="full"
            bg="brand.muted"
            color="brand.fg"
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderWidth="1px"
            borderColor="border.brand"
          >
            <Swords size={22} />
          </Box>
        </GhSurface>
        {c.opponent ? (
          <SideCard
            side={c.opponent}
            label="Opponent"
            tone="prize"
            score={c.scoreOpponent}
            game={c.game}
          />
        ) : (
          <GhSurface
            variant="elevated"
            p="phi4"
            borderStyle="dashed"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap="phi2"
          >
            <GhAvatar name="open" size="lg" />
            <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
              Open seat
            </Text>
            <Text fontSize="xs" color="fg.muted" textAlign="center">
              {c.invitedUsername
                ? `Invited · ${c.invitedUsername}`
                : "Anyone can accept"}
            </Text>
          </GhSurface>
        )}
      </SimpleGrid>

      {/* Accept + score report (match actions) */}
      {isOpen ? (
        <AcceptPanel
          c={c}
          open={acceptOpen}
          onOpenChange={setAcceptOpen}
          streamUrl={streamUrl}
          setStreamUrl={setStreamUrl}
          notes={notes}
          setNotes={setNotes}
          accepting={accepting}
          onAccept={() => void accept()}
        />
      ) : null}

      {canReport ? (
        <ScoreReportPanel
          c={c}
          role={role!}
          scoreA={scoreA}
          scoreB={scoreB}
          setScoreA={setScoreA}
          setScoreB={setScoreB}
          isFinal={isFinal}
          setIsFinal={setIsFinal}
          pending={pending}
          onSubmit={submitScore}
        />
      ) : null}

      {/* Mutual cancel + dispute (standalone only) */}
      {!c.tournamentId && isPlayer(c) && c.opponent ? (
        <MutualCancelPanel
          c={c}
          viewer={viewer}
          cancelAllowed={cancelAllowed}
          iRequestedCancel={iRequestedCancel}
          theyRequestedCancel={Boolean(theyRequestedCancel)}
          disputeAllowed={disputeAllowed}
          disputeOpen={disputeOpen}
          setDisputeOpen={setDisputeOpen}
          disputeVideo={disputeVideo}
          setDisputeVideo={setDisputeVideo}
          disputeReason={disputeReason}
          setDisputeReason={setDisputeReason}
          onRequestCancel={requestCancel}
          onWithdrawCancel={withdrawCancel}
          onAcceptCancel={acceptCancel}
          onOpenDispute={openDispute}
        />
      ) : null}

      {c.dispute?.status === "open" ? (
        <DisputeStatusCard dispute={c.dispute} />
      ) : null}

      {/* Tournament info + betable (above streams / match info) */}
      {c.tournamentId ? <TournamentContextSection challenge={c} /> : null}

      {c.betable && c.marketId ? (
        <BetableOpenPanel marketId={c.marketId} />
      ) : (
        <BetableCreatePanel
          c={c}
          gate={betableGate}
          isPlayer={isPlayer(c)}
          monitorName={monitorName}
          setMonitorName={setMonitorName}
          betableDate={betableDate}
          setBetableDate={setBetableDate}
          betableTime={betableTime}
          setBetableTime={setBetableTime}
          onOpen={openBetable}
        />
      )}

      {/* Live streams + Match info */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="phi3" alignItems="stretch">
        <FeaturedMatchPanel
          tone="live"
          eyebrow="Broadcast"
          title="Live streams"
          icon={<Radio size={18} />}
          subtitle="Both seats should stream when the match goes live."
        >
          <VStack align="stretch" gap="2">
            <StreamRow
              label="Challenger"
              username={c.creator.username}
              url={c.creator.streamUrl}
            />
            <StreamRow
              label="Opponent"
              username={c.opponent?.username ?? "—"}
              url={c.opponent?.streamUrl}
              emptyHint={isOpen ? "Set when they accept" : "No stream"}
            />
          </VStack>
        </FeaturedMatchPanel>

        <FeaturedMatchPanel
          tone="brand"
          eyebrow="Details"
          title="Match info"
          icon={<Info size={18} />}
          subtitle={
            c.tournamentId
              ? "Bracket match · heads-up wager is 0 (tournament entry on parent)."
              : "Heads-up money match · both sides escrow the wager."
          }
        >
          <VStack align="stretch" gap="2">
            <InfoRow label="Game" value={c.game} />
            <InfoRow label="Console" value={c.console} />
            <InfoRow
              label="Wager"
              value={
                c.tournamentId
                  ? "0 ICP"
                  : formatIcp(c.entryFeeIcp)
              }
              emphasize
              prize={!c.tournamentId}
            />
            {c.tournamentId ? (
              <InfoRow
                label="Tournament entry"
                value={formatIcp(c.entryFeeIcp)}
              />
            ) : null}
            <InfoRow label="Schedule" value={formatWhen(c.scheduledAt)} />
            <InfoRow label="Status" value={c.status} />
            <InfoRow
              label="Monitor"
              value={c.monitorUsername ?? "Unassigned"}
            />
            {c.tournamentMatchLabel ? (
              <InfoRow label="Bracket slot" value={c.tournamentMatchLabel} />
            ) : null}
            {c.betable && c.marketId ? (
              <Link href={`/markets/${c.marketId}`}>
                <GhButton
                  size="sm"
                  variant="prize"
                  w="100%"
                  leftIcon={<ChartCandlestick size={14} />}
                >
                  Open betable market
                </GhButton>
              </Link>
            ) : null}
          </VStack>
        </FeaturedMatchPanel>
      </SimpleGrid>

      {/* Grow the pot under streams / match info */}
      <EscrowGrowPotSection
        address={c.escrowSubaccount}
        pot={pot}
        entry={c.tournamentId ? 0 : c.entryFeeIcp}
        extra={c.potExtraIcp}
        onCopy={() =>
          copy(c.escrowSubaccount, "Challenge escrow address copied")
        }
        tournamentMatch={Boolean(c.tournamentId)}
      />

      {/* Assigned monitor (after grow the pot) */}
      {c.monitorUsername ? (
        <MonitorSection username={c.monitorUsername} game={c.game} />
      ) : null}

      {/* Policy explainer */}
      <RulesExplainer />
    </VStack>
  );
}

function MonitorSection({
  username,
  game,
}: {
  username: string;
  game: string;
}) {
  const mon = getMonitorProfile(username)!;
  return (
    <Box
      position="relative"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="attr.solid"
      overflow="hidden"
      boxShadow="glow"
    >
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(125deg, rgba(139,92,246,0.18) 0%, rgba(13,11,26,0.94) 48%, rgba(34,211,238,0.08) 100%)"
      />
      <Box position="relative" p={{ base: "phi4", md: "phi5" }}>
        <HStack gap="2" mb="phi3" flexWrap="wrap">
          <GhBadge tone="attr">
            <Shield size={10} /> Match monitor
          </GhBadge>
          <GhBadge tone="muted">{game}</GhBadge>
        </HStack>

        <Flex
          direction={{ base: "column", sm: "row" }}
          gap="phi4"
          align={{ sm: "center" }}
        >
          <GhAvatar name={mon.username} size="xl" tone="attr" status="online" />
          <Box flex="1" minW="0">
            <Text
              fontFamily="heading"
              fontSize="2xs"
              fontWeight="bold"
              letterSpacing="0.12em"
              textTransform="uppercase"
              color="attr.fg"
              mb="1"
            >
              Assigned official
            </Text>
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              fontSize={{ base: "xl", md: "2xl" }}
              lineClamp={1}
            >
              {mon.username}
            </Text>
            {mon.note ? (
              <Text fontSize="sm" color="fg.muted" mt="0.5">
                {mon.note}
              </Text>
            ) : null}
            <HStack gap="2" mt="phi3" flexWrap="wrap">
              <Link href={`/profile?u=${encodeURIComponent(mon.username)}`}>
                <GhButton variant="outline" size="sm">
                  View profile
                </GhButton>
              </Link>
            </HStack>
          </Box>
        </Flex>

        <SimpleGrid columns={{ base: 2, md: 3 }} gap="phi2" mt="phi4">
          <MonitorStat
            icon={<Shield size={14} />}
            label="Games monitored"
            value={String(mon.gamesMonitored)}
          />
          <MonitorStat
            icon={<Gavel size={14} />}
            label="Disputes"
            value={String(mon.disputes)}
          />
          <MonitorStat
            icon={<Coins size={14} />}
            label="Earnings"
            value={formatIcp(mon.earningsIcp)}
            prize
          />
        </SimpleGrid>
      </Box>
    </Box>
  );
}

function MonitorStat({
  icon,
  label,
  value,
  prize,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  prize?: boolean;
}) {
  return (
    <Box
      p="phi3"
      borderRadius="xl"
      borderWidth="1px"
      borderColor={prize ? "prize.solid" : "attr.solid"}
      bg="blackAlpha.500"
    >
      <HStack gap="1" mb="1" color="fg.subtle">
        {icon}
        <Text
          fontSize="2xs"
          fontFamily="heading"
          fontWeight="bold"
          letterSpacing="0.08em"
          textTransform="uppercase"
        >
          {label}
        </Text>
      </HStack>
      <Text
        fontFamily="heading"
        fontWeight="extrabold"
        fontSize="lg"
        className={prize ? "gh-text-prize" : undefined}
      >
        {value}
      </Text>
    </Box>
  );
}

function FeaturedMatchPanel({
  tone,
  eyebrow,
  title,
  subtitle,
  icon,
  children,
}: {
  tone: "live" | "brand";
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const border = tone === "live" ? "live.solid" : "border.brand";
  const iconBg = tone === "live" ? "live.muted" : "brand.muted";
  const iconColor = tone === "live" ? "live.fg" : "brand.fg";
  const gradient =
    tone === "live"
      ? "linear-gradient(125deg, rgba(34,211,238,0.14) 0%, rgba(13,11,26,0.94) 52%, rgba(139,92,246,0.1) 100%)"
      : "linear-gradient(125deg, rgba(163,255,61,0.12) 0%, rgba(13,11,26,0.94) 50%, rgba(139,92,246,0.1) 100%)";

  return (
    <Box
      position="relative"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={border}
      overflow="hidden"
      boxShadow="glow"
      h="100%"
    >
      <Box position="absolute" inset="0" bg={gradient} />
      <Box position="relative" p={{ base: "phi4", md: "phi5" }} h="100%">
        <HStack gap="2" mb="phi2" align="flex-start">
          <Box
            w="10"
            h="10"
            borderRadius="xl"
            bg={iconBg}
            color={iconColor}
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderWidth="1px"
            borderColor={border}
            flexShrink={0}
          >
            {icon}
          </Box>
          <Box minW="0">
            <Text
              fontFamily="heading"
              fontSize="2xs"
              fontWeight="bold"
              letterSpacing="0.12em"
              textTransform="uppercase"
              color={iconColor}
            >
              {eyebrow}
            </Text>
            <Text fontFamily="heading" fontWeight="extrabold" fontSize="lg">
              {title}
            </Text>
          </Box>
        </HStack>
        {subtitle ? (
          <Text fontSize="sm" color="fg.muted" mb="phi3" lineHeight="1.5">
            {subtitle}
          </Text>
        ) : (
          <Box mb="phi3" />
        )}
        {children}
      </Box>
    </Box>
  );
}

function BetableOpenPanel({ marketId }: { marketId: string }) {
  return (
    <Box
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="prize.solid"
      overflow="hidden"
      boxShadow="glow-prize"
    >
      <Box
        bg="linear-gradient(125deg, rgba(244,63,168,0.16) 0%, rgba(13,11,26,0.94) 55%)"
        p={{ base: "phi4", md: "phi5" }}
      >
        <HStack gap="2" mb="phi2" flexWrap="wrap">
          <ChartCandlestick size={18} color="var(--gh-colors-prize-fg)" />
          <Text fontFamily="heading" fontWeight="extrabold" fontSize="md">
            Betable market
          </Text>
          <GhBadge tone="prize" pulse>
            Open
          </GhBadge>
        </HStack>
        <Text fontSize="sm" color="fg.muted" lineHeight="1.55" mb="phi3">
          A market is attached to this challenge. Spectators can trade until the
          match settles.
        </Text>
        <Link href={`/markets/${marketId}`}>
          <GhButton
            variant="prize"
            leftIcon={<ChartCandlestick size={16} />}
            rightIcon={<ExternalLink size={14} />}
          >
            Open betable market
          </GhButton>
        </Link>
      </Box>
    </Box>
  );
}

function TournamentContextSection({ challenge }: { challenge: ChallengeDetail }) {
  const tournament = parentTournament(challenge);

  if (!tournament) {
    return (
      <GhSurface variant="muted" p="phi4">
        <HStack gap="2" mb="2">
          <Trophy size={16} color="var(--gh-colors-prize-fg)" />
          <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
            Tournament match
          </Text>
        </HStack>
        <Text fontSize="sm" color="fg.muted">
          Linked to tournament{" "}
          <Text as="span" fontFamily="mono" color="prize.fg">
            {challenge.tournamentId}
          </Text>
          {challenge.tournamentMatchLabel
            ? ` · ${challenge.tournamentMatchLabel}`
            : ""}
          . Full tournament record not in demo catalog.
        </Text>
      </GhSurface>
    );
  }

  const hasBetable = Boolean(
    challenge.tournamentHasBetable && tournament.betable && tournament.marketId,
  );
  const formatLabel =
    tournament.format === "single_elim"
      ? "Single elim"
      : tournament.format === "double_elim"
        ? "Double elim"
        : "Round robin";

  return (
    <VStack align="stretch" gap="phi3">
      {/* Tournament details card */}
      <Box
        position="relative"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="prize.solid"
        overflow="hidden"
        boxShadow="glow-prize"
      >
        <Box
          position="absolute"
          inset="0"
          bg="linear-gradient(125deg, rgba(244,63,168,0.16) 0%, rgba(13,11,26,0.94) 50%, rgba(163,255,61,0.06) 100%)"
        />
        <Box position="relative">
          <Box position="relative" h={{ base: "5.5rem", md: "7rem" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tournament.coverUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "brightness(0.4) saturate(1.1)",
              }}
            />
            <Box
              position="absolute"
              inset="0"
              bg="linear-gradient(180deg, transparent 0%, rgba(7,6,18,0.92) 100%)"
            />
          </Box>
          <Box px={{ base: "phi4", md: "phi5" }} pb="phi4" mt="-2rem" position="relative">
            <HStack gap="2" mb="phi2" flexWrap="wrap">
              <GhBadge tone="prize">
                <Trophy size={10} /> Parent tournament
              </GhBadge>
              <GhBadge
                tone={
                  tournament.status === "live"
                    ? "live"
                    : tournament.status === "settled"
                      ? "success"
                      : "brand"
                }
                pulse={tournament.status === "live"}
              >
                {statusLabel(tournament.status)}
              </GhBadge>
              <GhBadge tone="muted">{formatLabel}</GhBadge>
              {hasBetable ? (
                <GhBadge tone="prize">
                  <ChartCandlestick size={10} /> Betable
                </GhBadge>
              ) : (
                <GhBadge tone="muted">No tournament market</GhBadge>
              )}
            </HStack>
            <Heading
              as="h2"
              fontFamily="heading"
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="extrabold"
              letterSpacing="0.03em"
            >
              {tournament.title}
            </Heading>
            {challenge.tournamentMatchLabel ? (
              <Text fontSize="sm" color="prize.fg" fontWeight="bold" mt="1">
                This match · {challenge.tournamentMatchLabel}
              </Text>
            ) : null}
            <Text fontSize="sm" color="fg.muted" mt="phi2" lineHeight="1.55" maxW="40rem">
              {tournament.description}
            </Text>

            <SimpleGrid columns={{ base: 2, sm: 4 }} gap="phi2" mt="phi3">
              <MiniStat label="Game" value={tournament.game} />
              <MiniStat label="Console" value={tournament.console} />
              <MiniStat label="Lobby" value={filledLabel(tournament)} />
              <MiniStat
                label="Prize pot"
                value={formatIcp(potFrom(tournament))}
                prize
              />
              <MiniStat label="Entry" value={formatIcp(tournament.entryFeeIcp)} />
              <MiniStat label="Host fee" value={`${tournament.hostFeePct}%`} />
              <MiniStat label="Host" value={tournament.hostUsername} />
              <MiniStat
                label="Start"
                value={formatTournamentWhen(tournament.scheduledAt)}
              />
            </SimpleGrid>

            <HStack mt="phi3" gap="2" flexWrap="wrap">
              <Link href={`/tournaments/${tournament.id}`}>
                <GhButton
                  size="sm"
                  variant="prize"
                  leftIcon={<Trophy size={14} />}
                  rightIcon={<ExternalLink size={12} />}
                >
                  Open tournament
                </GhButton>
              </Link>
              {hasBetable && tournament.marketId ? (
                <Link href={`/markets/${tournament.marketId}`}>
                  <GhButton
                    size="sm"
                    variant="outline"
                    leftIcon={<ChartCandlestick size={14} />}
                  >
                    Tournament market
                  </GhButton>
                </Link>
              ) : null}
              {tournament.streamUrl ? (
                <a href={tournament.streamUrl} target="_blank" rel="noreferrer">
                  <GhButton size="sm" variant="soft" leftIcon={<Radio size={14} />}>
                    Host stream
                  </GhButton>
                </a>
              ) : null}
            </HStack>
          </Box>
        </Box>
      </Box>

      {/* Betable: overall + players */}
      {hasBetable ? (
        <TournamentBetableOnChallenge
          challenge={challenge}
          tournament={tournament}
        />
      ) : challenge.tournamentId ? (
        <GhAlert tone="info" title="No tournament betable market">
          This bracket’s parent tournament is not betable, so this challenge cannot
          open its own market either. Spectators follow the match without an
          attached book.
        </GhAlert>
      ) : null}
    </VStack>
  );
}

function TournamentBetableOnChallenge({
  challenge,
  tournament,
}: {
  challenge: ChallengeDetail;
  tournament: TournamentDetail;
}) {
  const vol = tournament.marketVolumeIcp ?? 0;
  const liq = tournament.marketLiquidityIcp ?? 0;
  const lines = tournament.marketLines ?? [];
  const mStatus = tournament.marketStatus ?? "open";
  const players = [
    challenge.creator.username,
    challenge.opponent?.username,
  ].filter(Boolean) as string[];

  const matchVol =
    challenge.matchMoneyline?.reduce((s, m) => s + m.volumeIcp, 0) ?? 0;

  return (
    <Box
      position="relative"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="prize.solid"
      overflow="hidden"
      boxShadow="glow-prize"
    >
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(125deg, rgba(244,63,168,0.18) 0%, rgba(13,11,26,0.94) 48%, rgba(163,255,61,0.06) 100%)"
      />
      <Box position="relative" p={{ base: "phi4", md: "phi5" }}>
        <Flex
          justify="space-between"
          gap="phi3"
          flexWrap="wrap"
          align="flex-start"
          mb="phi4"
        >
          <Box>
            <HStack gap="2" mb="phi2" flexWrap="wrap">
              <Box
                w="10"
                h="10"
                borderRadius="xl"
                bg="prize.muted"
                color="prize.fg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderWidth="1px"
                borderColor="prize.solid"
              >
                <ChartCandlestick size={18} />
              </Box>
              <Box>
                <Text
                  fontFamily="heading"
                  fontSize="2xs"
                  fontWeight="bold"
                  letterSpacing="0.12em"
                  textTransform="uppercase"
                  color="prize.fg"
                >
                  Tournament market
                </Text>
                <Text fontFamily="heading" fontWeight="extrabold" fontSize="lg">
                  {tournament.title} — Winner
                </Text>
              </Box>
              <GhBadge
                tone={
                  mStatus === "live"
                    ? "live"
                    : mStatus === "settled"
                      ? "success"
                      : "prize"
                }
                pulse={mStatus === "live"}
              >
                {mStatus}
              </GhBadge>
            </HStack>
            <Text fontSize="sm" color="fg.muted" maxW="36rem" lineHeight="1.5">
              Outright market for the whole bracket, plus head-to-head moneyline
              on this match’s two players.
            </Text>
          </Box>
          {tournament.marketId ? (
            <Link href={`/markets/${tournament.marketId}`}>
              <GhButton
                size="sm"
                variant="prize"
                leftIcon={<ChartCandlestick size={14} />}
                rightIcon={<ExternalLink size={12} />}
              >
                Full market
              </GhButton>
            </Link>
          ) : null}
        </Flex>

        {/* Overall stats */}
        <Text
          fontFamily="heading"
          fontSize="2xs"
          fontWeight="bold"
          letterSpacing="0.12em"
          textTransform="uppercase"
          color="fg.subtle"
          mb="phi2"
        >
          Overall market stats
        </Text>
        <SimpleGrid columns={{ base: 2, sm: 4 }} gap="phi2" mb="phi4">
          <MiniStat label="Volume" value={formatIcp(vol)} prize />
          <MiniStat label="Liquidity" value={formatIcp(liq)} />
          <MiniStat label="Outright options" value={String(lines.length || "—")} />
          <MiniStat
            label="This match H2H vol"
            value={matchVol > 0 ? formatIcp(matchVol) : "—"}
          />
        </SimpleGrid>

        {/* Player-focused stats */}
        <Text
          fontFamily="heading"
          fontSize="2xs"
          fontWeight="bold"
          letterSpacing="0.12em"
          textTransform="uppercase"
          color="fg.subtle"
          mb="phi2"
        >
          Players in this match
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="phi3" mb="phi4">
          {players.map((username) => {
            const h2h = matchLineForPlayer(challenge, username);
            const outright = tournamentLinesForPlayer(tournament, username);
            const path = outright[0];
            return (
              <Box
                key={username}
                p="phi3"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border.default"
                bg="blackAlpha.500"
              >
                <HStack gap="phi2" mb="phi3">
                  <GhAvatar name={username} size="md" tone="prize" />
                  <Box minW="0" flex="1">
                    <Text
                      fontFamily="heading"
                      fontWeight="extrabold"
                      fontSize="sm"
                      lineClamp={1}
                    >
                      {username}
                    </Text>
                    <Text fontSize="2xs" color="fg.subtle">
                      {username === challenge.creator.username
                        ? "Challenger"
                        : "Opponent"}
                    </Text>
                  </Box>
                  <Link href={`/profile?u=${encodeURIComponent(username)}`}>
                    <GhButton size="sm" variant="ghost">
                      Profile
                    </GhButton>
                  </Link>
                </HStack>

                {/* Match moneyline */}
                <Box
                  p="phi2"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={h2h ? "prize.solid" : "border.default"}
                  bg="blackAlpha.400"
                  mb="2"
                >
                  <Text
                    fontSize="2xs"
                    fontFamily="heading"
                    fontWeight="bold"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    color="prize.fg"
                    mb="1"
                  >
                    Match moneyline
                  </Text>
                  {h2h ? (
                    <>
                      <HStack justify="space-between" mb="1">
                        <Text fontSize="xs" color="fg.muted">
                          Odds
                        </Text>
                        <Text
                          fontFamily="heading"
                          fontWeight="extrabold"
                          fontSize="lg"
                          color="prize.fg"
                        >
                          {h2h.odds}
                        </Text>
                      </HStack>
                      <HStack justify="space-between" mb="1.5">
                        <Text fontSize="2xs" color="fg.subtle">
                          Implied {h2h.pct}%
                        </Text>
                        <Text fontSize="2xs" color="fg.muted">
                          {formatIcp(h2h.volumeIcp)} on side
                        </Text>
                      </HStack>
                      <Box
                        h="1.5"
                        borderRadius="full"
                        bg="blackAlpha.600"
                        overflow="hidden"
                      >
                        <Box
                          h="100%"
                          w={`${Math.min(100, Math.max(4, h2h.pct))}%`}
                          bg="linear-gradient(90deg, #f43fa8, #a3ff3d)"
                          borderRadius="full"
                        />
                      </Box>
                    </>
                  ) : (
                    <Text fontSize="xs" color="fg.subtle">
                      No H2H line yet for this seat.
                    </Text>
                  )}
                </Box>

                {/* Tournament outright path */}
                <Box
                  p="phi2"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="border.default"
                  bg="blackAlpha.400"
                >
                  <Text
                    fontSize="2xs"
                    fontFamily="heading"
                    fontWeight="bold"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    color="fg.subtle"
                    mb="1"
                  >
                    Tournament outright path
                  </Text>
                  {path ? (
                    <HStack justify="space-between" flexWrap="wrap" gap="2">
                      <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                        {path.label}
                      </Text>
                      <HStack gap="2">
                        <Text
                          fontFamily="heading"
                          fontWeight="extrabold"
                          color="prize.fg"
                        >
                          {path.odds}
                        </Text>
                        <Text fontSize="2xs" color="fg.subtle">
                          {path.pct}% ·{" "}
                          {path.volumeIcp != null
                            ? formatIcp(path.volumeIcp)
                            : "—"}
                        </Text>
                      </HStack>
                    </HStack>
                  ) : (
                    <Text fontSize="xs" color="fg.subtle">
                      Priced in Field / not a top outright option.
                    </Text>
                  )}
                </Box>
              </Box>
            );
          })}
        </SimpleGrid>

        {/* Full outright board (compact) */}
        {lines.length > 0 ? (
          <>
            <Text
              fontFamily="heading"
              fontSize="2xs"
              fontWeight="bold"
              letterSpacing="0.12em"
              textTransform="uppercase"
              color="fg.subtle"
              mb="phi2"
            >
              All outright result options
            </Text>
            <SimpleGrid columns={{ base: 1, sm: 2 }} gap="phi2">
              {lines.map((line) => {
                const isPlayerLine = players.some((p) =>
                  line.label.toLowerCase().includes(p.toLowerCase()),
                );
                return (
                  <Box
                    key={line.label}
                    p="phi3"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={isPlayerLine ? "prize.solid" : "border.default"}
                    bg={isPlayerLine ? "prize.muted" : "blackAlpha.500"}
                  >
                    <HStack justify="space-between" gap="2" mb="1">
                      <Text
                        fontFamily="heading"
                        fontWeight="extrabold"
                        fontSize="sm"
                        lineClamp={1}
                      >
                        {line.label}
                      </Text>
                      <Text
                        fontFamily="heading"
                        fontWeight="extrabold"
                        color="prize.fg"
                        flexShrink={0}
                      >
                        {line.odds}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="2xs" color="fg.subtle">
                        Implied {line.pct}%
                      </Text>
                      {line.volumeIcp != null ? (
                        <Text fontSize="2xs" color="fg.muted">
                          {formatIcp(line.volumeIcp)}
                        </Text>
                      ) : null}
                    </HStack>
                    <Box
                      h="1"
                      mt="2"
                      borderRadius="full"
                      bg="blackAlpha.600"
                      overflow="hidden"
                    >
                      <Box
                        h="100%"
                        w={`${Math.min(100, Math.max(4, line.pct))}%`}
                        bg="linear-gradient(90deg, #f43fa8, #a3ff3d)"
                      />
                    </Box>
                  </Box>
                );
              })}
            </SimpleGrid>
          </>
        ) : null}
      </Box>
    </Box>
  );
}

function Scoreboard({
  c,
  pending,
  confirmSecs,
  neededConfirm,
  canConfirm,
  onConfirm,
  onDisputeScore,
}: {
  c: ChallengeDetail;
  pending?: ScoreReport | null;
  confirmSecs: number | null;
  neededConfirm: string[];
  canConfirm: boolean;
  onConfirm: () => void;
  onDisputeScore?: () => void;
}) {
  return (
    <Box
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="border.brand"
      overflow="hidden"
      boxShadow="glow"
    >
      <Box
        bg="linear-gradient(115deg, rgba(163,255,61,0.12) 0%, rgba(13,11,26,0.95) 50%, rgba(244,63,168,0.12) 100%)"
        p={{ base: "phi4", md: "phi5" }}
      >
        <HStack justify="space-between" mb="phi3" flexWrap="wrap" gap="2">
          <Text
            fontFamily="heading"
            fontSize="2xs"
            fontWeight="bold"
            letterSpacing="0.14em"
            textTransform="uppercase"
            color="fg.subtle"
          >
            Scoreboard
            {c.scoreIsFinal ? " · FINAL" : ""}
          </Text>
          {c.scoreIsFinal ? (
            <GhBadge tone="success">Settled</GhBadge>
          ) : pending?.status === "pending" ? (
            <GhBadge tone="live" pulse>
              Pending confirm
            </GhBadge>
          ) : (
            <GhBadge tone="brand">Live</GhBadge>
          )}
        </HStack>
        <HStack justify="center" gap={{ base: "phi4", md: "phi6" }} align="center">
          <Box textAlign="center" minW="5rem">
            <Text fontFamily="heading" fontSize="xs" color="fg.muted" mb="1">
              {c.creator.username}
            </Text>
            <Text
              fontFamily="heading"
              fontSize={{ base: "4xl", md: "5xl" }}
              fontWeight="extrabold"
              lineHeight="1"
              color="brand.fg"
            >
              {c.scoreCreator}
            </Text>
          </Box>
          <Text
            fontFamily="heading"
            fontSize="2xl"
            fontWeight="extrabold"
            color="fg.subtle"
          >
            –
          </Text>
          <Box textAlign="center" minW="5rem">
            <Text fontFamily="heading" fontSize="xs" color="fg.muted" mb="1">
              {c.opponent?.username}
            </Text>
            <Text
              fontFamily="heading"
              fontSize={{ base: "4xl", md: "5xl" }}
              fontWeight="extrabold"
              lineHeight="1"
              color="prize.fg"
            >
              {c.scoreOpponent}
            </Text>
          </Box>
        </HStack>

        {pending?.status === "pending" ? (
          <Box
            mt="phi4"
            p="phi3"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="live.solid"
            bg="blackAlpha.500"
          >
            <HStack justify="space-between" flexWrap="wrap" gap="2" mb="2">
              <Text fontSize="sm" color="fg.default" lineHeight="1.45">
                <strong>{pending.reportedBy}</strong> (
                {pending.reportedByRole.replace("_", " ")}) reported{" "}
                <strong>
                  {pending.creatorScore}–{pending.opponentScore}
                </strong>
                {pending.isFinal ? " as FINAL" : ""}
              </Text>
              {confirmSecs != null ? (
                <GhBadge tone="live">
                  <Clock size={10} /> {formatCountdown(confirmSecs)}
                </GhBadge>
              ) : (
                <GhBadge tone="brand">Awaiting other player</GhBadge>
              )}
            </HStack>
            <Text fontSize="xs" color="fg.muted" mb="phi2">
              Confirm required from: {neededConfirm.join(" or ")}
              {pending.reportedByRole !== "player"
                ? " · 5 minute window"
                : ""}
            </Text>
            {canConfirm ? (
              <HStack gap="2" flexWrap="wrap">
                <GhButton
                  variant="primary"
                  leftIcon={<UserCheck size={16} />}
                  onClick={onConfirm}
                >
                  Confirm score {pending.creatorScore}–{pending.opponentScore}
                </GhButton>
                {onDisputeScore ? (
                  <GhButton
                    variant="outline"
                    leftIcon={<Gavel size={16} />}
                    onClick={onDisputeScore}
                  >
                    Dispute score
                  </GhButton>
                ) : null}
              </HStack>
            ) : (
              <Text fontSize="xs" color="fg.subtle">
                You are not the required confirmer for this report.
              </Text>
            )}
          </Box>
        ) : null}

        {pending?.status === "expired" ? (
          <GhAlert tone="warning" title="Last report expired" mt="phi3">
            Monitor/host report was not confirmed in 5 minutes. Submit a new score.
          </GhAlert>
        ) : null}
      </Box>
    </Box>
  );
}

function EscrowGrowPotSection({
  address,
  pot,
  entry,
  extra,
  onCopy,
  tournamentMatch,
}: {
  address: string;
  pot: number;
  entry: number;
  extra: number;
  onCopy: () => void;
  tournamentMatch?: boolean;
}) {
  return (
    <Box
      position="relative"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="prize.solid"
      overflow="hidden"
      boxShadow="glow-prize"
    >
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(125deg, rgba(244,63,168,0.16) 0%, rgba(13,11,26,0.94) 48%, rgba(163,255,61,0.08) 100%)"
      />
      <Box position="relative" p={{ base: "phi4", md: "phi5" }}>
        <Flex
          direction={{ base: "column", md: "row" }}
          gap="phi5"
          align={{ md: "center" }}
        >
          <Box
            mx={{ base: "auto", md: 0 }}
            p="phi3"
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="prize.solid"
            bg="white"
            boxShadow="glow-prize"
            flexShrink={0}
          >
            <QRCodeSVG
              value={address}
              size={168}
              level="M"
              includeMargin
              bgColor="#ffffff"
              fgColor="#0d0b1a"
            />
          </Box>

          <Box flex="1" minW="0">
            <HStack gap="2" mb="phi2" flexWrap="wrap">
              <Box
                w="10"
                h="10"
                borderRadius="xl"
                bg="prize.muted"
                color="prize.fg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderWidth="1px"
                borderColor="prize.solid"
              >
                <Coins size={18} />
              </Box>
              <Box>
                <Text
                  fontFamily="heading"
                  fontSize="2xs"
                  fontWeight="bold"
                  letterSpacing="0.12em"
                  textTransform="uppercase"
                  color="prize.fg"
                >
                  Challenge escrow
                </Text>
                <Text fontFamily="heading" fontWeight="extrabold" fontSize="lg">
                  Grow the pot
                </Text>
              </Box>
            </HStack>
            <Text fontSize="sm" color="fg.muted" lineHeight="1.55" mb="phi3">
              {tournamentMatch
                ? "Bracket match · heads-up wager is 0. Tips still grow this match pot and pay with the winner on finalize."
                : "Anyone can tip ICP into this match subaccount. Tips stack on top of player wagers and pay out with the winner on finalize."}
            </Text>

            <SimpleGrid columns={{ base: 3, sm: 3 }} gap="phi2" mb="phi3">
              <MiniStat label="Live pot" value={formatIcp(pot)} prize />
              <MiniStat
                label={tournamentMatch ? "Wager" : "Wager / entry"}
                value={formatIcp(entry)}
              />
              <MiniStat label="Tips" value={formatIcp(extra)} />
            </SimpleGrid>

            <Box
              p="phi3"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="border.default"
              bg="blackAlpha.500"
            >
              <Text
                fontSize="2xs"
                color="fg.subtle"
                fontFamily="heading"
                letterSpacing="0.1em"
                textTransform="uppercase"
                mb="1"
              >
                Escrow subaccount address
              </Text>
              <Text
                fontFamily="mono"
                fontSize="xs"
                color="fg.default"
                wordBreak="break-all"
                lineHeight="1.5"
              >
                {address}
              </Text>
              <HStack gap="2" mt="phi2" flexWrap="wrap">
                <GhButton
                  size="sm"
                  variant="prize"
                  leftIcon={<Copy size={14} />}
                  onClick={onCopy}
                >
                  Copy address
                </GhButton>
                <Text fontSize="2xs" color="fg.subtle">
                  Send ICP only · tips are non-refundable
                </Text>
              </HStack>
            </Box>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}

function MiniStat({
  label,
  value,
  prize,
}: {
  label: string;
  value: string;
  prize?: boolean;
}) {
  return (
    <Box
      p="phi2"
      borderRadius="lg"
      borderWidth="1px"
      borderColor={prize ? "prize.solid" : "border.default"}
      bg="blackAlpha.500"
    >
      <Text
        fontSize="2xs"
        color="fg.subtle"
        fontFamily="heading"
        fontWeight="bold"
        letterSpacing="0.08em"
        textTransform="uppercase"
      >
        {label}
      </Text>
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

function MutualCancelPanel({
  c,
  viewer,
  cancelAllowed,
  iRequestedCancel,
  theyRequestedCancel,
  disputeAllowed,
  disputeOpen,
  setDisputeOpen,
  disputeVideo,
  setDisputeVideo,
  disputeReason,
  setDisputeReason,
  onRequestCancel,
  onWithdrawCancel,
  onAcceptCancel,
  onOpenDispute,
}: {
  c: ChallengeDetail;
  viewer: string;
  cancelAllowed: boolean;
  iRequestedCancel: boolean;
  theyRequestedCancel: boolean;
  disputeAllowed: boolean;
  disputeOpen: boolean;
  setDisputeOpen: (v: boolean) => void;
  disputeVideo: string;
  setDisputeVideo: (v: string) => void;
  disputeReason: string;
  setDisputeReason: (v: string) => void;
  onRequestCancel: () => void;
  onWithdrawCancel: () => void;
  onAcceptCancel: () => void;
  onOpenDispute: () => void;
}) {
  if (c.status === "cancelled") {
    return (
      <GhAlert tone="success" title="Match cancelled">
        Mutual cancel confirmed. Stakes return to each player’s play subaccount.
      </GhAlert>
    );
  }

  if (c.status === "disputed" && c.dispute) {
    return null; // DisputeStatusCard handles this
  }

  if (c.status === "settled" || c.scoreIsFinal) {
    return null;
  }

  const scored = hasPostedScore(c);
  const peer = otherPlayer(c, viewer);

  return (
    <Box
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={
        theyRequestedCancel || iRequestedCancel ? "live.solid" : "border.default"
      }
      overflow="hidden"
      boxShadow={theyRequestedCancel ? "glow" : undefined}
    >
      <Box
        bg={
          theyRequestedCancel || iRequestedCancel
            ? "linear-gradient(125deg, rgba(34,211,238,0.12) 0%, rgba(13,11,26,0.95) 55%)"
            : "bg.elevated"
        }
        p={{ base: "phi4", md: "phi5" }}
      >
        <HStack gap="2" mb="phi2" flexWrap="wrap">
          <Box
            w="10"
            h="10"
            borderRadius="xl"
            bg="live.muted"
            color="live.fg"
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderWidth="1px"
            borderColor="live.solid"
          >
            <Handshake size={18} />
          </Box>
          <Box>
            <Text
              fontFamily="heading"
              fontSize="2xs"
              fontWeight="bold"
              letterSpacing="0.12em"
              textTransform="uppercase"
              color="live.fg"
            >
              Standalone only
            </Text>
            <Text fontFamily="heading" fontWeight="extrabold" fontSize="lg">
              Mutual cancel
            </Text>
          </Box>
        </HStack>

        <Text fontSize="sm" color="fg.muted" lineHeight="1.55" mb="phi3">
          Both players must agree to void the match and return stakes. Tournament
          bracket matches cannot use mutual cancel.{" "}
          {scored ? (
            <Text as="span" color="prize.fg" fontWeight="bold">
              Scores are posted — if you didn’t request cancel, you may dispute
              with a video proof link instead of accepting.
            </Text>
          ) : (
            "No scores yet — confirm cancel to refund both sides."
          )}
        </Text>

        {/* Pending request from me */}
        {iRequestedCancel && c.cancelRequest ? (
          <VStack align="stretch" gap="phi2">
            <GhAlert tone="live" title="Waiting on opponent">
              You requested mutual cancel
              {scored
                ? ` at ${c.cancelRequest.scoreCreatorAtRequest}–${c.cancelRequest.scoreOpponentAtRequest}`
                : ""}
              . {peer ?? "Opponent"} must accept
              {scored ? " or open a dispute with video proof" : ""}.
            </GhAlert>
            <GhButton
              size="sm"
              variant="outline"
              leftIcon={<XCircle size={14} />}
              onClick={onWithdrawCancel}
            >
              Withdraw cancel request
            </GhButton>
          </VStack>
        ) : null}

        {/* Pending request from them */}
        {theyRequestedCancel && c.cancelRequest ? (
          <VStack align="stretch" gap="phi3">
            <GhAlert tone="warning" title={`${c.cancelRequest.requestedBy} wants to cancel`}>
              Score at request: {c.cancelRequest.scoreCreatorAtRequest}–
              {c.cancelRequest.scoreOpponentAtRequest}. Accept to void and refund,
              or dispute if you believe the cancel is invalid.
            </GhAlert>
            <HStack gap="2" flexWrap="wrap">
              <GhButton
                variant="live"
                leftIcon={<Handshake size={16} />}
                onClick={onAcceptCancel}
              >
                Accept mutual cancel
              </GhButton>
              {disputeAllowed ? (
                <GhButton
                  variant="outline"
                  leftIcon={<Gavel size={16} />}
                  onClick={() => setDisputeOpen(!disputeOpen)}
                >
                  {disputeOpen ? "Hide dispute" : "Dispute with video"}
                </GhButton>
              ) : (
                <Text fontSize="xs" color="fg.subtle">
                  Dispute unlocks only when either score is above 0.
                </Text>
              )}
            </HStack>

            {disputeOpen && disputeAllowed ? (
              <Box
                p="phi3"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="prize.solid"
                bg="blackAlpha.500"
              >
                <Text
                  fontFamily="heading"
                  fontWeight="extrabold"
                  fontSize="sm"
                  mb="phi2"
                  color="prize.fg"
                >
                  Open dispute
                </Text>
                <Text fontSize="xs" color="fg.muted" mb="phi3" lineHeight="1.45">
                  Proof <strong>must</strong> be a video link (VOD, clip, or full
                  stream). Text screenshots alone are not accepted.
                </Text>
                <VStack align="stretch" gap="phi2">
                  <GhField
                    label="Video proof URL"
                    required
                    helperText="YouTube · Twitch clip/VOD · Kick · Streamable · direct mp4…"
                  >
                    <GhInput
                      value={disputeVideo}
                      onChange={(e) => setDisputeVideo(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=… or clips.twitch.tv/…"
                      tone="prize"
                    />
                  </GhField>
                  <GhField label="Reason (optional)">
                    <GhTextarea
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      placeholder="They requested cancel after throwing / score is wrong…"
                    />
                  </GhField>
                  <GhButton
                    variant="prize"
                    leftIcon={<Gavel size={16} />}
                    onClick={onOpenDispute}
                  >
                    Submit dispute
                  </GhButton>
                </VStack>
              </Box>
            ) : null}
          </VStack>
        ) : null}

        {/* Idle — can request */}
        {!iRequestedCancel &&
        !theyRequestedCancel &&
        cancelAllowed &&
        c.cancelRequest?.status !== "pending" ? (
          <HStack gap="2" flexWrap="wrap">
            <GhButton
              variant="outline"
              leftIcon={<Handshake size={16} />}
              onClick={onRequestCancel}
            >
              Request mutual cancel
            </GhButton>
            <Text fontSize="xs" color="fg.subtle">
              Other player must confirm
              {scored ? " · they may dispute with video" : ""}
            </Text>
          </HStack>
        ) : null}

        {!cancelAllowed && !iRequestedCancel && !theyRequestedCancel ? (
          <Text fontSize="xs" color="fg.subtle">
            Mutual cancel unavailable
            {c.tournamentId
              ? " on tournament bracket matches."
              : " in this state."}
          </Text>
        ) : null}
      </Box>
    </Box>
  );
}

function DisputeStatusCard({ dispute }: { dispute: ChallengeDispute }) {
  return (
    <Box
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="prize.solid"
      overflow="hidden"
      boxShadow="glow-prize"
    >
      <Box
        bg="linear-gradient(125deg, rgba(244,63,168,0.16) 0%, rgba(13,11,26,0.94) 55%)"
        p={{ base: "phi4", md: "phi5" }}
      >
        <HStack gap="2" mb="phi3" flexWrap="wrap">
          <Gavel size={18} color="var(--gh-colors-prize-fg)" />
          <Text fontFamily="heading" fontWeight="extrabold" fontSize="md">
            Dispute open
          </Text>
          <GhBadge tone="danger">{dispute.status}</GhBadge>
        </HStack>
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="phi2" mb="phi3">
          <InfoRow label="Opened by" value={dispute.openedBy} />
          <InfoRow label="Against" value={dispute.against} />
          <InfoRow
            label="Opened"
            value={formatWhen(dispute.openedAt)}
          />
          <InfoRow
            label="Context"
            value={
              dispute.fromCancelRequest
                ? "Mutual cancel rejected"
                : "Score / conduct"
            }
          />
        </SimpleGrid>
        <Text fontSize="sm" color="fg.muted" mb="phi2" lineHeight="1.5">
          {dispute.reason}
        </Text>
        <a href={dispute.videoProofUrl} target="_blank" rel="noreferrer">
          <GhButton
            size="sm"
            variant="prize"
            leftIcon={<ExternalLink size={14} />}
          >
            View video proof
          </GhButton>
        </a>
      </Box>
    </Box>
  );
}

function ScoreReportPanel({
  c,
  role,
  scoreA,
  scoreB,
  setScoreA,
  setScoreB,
  isFinal,
  setIsFinal,
  pending,
  onSubmit,
}: {
  c: ChallengeDetail;
  role: "player" | "monitor" | "tournament_host";
  scoreA: string;
  scoreB: string;
  setScoreA: (v: string) => void;
  setScoreB: (v: string) => void;
  isFinal: boolean;
  setIsFinal: (v: boolean) => void;
  pending?: ScoreReport | null;
  onSubmit: () => void;
}) {
  const blocked = pending?.status === "pending";
  return (
    <Box
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="border.brand"
      overflow="hidden"
      boxShadow="glow"
    >
      <Box
        bg="linear-gradient(125deg, rgba(163,255,61,0.1) 0%, rgba(13,11,26,0.95) 55%)"
        p={{ base: "phi4", md: "phi5" }}
      >
        <HStack gap="2" mb="phi3" flexWrap="wrap">
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
          >
            <ClipboardCheck size={18} />
          </Box>
          <Box>
            <Text
              fontFamily="heading"
              fontSize="2xs"
              fontWeight="bold"
              letterSpacing="0.12em"
              textTransform="uppercase"
              color="brand.fg"
            >
              Score control · {role.replace("_", " ")}
            </Text>
            <Text fontFamily="heading" fontWeight="extrabold" fontSize="lg">
              Report match score
            </Text>
          </Box>
        </HStack>

        <Text fontSize="sm" color="fg.muted" mb="phi3" lineHeight="1.5">
          Update the score anytime during the match. Mark <strong>Final score</strong>{" "}
          when the series is over. Player reports need the opponent’s confirm;
          monitor / tournament host reports need any player confirm within 5
          minutes.
        </Text>

        {blocked ? (
          <GhAlert tone="warning" title="Waiting on confirmation">
            A report is already pending. Confirm it or wait for expiry before
            submitting another.
          </GhAlert>
        ) : (
          <VStack align="stretch" gap="phi3">
            <HStack gap="phi3" flexWrap="wrap" align="flex-end">
              <Box flex="1" minW="7rem">
                <GhField label={c.creator.username}>
                  <GhInput
                    type="number"
                    min="0"
                    step="1"
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value)}
                  />
                </GhField>
              </Box>
              <Text
                fontFamily="heading"
                fontWeight="extrabold"
                color="fg.subtle"
                pb="3"
              >
                –
              </Text>
              <Box flex="1" minW="7rem">
                <GhField label={c.opponent?.username ?? "Opponent"}>
                  <GhInput
                    type="number"
                    min="0"
                    step="1"
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value)}
                  />
                </GhField>
              </Box>
            </HStack>

            <HStack
              justify="space-between"
              p="phi3"
              borderRadius="xl"
              borderWidth="1px"
              borderColor={isFinal ? "prize.solid" : "border.default"}
              bg={isFinal ? "prize.muted" : "blackAlpha.400"}
            >
              <HStack gap="2">
                <Flag size={16} color="var(--gh-colors-prize-fg)" />
                <Box>
                  <Text fontFamily="heading" fontSize="sm" fontWeight="bold">
                    Final score
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    Locks the match after confirmation · triggers payout
                  </Text>
                </Box>
              </HStack>
              <GhSwitch
                checked={isFinal}
                onCheckedChange={setIsFinal}
                tone="prize"
              />
            </HStack>

            <GhButton
              variant={isFinal ? "prize" : "primary"}
              leftIcon={<ClipboardCheck size={16} />}
              onClick={onSubmit}
            >
              {isFinal ? "Submit final score" : "Submit score update"}
            </GhButton>
          </VStack>
        )}
      </Box>
    </Box>
  );
}

function BetableCreatePanel({
  c,
  gate,
  isPlayer: player,
  monitorName,
  setMonitorName,
  betableDate,
  setBetableDate,
  betableTime,
  setBetableTime,
  onOpen,
}: {
  c: ChallengeDetail;
  gate: { ok: boolean; reason?: string };
  isPlayer: boolean;
  monitorName: string;
  setMonitorName: (v: string) => void;
  betableDate: string;
  setBetableDate: (v: string) => void;
  betableTime: string;
  setBetableTime: (v: string) => void;
  onOpen: () => void;
}) {
  return (
    <Box
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={gate.ok ? "prize.solid" : "border.default"}
      overflow="hidden"
      boxShadow={gate.ok ? "glow-prize" : undefined}
    >
      <Box
        bg={
          gate.ok
            ? "linear-gradient(125deg, rgba(244,63,168,0.14) 0%, rgba(13,11,26,0.94) 55%)"
            : "bg.elevated"
        }
        p={{ base: "phi4", md: "phi5" }}
      >
        <HStack gap="2" mb="phi2" flexWrap="wrap">
          <ChartCandlestick size={18} color="var(--gh-colors-prize-fg)" />
          <Text fontFamily="heading" fontWeight="extrabold" fontSize="md">
            Betable market
          </Text>
          {!gate.ok ? <GhBadge tone="muted">Unavailable</GhBadge> : (
            <GhBadge tone="prize">Eligible</GhBadge>
          )}
        </HStack>

        {!gate.ok ? (
          <Text fontSize="sm" color="fg.muted" lineHeight="1.55">
            {gate.reason}
            {c.tournamentId && !c.tournamentHasBetable
              ? " Bracket matches inherit the tournament market policy."
              : ""}
          </Text>
        ) : (
          <VStack align="stretch" gap="phi3">
            <Text fontSize="sm" color="fg.muted" lineHeight="1.55">
              Either player can open a market <strong>before either score is above 0</strong>.
              A <strong>monitor is mandatory</strong> for standalone betable matches.
            </Text>
            {!c.monitorUsername ? (
              <GhField
                label="Assign monitor"
                required
                helperText="Username or principal of the assigned monitor"
              >
                <GhInput
                  value={monitorName}
                  onChange={(e) => setMonitorName(e.target.value)}
                  placeholder="ref_volt"
                />
              </GhField>
            ) : (
              <GhAlert tone="success" title="Monitor assigned">
                {c.monitorUsername}
              </GhAlert>
            )}
            {!c.scheduledAt ||
            new Date(c.scheduledAt).getTime() < Date.now() + 3600000 ? (
              <HStack gap="phi2" flexWrap="wrap" align="flex-start">
                <Box flex="1" minW="8rem">
                  <GhField label="Market start date">
                    <GhInput
                      type="date"
                      value={betableDate}
                      onChange={(e) => setBetableDate(e.target.value)}
                    />
                  </GhField>
                </Box>
                <Box flex="1" minW="8rem">
                  <GhField label="Start time">
                    <GhInput
                      type="time"
                      value={betableTime}
                      onChange={(e) => setBetableTime(e.target.value)}
                    />
                  </GhField>
                </Box>
              </HStack>
            ) : (
              <Text fontSize="xs" color="fg.subtle">
                Using schedule {formatWhen(c.scheduledAt)} (≥ 1h)
              </Text>
            )}
            {player ? (
              <GhButton
                variant="prize"
                leftIcon={<ChartCandlestick size={16} />}
                onClick={onOpen}
              >
                Open betable market
              </GhButton>
            ) : (
              <Text fontSize="xs" color="fg.subtle">
                Only match players can open the market.
              </Text>
            )}
          </VStack>
        )}
      </Box>
    </Box>
  );
}

function RulesExplainer() {
  const items = [
    {
      title: "Escrow & grow the pot",
      body: "Player stakes lock into a challenge-specific ICP subaccount. Anyone can tip the same address; tips enlarge the winner pot and are non-refundable.",
    },
    {
      title: "Score reports",
      body: "Players, the assigned monitor, or the parent tournament host can submit live score updates and a final score. Scores may change throughout the match until a final is confirmed.",
    },
    {
      title: "Player-reported score",
      body: "If one player reports, the other player must confirm before the board updates (and before final payout).",
    },
    {
      title: "Monitor / tournament host report",
      body: "If a monitor or tournament host reports, either player must confirm within 5 minutes. Unconfirmed reports expire and can be resubmitted.",
    },
    {
      title: "Tournament bracket matches",
      body: "If the parent tournament has no betable market, the challenge cannot open its own market. Use host booth controls on the tournament page instead.",
    },
    {
      title: "Standalone betable",
      body: "For non-tournament challenges without a market yet, either player may open betable only while both scores are still 0. Opening requires an assigned monitor and a schedule ≥ 1 hour out.",
    },
    {
      title: "Mutual cancel (standalone only)",
      body: "Either player can request mutual cancel. The other player must accept to void the match and return stakes. Tournament bracket matches cannot mutual-cancel.",
    },
    {
      title: "Dispute after scored cancel",
      body: "If a cancel is requested when either score is above 0, the non-requesting player may open a dispute instead of accepting. Proof must be a video link (VOD/clip/stream) — not screenshots alone.",
    },
  ];

  return (
    <Box
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="border.default"
      bg="bg.glass"
      backdropFilter="blur(12px)"
      p={{ base: "phi4", md: "phi5" }}
    >
      <HStack gap="2" mb="phi3">
        <Info size={18} color="var(--gh-colors-brand-fg)" />
        <Text fontFamily="heading" fontWeight="extrabold" fontSize="md">
          How challenge escrow & scoring works
        </Text>
      </HStack>
      <VStack align="stretch" gap="phi3">
        {items.map((item, i) => (
          <HStack key={item.title} align="flex-start" gap="phi3">
            <Box
              w="7"
              h="7"
              borderRadius="lg"
              bg="brand.muted"
              color="brand.fg"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontFamily="heading"
              fontWeight="extrabold"
              fontSize="xs"
              borderWidth="1px"
              borderColor="border.brand"
              flexShrink={0}
            >
              {i + 1}
            </Box>
            <Box>
              <Text fontFamily="heading" fontWeight="bold" fontSize="sm" mb="0.5">
                {item.title}
              </Text>
              <Text fontSize="sm" color="fg.muted" lineHeight="1.55">
                {item.body}
              </Text>
            </Box>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}

function AcceptPanel({
  c,
  open,
  onOpenChange,
  streamUrl,
  setStreamUrl,
  notes,
  setNotes,
  accepting,
  onAccept,
}: {
  c: ChallengeDetail;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  streamUrl: string;
  setStreamUrl: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  accepting: boolean;
  onAccept: () => void;
}) {
  return (
    <GhSurface variant="brand" p="0" overflow="hidden" id="gh-accept-challenge">
      <Flex
        as="button"
        w="100%"
        align="center"
        justify="space-between"
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
          >
            <Check size={18} />
          </Box>
          <Box textAlign="left">
            <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
              {open ? "Accepting challenge" : "Accept challenge"}
            </Text>
            <Text fontSize="xs" color="fg.muted">
              Deposit {formatIcp(c.entryFeeIcp)} to escrow · stream URL required
            </Text>
          </Box>
        </HStack>
        <Text fontSize="xs" color="brand.fg" fontWeight="bold">
          {open ? "Hide" : "Show form"}
        </Text>
      </Flex>

      {open ? (
        <Box
          px="phi4"
          pb="phi4"
          borderTopWidth="1px"
          borderColor="border.default"
          bg="bg.elevated"
        >
          <VStack align="stretch" gap="phi3" pt="phi3">
            <GhAlert tone="brand" title="Stream required to accept">
              Spectators and the monitor need a public stream link.
            </GhAlert>
            <GhField label="Your stream URL" required>
              <GhInput
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="https://twitch.tv/your_name"
              />
            </GhField>
            <GhField label="Notes (optional)">
              <GhTextarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ready now · Discord…"
              />
            </GhField>
            <GhCheckbox
              label={`I deposit ${formatIcp(c.entryFeeIcp)} to the challenge escrow subaccount`}
              defaultChecked
            />
            <HStack gap="phi2" flexWrap="wrap">
              <GhButton
                variant="primary"
                leftIcon={<Swords size={16} />}
                onClick={onAccept}
                disabled={accepting}
              >
                {accepting ? "Accepting…" : `Accept · ${formatIcp(c.entryFeeIcp)}`}
              </GhButton>
              <GhButton
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={accepting}
              >
                Cancel
              </GhButton>
            </HStack>
          </VStack>
        </Box>
      ) : null}
    </GhSurface>
  );
}

function SideCard({
  side,
  label,
  tone,
  score,
  game,
}: {
  side: ChallengeSide;
  label: string;
  tone: "brand" | "prize";
  score?: number;
  game: string;
}) {
  const gs = side.gameStats;
  const record = gs?.record ?? side.record ?? "—";
  const tourney = gs?.tournamentRecord ?? "—";
  const winStreak = gs?.winStreak ?? 0;
  const lossStreak = gs?.lossStreak ?? 0;
  const winnings = gs?.winningsIcp;

  return (
    <GhSurface
      variant={tone === "brand" ? "brand" : "prize"}
      p="phi4"
      borderColor={tone === "brand" ? "border.brand" : "prize.solid"}
      h="100%"
    >
      <HStack justify="space-between" mb="phi2">
        <Text
          fontFamily="heading"
          fontSize="2xs"
          fontWeight="bold"
          letterSpacing="0.12em"
          textTransform="uppercase"
          color="fg.subtle"
        >
          {label}
        </Text>
        {score != null ? (
          <Text
            fontFamily="heading"
            fontWeight="extrabold"
            fontSize="xl"
            color={tone === "brand" ? "brand.fg" : "prize.fg"}
          >
            {score}
          </Text>
        ) : null}
      </HStack>
      <HStack gap="phi3" mb="phi3">
        <GhAvatar name={side.username} size="lg" tone={tone} />
        <Box minW="0">
          <Text fontFamily="heading" fontWeight="extrabold" fontSize="md" lineClamp={1}>
            {side.username}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            {game} · {side.paid ? "Paid" : "Unpaid"}
          </Text>
        </Box>
      </HStack>

      {/* Per-game form stats */}
      <SimpleGrid columns={2} gap="2" mb="phi3">
        <SideStat label={`${game} record`} value={record} />
        <SideStat label="Tourney record" value={tourney} />
        <SideStat
          label="Win streak"
          value={String(winStreak)}
          icon={
            winStreak > 0 ? (
              <Flame size={11} color="var(--gh-colors-prize-fg)" />
            ) : undefined
          }
          hot={winStreak > 0}
        />
        <SideStat
          label="Loss streak"
          value={String(lossStreak)}
          icon={
            lossStreak > 0 ? (
              <Snowflake size={11} color="var(--gh-colors-live-fg)" />
            ) : undefined
          }
        />
      </SimpleGrid>
      <Box
        p="phi2"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="prize.solid"
        bg="blackAlpha.400"
        mb="phi3"
      >
        <Text
          fontSize="2xs"
          color="fg.subtle"
          fontFamily="heading"
          fontWeight="bold"
          letterSpacing="0.08em"
          textTransform="uppercase"
        >
          {game} winnings
        </Text>
        <Text
          fontFamily="heading"
          fontWeight="extrabold"
          fontSize="md"
          className="gh-text-prize"
        >
          {winnings != null ? formatIcp(winnings) : "—"}
        </Text>
      </Box>

      <HStack gap="2" flexWrap="wrap">
        <Link href={`/profile?u=${encodeURIComponent(side.username)}`}>
          <GhButton size="sm" variant="outline">
            Profile
          </GhButton>
        </Link>
        {side.streamUrl ? (
          <a href={side.streamUrl} target="_blank" rel="noreferrer">
            <GhButton
              size="sm"
              variant="soft"
              leftIcon={<Radio size={14} />}
              rightIcon={<ExternalLink size={12} />}
            >
              Stream
            </GhButton>
          </a>
        ) : (
          <GhBadge tone="muted">No stream</GhBadge>
        )}
      </HStack>
    </GhSurface>
  );
}

function SideStat({
  label,
  value,
  icon,
  hot,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  hot?: boolean;
}) {
  return (
    <Box
      p="2"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border.default"
      bg="blackAlpha.400"
    >
      <HStack gap="1" mb="0.5">
        {icon}
        <Text
          fontSize="2xs"
          color="fg.subtle"
          fontFamily="heading"
          fontWeight="bold"
          letterSpacing="0.06em"
          textTransform="uppercase"
          lineClamp={1}
        >
          {label}
        </Text>
      </HStack>
      <Text
        fontFamily="heading"
        fontWeight="extrabold"
        fontSize="sm"
        color={hot ? "prize.fg" : undefined}
      >
        {value}
      </Text>
    </Box>
  );
}

function StreamRow({
  label,
  username,
  url,
  emptyHint,
}: {
  label: string;
  username: string;
  url?: string;
  emptyHint?: string;
}) {
  return (
    <HStack
      justify="space-between"
      p="phi2"
      borderRadius="lg"
      borderWidth="1px"
      borderColor={url ? "live.solid" : "border.default"}
      bg="blackAlpha.400"
      gap="2"
    >
      <Box minW="0">
        <Text fontSize="2xs" color="fg.subtle">
          {label}
        </Text>
        <Text fontFamily="heading" fontSize="sm" fontWeight="bold" lineClamp={1}>
          {username}
        </Text>
      </Box>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer">
          <GhButton
            size="sm"
            variant="live"
            leftIcon={<Radio size={14} />}
            rightIcon={<ExternalLink size={12} />}
          >
            Watch
          </GhButton>
        </a>
      ) : (
        <Text fontSize="2xs" color="fg.subtle">
          {emptyHint ?? "—"}
        </Text>
      )}
    </HStack>
  );
}

function InfoRow({
  label,
  value,
  emphasize,
  prize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  prize?: boolean;
}) {
  return (
    <HStack
      justify="space-between"
      p="phi2"
      borderRadius="lg"
      borderWidth="1px"
      borderColor={
        prize ? "prize.solid" : emphasize ? "border.brand" : "border.default"
      }
      bg={prize ? "prize.muted" : "blackAlpha.400"}
    >
      <Text fontSize="xs" color="fg.subtle">
        {label}
      </Text>
      <Text
        fontFamily="heading"
        fontSize={emphasize || prize ? "md" : "sm"}
        fontWeight="extrabold"
        className={prize ? "gh-text-prize" : undefined}
      >
        {value}
      </Text>
    </HStack>
  );
}
