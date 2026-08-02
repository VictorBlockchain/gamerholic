"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  Flex,
  Grid,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Ban,
  CheckCircle2,
  Gavel,
  RefreshCw,
  Shield,
  Users,
  Vote,
  Zap,
} from "lucide-react";
import { ModeHeader } from "@/components/spectacle/mode-header";
import {
  GhBadge,
  GhButton,
  GhEmptyState,
  GhField,
  GhInput,
  GhProcessModal,
  GhSpinner,
  GhSurface,
  GhTabs,
  processBeat,
  ghToast,
} from "@/components/ui";
import { useSession } from "@/components/providers/session-context";
import { useProcessModal } from "@/hooks/use-process-modal";
import { isCanisterConfigured } from "@/lib/ic/canisters";
import { challengeHref } from "@/lib/deep-links";
import {
  applyAsBaseReferee,
  appointModerator,
  checkIsAdmin,
  finalizeDispute,
  getMyModeratorRole,
  listActiveDisputes,
  listModerators,
  listPenalties,
  promoteModerator,
  roleLabel,
  shortAddr,
  voteOnDispute,
  type DisputeRecord,
  type ModeratorRecord,
  type ModeratorRoleName,
  type PenaltyRecord,
} from "@/lib/ic/moderator-service";

type TabId = "overview" | "disputes" | "moderators" | "penalties";

/**
 * Full moderator / admin console — migrated from legacy /moderator/console.
 * Roles, disputes, appoint/promote, penalties.
 */
export function ModeratorConsoleView() {
  const { isLoggedIn, login, principal, profile, identity } = useSession();
  const { processState, closeProcess, runProcess } = useProcessModal();
  const [tab, setTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);
  const [mods, setMods] = useState<ModeratorRecord[]>([]);
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [penalties, setPenalties] = useState<PenaltyRecord[]>([]);
  const [myRole, setMyRole] = useState<ModeratorRoleName | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [appointTarget, setAppointTarget] = useState("");
  const [appointRole, setAppointRole] =
    useState<ModeratorRoleName>("BaseReferee");
  const [voteWinner, setVoteWinner] = useState("");
  const [voteWeight, setVoteWeight] = useState("1");
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);

  const actorId = profile?.username || principal || "";

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      if (!isCanisterConfigured()) {
        setMods([]);
        setDisputes([]);
        setPenalties([]);
        return;
      }
      const [m, d, p] = await Promise.all([
        listModerators(identity),
        listActiveDisputes(identity),
        listPenalties(identity),
      ]);
      setMods(m);
      setDisputes(d);
      setPenalties(p);
      if (actorId) {
        const [role, admin] = await Promise.all([
          getMyModeratorRole(actorId, identity),
          checkIsAdmin(actorId, identity),
        ]);
        // Also try principal text if username used for appointments
        const roleP = principal
          ? await getMyModeratorRole(principal, identity)
          : null;
        const adminP = principal
          ? await checkIsAdmin(principal, identity)
          : false;
        setMyRole(roleP || role);
        setIsAdmin(admin || adminP);
      } else {
        setMyRole(null);
        setIsAdmin(false);
      }
    } finally {
      setLoading(false);
    }
  }, [identity, actorId, principal]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const caller = principal || actorId;

  const stats = useMemo(() => {
    const activeDisp = disputes.filter((d) => d.status === "Active").length;
    const activePen = penalties.filter((p) => p.active).length;
    return {
      mods: mods.length,
      activeDisp,
      activePen,
      admins: mods.filter((m) => m.role === "AdminMod").length,
    };
  }, [mods, disputes, penalties]);

  const canAppoint = isAdmin || myRole === "AdminMod";
  const canFinalize = myRole === "SuperMod" || myRole === "AdminMod" || isAdmin;
  const canVote = Boolean(myRole);

  const onApply = () => {
    if (!isLoggedIn || !caller) {
      void login();
      return;
    }
    void runProcess({
      title: "Applying as Base Referee",
      description: "Registering you on the moderation ladder.",
      contextLine: caller,
      tone: "attr",
      steps: [
        { key: "apply", label: "Apply on canister", detail: "applyBaseReferee" },
        { key: "reload", label: "Refreshing roster", detail: "listModerators" },
      ],
      successTitle: "Application recorded",
      successDetail: "You are a Base Referee",
      action: async (setStep) => {
        setStep(0);
        const ok = await applyAsBaseReferee(caller, identity);
        if (!ok) throw new Error("applyBaseReferee returned false");
        setStep(1);
        await processBeat();
        await reload();
        ghToast({ title: "You’re a Base Referee", type: "success" });
      },
    });
  };

  const onAppoint = () => {
    if (!canAppoint) {
      ghToast({
        title: "Admin only",
        description: "Appoint requires AdminMod role",
        type: "error",
      });
      return;
    }
    const target = appointTarget.trim();
    if (!target) {
      ghToast({ title: "Enter wallet / username", type: "error" });
      return;
    }
    void runProcess({
      title: "Appointing moderator",
      description: "Admin appointment on-chain.",
      contextLine: `${target} · ${appointRole}`,
      tone: "attr",
      steps: [
        {
          key: "appoint",
          label: "Appoint on canister",
          detail: `appointModerator · ${appointRole}`,
        },
        { key: "reload", label: "Refreshing roster", detail: "listModerators" },
      ],
      successTitle: "Moderator appointed",
      successDetail: `${shortAddr(target)} · ${roleLabel(appointRole)}`,
      action: async (setStep) => {
        setStep(0);
        const ok = await appointModerator(
          caller,
          target,
          appointRole,
          identity,
        );
        if (!ok) throw new Error("Appoint failed — AdminMod required");
        setAppointTarget("");
        setStep(1);
        await reload();
        ghToast({ title: "Moderator appointed", type: "success" });
      },
    });
  };

  const onPromote = (wallet: string) => {
    if (!canAppoint) {
      ghToast({ title: "Admin only", type: "error" });
      return;
    }
    void runProcess({
      title: "Promoting moderator",
      description: "Advance one rung on the ladder.",
      contextLine: shortAddr(wallet),
      tone: "attr",
      steps: [
        {
          key: "promote",
          label: "Promote on canister",
          detail: "promoteModerator",
        },
        { key: "reload", label: "Refreshing roster", detail: "listModerators" },
      ],
      successTitle: "Promoted",
      successDetail: shortAddr(wallet),
      action: async (setStep) => {
        setStep(0);
        const ok = await promoteModerator(caller, wallet, identity);
        if (!ok) throw new Error("Promotion failed — AdminMod required");
        setStep(1);
        await reload();
        ghToast({ title: "Moderator promoted", type: "success" });
      },
    });
  };

  const onVote = (disputeId: string) => {
    if (!canVote) {
      ghToast({
        title: "Moderators only",
        description: "Apply as Base Referee first",
        type: "error",
      });
      return;
    }
    const winner = voteWinner.trim();
    if (!winner) {
      ghToast({ title: "Enter winner address / username", type: "error" });
      return;
    }
    const w = parseInt(voteWeight, 10) || 1;
    void runProcess({
      title: "Submitting dispute vote",
      description: "Recording your vote on-chain.",
      contextLine: `Dispute ${shortAddr(disputeId, 10)} → ${shortAddr(winner)}`,
      tone: "live",
      steps: [
        {
          key: "vote",
          label: "Vote on canister",
          detail: `weight ${w}`,
        },
        { key: "reload", label: "Refreshing disputes", detail: "listActiveDisputes" },
      ],
      successTitle: "Vote recorded",
      successDetail: `For ${shortAddr(winner)}`,
      action: async (setStep) => {
        setStep(0);
        const ok = await voteOnDispute(
          disputeId,
          caller,
          winner,
          w,
          identity,
        );
        if (!ok) throw new Error("voteOnDispute returned false (already voted?)");
        setSelectedDispute(null);
        setVoteWinner("");
        setVoteWeight("1");
        setStep(1);
        await reload();
        ghToast({ title: "Vote submitted", type: "success" });
      },
    });
  };

  const onFinalize = (disputeId: string) => {
    if (!canFinalize) {
      ghToast({
        title: "Super / Admin only",
        description: "Finalize requires SuperMod or AdminMod",
        type: "error",
      });
      return;
    }
    void runProcess({
      title: "Finalizing dispute",
      description: "Apply votes, penalties, resolve challenge.",
      contextLine: shortAddr(disputeId, 12),
      tone: "prize",
      steps: [
        {
          key: "finalize",
          label: "Finalize on canister",
          detail: "finalizeDispute · penalty if needed",
        },
        { key: "reload", label: "Refreshing", detail: "Disputes & penalties" },
      ],
      successTitle: "Dispute resolved",
      successDetail: "Winner applied · loser may be penalized",
      action: async (setStep) => {
        setStep(0);
        const ok = await finalizeDispute(disputeId, caller, identity);
        if (!ok) throw new Error("finalizeDispute returned false");
        setStep(1);
        await reload();
        ghToast({ title: "Dispute finalized", type: "success" });
      },
    });
  };

  if (!isCanisterConfigured()) {
    return (
      <VStack align="stretch" gap="phi4" pb="phi4">
        <ModeHeader
          mode="default"
          icon={Shield}
          title="Admin · Moderator console"
          description="On-chain moderation requires gh_backend."
          badge="Admin"
        />
        <GhEmptyState
          icon={Shield}
          title="Canister not configured"
          description="Deploy gh_backend and set NEXT_PUBLIC_GH_BACKEND_CANISTER_ID."
        />
      </VStack>
    );
  }

  return (
    <VStack align="stretch" gap="0" pb="phi5">
      <GhProcessModal state={processState} onClose={closeProcess} />

      <ModeHeader
        mode="default"
        icon={Shield}
        title="Admin · Moderator console"
        description="Appoint mods, vote disputes, finalize penalties — fair play on-chain."
        badge="Admin console"
        action={
          <HStack gap="2" flexWrap="wrap">
            {myRole ? (
              <GhBadge tone="attr">{roleLabel(myRole)}</GhBadge>
            ) : null}
            {isAdmin ? <GhBadge tone="prize">Admin flag</GhBadge> : null}
            <GhButton
              size="sm"
              variant="outline"
              leftIcon={<RefreshCw size={14} />}
              onClick={() => void reload()}
            >
              Refresh
            </GhButton>
            {isLoggedIn && !myRole ? (
              <GhButton size="sm" variant="primary" onClick={onApply}>
                Apply as Base Referee
              </GhButton>
            ) : null}
            {!isLoggedIn ? (
              <GhButton size="sm" variant="primary" onClick={() => void login()}>
                Connect
              </GhButton>
            ) : null}
            <Link href="/moderator">
              <GhButton size="sm" variant="ghost">
                Availability
              </GhButton>
            </Link>
          </HStack>
        }
      />

      {/* Stats */}
      <Grid
        templateColumns={{ base: "1fr 1fr", md: "repeat(4, 1fr)" }}
        gap="phi3"
        mt="phi4"
        mb="phi4"
      >
        <StatTile
          icon={<Users size={16} />}
          value={String(stats.mods)}
          label="Moderators"
          tone="live"
        />
        <StatTile
          icon={<Zap size={16} />}
          value={String(stats.activeDisp)}
          label="Active disputes"
          tone="prize"
        />
        <StatTile
          icon={<CheckCircle2 size={16} />}
          value={String(stats.admins)}
          label="Admin mods"
          tone="brand"
        />
        <StatTile
          icon={<Ban size={16} />}
          value={String(stats.activePen)}
          label="Active penalties"
          tone="attr"
        />
      </Grid>

      {loading ? (
        <VStack py="phi6" gap="2">
          <GhSpinner />
          <Text fontSize="sm" color="fg.muted">
            Loading console from canister…
          </Text>
        </VStack>
      ) : (
        <GhTabs
          tone="attr"
          defaultValue={tab}
          onValueChange={(v) => setTab(v as TabId)}
          items={[
            {
              value: "overview",
              label: "Overview",
              icon: <Shield size={14} />,
              content: (
                <OverviewPanel
                  mods={mods}
                  disputes={disputes}
                  penalties={penalties}
                />
              ),
            },
            {
              value: "disputes",
              label: `Disputes (${disputes.length})`,
              icon: <Gavel size={14} />,
              content: (
                <DisputesPanel
                  disputes={disputes}
                  canVote={canVote}
                  canFinalize={canFinalize}
                  selectedDispute={selectedDispute}
                  setSelectedDispute={setSelectedDispute}
                  voteWinner={voteWinner}
                  setVoteWinner={setVoteWinner}
                  voteWeight={voteWeight}
                  setVoteWeight={setVoteWeight}
                  onVote={onVote}
                  onFinalize={onFinalize}
                />
              ),
            },
            {
              value: "moderators",
              label: `Moderators (${mods.length})`,
              icon: <Users size={14} />,
              content: (
                <ModeratorsPanel
                  mods={mods}
                  canAppoint={canAppoint}
                  appointTarget={appointTarget}
                  setAppointTarget={setAppointTarget}
                  appointRole={appointRole}
                  setAppointRole={setAppointRole}
                  onAppoint={onAppoint}
                  onPromote={onPromote}
                />
              ),
            },
            {
              value: "penalties",
              label: `Penalties (${penalties.filter((p) => p.active).length})`,
              icon: <Ban size={14} />,
              content: <PenaltiesPanel penalties={penalties} />,
            },
          ]}
        />
      )}
    </VStack>
  );
}

function StatTile({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  tone: "brand" | "prize" | "live" | "attr";
}) {
  const bg =
    tone === "prize"
      ? "prize.muted"
      : tone === "live"
        ? "live.muted"
        : tone === "attr"
          ? "attr.muted"
          : "brand.muted";
  const color =
    tone === "prize"
      ? "prize.fg"
      : tone === "live"
        ? "live.fg"
        : tone === "attr"
          ? "attr.fg"
          : "brand.fg";
  return (
    <GhSurface variant="elevated" p="phi3">
      <HStack gap="2" color={color} mb="1">
        {icon}
        <Text fontFamily="heading" fontWeight="extrabold" fontSize="xl">
          {value}
        </Text>
      </HStack>
      <Text fontSize="2xs" color="fg.subtle" fontFamily="heading" fontWeight="bold">
        {label}
      </Text>
      <Box h="1" mt="2" borderRadius="full" bg={bg} />
    </GhSurface>
  );
}

function OverviewPanel({
  mods,
  disputes,
  penalties,
}: {
  mods: ModeratorRecord[];
  disputes: DisputeRecord[];
  penalties: PenaltyRecord[];
}) {
  const top = [...mods]
    .sort(
      (a, b) =>
        b.gamesRefereed +
        2 * b.disputesResolved +
        b.upvotesReceived -
        (a.gamesRefereed + 2 * a.disputesResolved + a.upvotesReceived),
    )
    .slice(0, 6);

  return (
    <VStack align="stretch" gap="phi4" pt="phi3">
      <GhSurface variant="elevated" p="phi4">
        <Heading size="sm" fontFamily="heading" mb="2">
          System overview
        </Heading>
        <Text fontSize="sm" color="fg.muted" lineHeight="1.55">
          Monitor roster health, open disputes, and active penalties. Apply as
          Base Referee to join the ladder; AdminMod appoints and promotes.
        </Text>
      </GhSurface>
      <SimpleTwoCol
        left={
          <Box>
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              fontSize="sm"
              mb="phi2"
            >
              Top activity
            </Text>
            {top.length === 0 ? (
              <Text fontSize="sm" color="fg.subtle">
                No moderators yet.
              </Text>
            ) : (
              <VStack align="stretch" gap="2">
                {top.map((m) => (
                  <HStack
                    key={m.wallet}
                    justify="space-between"
                    p="2"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="border.default"
                  >
                    <Box minW="0">
                      <Text fontSize="sm" fontWeight="bold" lineClamp={1}>
                        {shortAddr(m.wallet)}
                      </Text>
                      <Text fontSize="2xs" color="fg.subtle">
                        {roleLabel(m.role)}
                      </Text>
                    </Box>
                    <Text fontSize="xs" color="brand.fg" fontWeight="bold">
                      {m.gamesRefereed + m.disputesResolved} acts
                    </Text>
                  </HStack>
                ))}
              </VStack>
            )}
          </Box>
        }
        right={
          <Box>
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              fontSize="sm"
              mb="phi2"
            >
              Snapshot
            </Text>
            <VStack align="stretch" gap="2" fontSize="sm" color="fg.muted">
              <Text>
                Open disputes:{" "}
                <Text as="span" color="prize.fg" fontWeight="bold">
                  {disputes.filter((d) => d.status === "Active").length}
                </Text>
              </Text>
              <Text>
                Active penalties:{" "}
                <Text as="span" color="danger.solid" fontWeight="bold">
                  {penalties.filter((p) => p.active).length}
                </Text>
              </Text>
              <Text>
                Roster size:{" "}
                <Text as="span" color="brand.fg" fontWeight="bold">
                  {mods.length}
                </Text>
              </Text>
            </VStack>
          </Box>
        }
      />
    </VStack>
  );
}

function SimpleTwoCol({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="phi3">
      <GhSurface variant="elevated" p="phi4">
        {left}
      </GhSurface>
      <GhSurface variant="elevated" p="phi4">
        {right}
      </GhSurface>
    </Grid>
  );
}

function DisputesPanel({
  disputes,
  canVote,
  canFinalize,
  selectedDispute,
  setSelectedDispute,
  voteWinner,
  setVoteWinner,
  voteWeight,
  setVoteWeight,
  onVote,
  onFinalize,
}: {
  disputes: DisputeRecord[];
  canVote: boolean;
  canFinalize: boolean;
  selectedDispute: string | null;
  setSelectedDispute: (id: string | null) => void;
  voteWinner: string;
  setVoteWinner: (v: string) => void;
  voteWeight: string;
  setVoteWeight: (v: string) => void;
  onVote: (id: string) => void;
  onFinalize: (id: string) => void;
}) {
  if (!disputes.length) {
    return (
      <Box pt="phi4">
        <GhEmptyState
          icon={Gavel}
          title="No active disputes"
          description="When players dispute a score or cancel, cases appear here for votes."
        />
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap="phi3" pt="phi3">
      {disputes.map((d) => (
        <GhSurface key={d.challengeId} variant="elevated" p="phi4">
          <Flex
            justify="space-between"
            gap="phi3"
            flexWrap="wrap"
            align="flex-start"
          >
            <Box minW="0">
              <HStack gap="2" mb="1" flexWrap="wrap">
                <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
                  Dispute · {shortAddr(d.challengeId, 10)}
                </Text>
                <GhBadge
                  tone={
                    d.status === "Active"
                      ? "prize"
                      : d.status === "Resolved"
                        ? "success"
                        : "muted"
                  }
                >
                  {d.status}
                </GhBadge>
              </HStack>
              <Text fontSize="xs" color="fg.muted">
                By {shortAddr(d.disputedBy)} ·{" "}
                {d.disputedAt
                  ? new Date(d.disputedAt).toLocaleString()
                  : "—"}{" "}
                · {d.votes.length} vote{d.votes.length === 1 ? "" : "s"}
              </Text>
              <Link
                href={challengeHref(d.challengeId)}
                style={{ fontSize: 12, fontWeight: 700 }}
              >
                Open challenge →
              </Link>
            </Box>
            {d.status === "Active" ? (
              <HStack gap="2">
                <GhButton
                  size="sm"
                  variant="soft"
                  leftIcon={<Vote size={14} />}
                  onClick={() =>
                    setSelectedDispute(
                      selectedDispute === d.challengeId
                        ? null
                        : d.challengeId,
                    )
                  }
                  disabled={!canVote}
                >
                  Vote
                </GhButton>
                <GhButton
                  size="sm"
                  variant="prize"
                  onClick={() => onFinalize(d.challengeId)}
                  disabled={!canFinalize}
                >
                  Finalize
                </GhButton>
              </HStack>
            ) : null}
          </Flex>

          {d.votes.length > 0 ? (
            <VStack align="stretch" gap="1" mt="phi3">
              <Text fontSize="2xs" fontFamily="heading" fontWeight="bold" color="fg.subtle">
                VOTES
              </Text>
              {d.votes.map((v, i) => (
                <HStack
                  key={`${v.moderator}-${i}`}
                  justify="space-between"
                  fontSize="xs"
                  p="2"
                  borderRadius="md"
                  bg="whiteAlpha.50"
                >
                  <Text>{shortAddr(v.moderator)} → {shortAddr(v.winner)}</Text>
                  <GhBadge tone="muted">w{v.weight}</GhBadge>
                </HStack>
              ))}
            </VStack>
          ) : null}

          {selectedDispute === d.challengeId ? (
            <VStack
              align="stretch"
              gap="phi2"
              mt="phi3"
              pt="phi3"
              borderTopWidth="1px"
              borderColor="border.default"
            >
              <GhField label="Winner (username / principal)">
                <GhInput
                  value={voteWinner}
                  onChange={(e) => setVoteWinner(e.target.value)}
                  placeholder="player_or_principal"
                />
              </GhField>
              <GhField label="Weight">
                <GhInput
                  value={voteWeight}
                  onChange={(e) => setVoteWeight(e.target.value)}
                  type="number"
                  min="1"
                />
              </GhField>
              <GhButton
                variant="primary"
                leftIcon={<Vote size={14} />}
                onClick={() => onVote(d.challengeId)}
              >
                Submit vote
              </GhButton>
            </VStack>
          ) : null}
        </GhSurface>
      ))}
    </VStack>
  );
}

function ModeratorsPanel({
  mods,
  canAppoint,
  appointTarget,
  setAppointTarget,
  appointRole,
  setAppointRole,
  onAppoint,
  onPromote,
}: {
  mods: ModeratorRecord[];
  canAppoint: boolean;
  appointTarget: string;
  setAppointTarget: (v: string) => void;
  appointRole: ModeratorRoleName;
  setAppointRole: (r: ModeratorRoleName) => void;
  onAppoint: () => void;
  onPromote: (wallet: string) => void;
}) {
  return (
    <VStack align="stretch" gap="phi4" pt="phi3">
      {canAppoint ? (
        <GhSurface variant="brand" p="phi4">
          <Text fontFamily="heading" fontWeight="extrabold" mb="phi2">
            Appoint moderator (Admin)
          </Text>
          <Grid
            templateColumns={{ base: "1fr", md: "1fr 10rem auto" }}
            gap="phi2"
            alignItems="end"
          >
            <GhField label="Wallet / username">
              <GhInput
                value={appointTarget}
                onChange={(e) => setAppointTarget(e.target.value)}
                placeholder="principal or username"
              />
            </GhField>
            <GhField label="Role">
              <select
                value={appointRole}
                onChange={(e) =>
                  setAppointRole(e.target.value as ModeratorRoleName)
                }
                style={{
                  width: "100%",
                  height: "2.75rem",
                  borderRadius: "1rem",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(0,0,0,0.4)",
                  color: "#fff",
                  padding: "0 0.75rem",
                }}
              >
                {(
                  [
                    "BaseReferee",
                    "VettedMod",
                    "SuperMod",
                    "AdminMod",
                  ] as ModeratorRoleName[]
                ).map((r) => (
                  <option key={r} value={r} style={{ background: "#16132a" }}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </GhField>
            <GhButton variant="primary" onClick={onAppoint}>
              Appoint
            </GhButton>
          </Grid>
        </GhSurface>
      ) : (
        <GhSurface variant="muted" p="phi3">
          <Text fontSize="sm" color="fg.muted">
            Appoint / promote requires <strong>AdminMod</strong>. Apply as Base
            Referee, or have an admin appoint you.
          </Text>
        </GhSurface>
      )}

      {mods.length === 0 ? (
        <GhEmptyState
          icon={Users}
          title="No moderators"
          description="Apply as Base Referee or appoint via AdminMod."
        />
      ) : (
        <VStack align="stretch" gap="2">
          {mods.map((m) => (
            <GhSurface key={m.wallet} variant="elevated" p="phi3">
              <Flex
                justify="space-between"
                gap="2"
                flexWrap="wrap"
                align="center"
              >
                <Box minW="0">
                  <Text fontWeight="bold" fontSize="sm" lineClamp={1}>
                    {shortAddr(m.wallet, 12)}
                  </Text>
                  <HStack gap="2" mt="1" flexWrap="wrap">
                    <GhBadge
                      tone={
                        m.role === "AdminMod"
                          ? "prize"
                          : m.role === "SuperMod"
                            ? "attr"
                            : "brand"
                      }
                    >
                      {roleLabel(m.role)}
                    </GhBadge>
                    <Text fontSize="2xs" color="fg.subtle">
                      {m.gamesRefereed} games · {m.disputesResolved} disputes ·{" "}
                      {m.upvotesReceived} upvotes
                    </Text>
                  </HStack>
                </Box>
                {canAppoint && m.role !== "AdminMod" ? (
                  <GhButton
                    size="sm"
                    variant="outline"
                    onClick={() => onPromote(m.wallet)}
                  >
                    Promote
                  </GhButton>
                ) : null}
              </Flex>
            </GhSurface>
          ))}
        </VStack>
      )}
    </VStack>
  );
}

function PenaltiesPanel({ penalties }: { penalties: PenaltyRecord[] }) {
  const active = penalties.filter((p) => p.active);
  const list = active.length ? active : penalties;

  if (!list.length) {
    return (
      <Box pt="phi4">
        <GhEmptyState
          icon={Ban}
          title="No penalties on record"
          description="Finalized disputes may apply 90-day surcharges to losers."
        />
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap="2" pt="phi3">
      {list.map((p) => (
        <GhSurface key={p.wallet} variant="elevated" p="phi3">
          <HStack justify="space-between" flexWrap="wrap" gap="2">
            <Box>
              <Text fontWeight="bold" fontSize="sm">
                {p.username || shortAddr(p.wallet)}
              </Text>
              <Text fontSize="2xs" color="fg.subtle">
                Until{" "}
                {p.surchargeUntil
                  ? new Date(p.surchargeUntil).toLocaleDateString()
                  : "—"}{" "}
                · ×{p.multiplier}
              </Text>
            </Box>
            <GhBadge tone={p.active ? "danger" : "muted"}>
              {p.active ? "Active" : "Expired"}
            </GhBadge>
          </HStack>
        </GhSurface>
      ))}
    </VStack>
  );
}
