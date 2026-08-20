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
  Coins,
  Gavel,
  Joystick,
  KeyRound,
  RefreshCw,
  Shield,
  ShoppingBag,
  Users,
  Vote,
  Zap,
} from "lucide-react";
import { ModeHeader } from "@/components/spectacle/mode-header";
import {
  GhAlert,
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
  listChainAdmins,
  listModerators,
  listPenalties,
  promoteModerator,
  roleLabel,
  setChainAdmin,
  shortAddr,
  voteOnDispute,
  type DisputeRecord,
  type ModeratorRecord,
  type ModeratorRoleName,
  type PenaltyRecord,
} from "@/lib/ic/moderator-service";
import {
  formatIcpShort,
  getFeePolicy,
  getTreasurySummary,
  listTreasuryTransactions,
  setArcadePlatformFeeBps,
  setArcadeSubmitFeeIcp,
  setHeadsUpPlatformFeeBps,
  setPlatformFeePrincipal,
  setPlatformFeeRate,
  setPlatformXftId,
  setTournamentPlatformFeeBps,
  summarizeFeeCollections,
  type FeePolicy,
  type TreasuryTx,
} from "@/lib/ic/fees-service";
import { PAYOUT_POLICY } from "@/lib/ic/settlement-service";
import { AdminShopPanel } from "@/components/shop/admin-shop-panel";
import {
  isPlatformAdmin,
  isPlatformModerator,
  platformRoleLabel,
  type PlatformRole,
} from "@/lib/profile";
import {
  findPrincipalByUsername,
  listProfilesForRoles,
  setPlatformRole,
  type PlatformProfileRoleRow,
} from "@/lib/supabase/profile";
import { isSupabaseConfigured } from "@/lib/supabase/client";

type TabId =
  | "overview"
  | "disputes"
  | "moderators"
  | "roles"
  | "penalties"
  | "fees"
  | "shop";

/**
 * Full moderator / admin console — migrated from legacy /moderator/console.
 * Roles, disputes, appoint/promote, penalties.
 */
export function ModeratorConsoleView() {
  const {
    isLoggedIn,
    authReady,
    login,
    principal,
    profile,
    identity,
    updateProfile,
  } = useSession();
  const { processState, closeProcess, runProcess } = useProcessModal();
  const [tab, setTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);
  const [mods, setMods] = useState<ModeratorRecord[]>([]);
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [penalties, setPenalties] = useState<PenaltyRecord[]>([]);
  const [myRole, setMyRole] = useState<ModeratorRoleName | null>(null);
  /** On-chain admin flag (setAdmin) or AdminMod role */
  const [isAdmin, setIsAdmin] = useState(false);
  /** Principals with setAdmin flag = true */
  const [chainAdmins, setChainAdmins] = useState<string[]>([]);
  const [adminTarget, setAdminTarget] = useState("");
  const [sbRoleRows, setSbRoleRows] = useState<PlatformProfileRoleRow[]>([]);

  const [appointTarget, setAppointTarget] = useState("");
  const [appointRole, setAppointRole] =
    useState<ModeratorRoleName>("BaseReferee");
  const [voteWinner, setVoteWinner] = useState("");
  const [voteWeight, setVoteWeight] = useState("1");
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);

  const [treasuryTxs, setTreasuryTxs] = useState<TreasuryTx[]>([]);
  const [treasurySummary, setTreasurySummary] = useState<
    { token: string; balanceIcp: number; balanceRaw: number }[]
  >([]);
  const [feePolicy, setFeePolicy] = useState<FeePolicy>({
    platformFeeRatePct: 5,
    headsUpPlatformFeeBps: 1000,
    tournamentPlatformFeeBps: 500,
    arcadePlatformFeeBps: 150,
    arcadeSubmitFeeIcp: 0.01,
    arcadeSubmitFeeE8s: 1_000_000,
    platformXftId: 0,
    platformBagPrincipal: "",
    platformFeePrincipal: "",
    feeRecipient: "",
  });
  const [arcadeBpsInput, setArcadeBpsInput] = useState("150");
  const [arcadeSubmitIcpInput, setArcadeSubmitIcpInput] = useState("0.01");
  const [headsUpBpsInput, setHeadsUpBpsInput] = useState("1000");
  const [tournamentBpsInput, setTournamentBpsInput] = useState("500");
  const [platformXftInput, setPlatformXftInput] = useState("0");
  const [platformPctInput, setPlatformPctInput] = useState("5");
  const [payoutAddressInput, setPayoutAddressInput] = useState("");

  const actorId = profile?.username || principal || "";

  /** Supabase `gh_profiles.role` */
  const sbAdmin = isPlatformAdmin(profile?.role);
  const sbMod = isPlatformModerator(profile?.role);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const roleListP = isSupabaseConfigured()
        ? listProfilesForRoles(150)
        : Promise.resolve([] as PlatformProfileRoleRow[]);

      if (!isCanisterConfigured()) {
        setMods([]);
        setDisputes([]);
        setPenalties([]);
        setTreasuryTxs([]);
        setMyRole(null);
        setIsAdmin(false);
        setChainAdmins([]);
        setSbRoleRows(await roleListP);
        return;
      }
      const [m, d, p, txs, sum, policy, roles, admins] = await Promise.all([
        listModerators(identity),
        listActiveDisputes(identity),
        listPenalties(identity),
        listTreasuryTransactions(identity, 150),
        getTreasurySummary(identity),
        getFeePolicy(identity),
        roleListP,
        listChainAdmins(identity),
      ]);
      setMods(m);
      setDisputes(d);
      setPenalties(p);
      setTreasuryTxs(txs);
      setTreasurySummary(sum);
      setFeePolicy(policy);
      // Prefill every admin input from on-chain stored values
      setArcadeBpsInput(String(policy.arcadePlatformFeeBps ?? 150));
      setArcadeSubmitIcpInput(
        Number.isFinite(policy.arcadeSubmitFeeIcp)
          ? String(policy.arcadeSubmitFeeIcp)
          : "0.01",
      );
      setHeadsUpBpsInput(String(policy.headsUpPlatformFeeBps ?? 1000));
      setTournamentBpsInput(String(policy.tournamentPlatformFeeBps ?? 500));
      setPlatformXftInput(
        policy.platformXftId > 0 ? String(policy.platformXftId) : "0",
      );
      setPlatformPctInput(String(policy.platformFeeRatePct ?? 5));
      setPayoutAddressInput(
        policy.platformFeePrincipal ||
          policy.feeRecipient ||
          "",
      );
      setSbRoleRows(roles);

      // Resolve roles / admin flag for this principal (never username-only for isAdmin)
      let adminFlag = false;
      let role: ModeratorRoleName | null = null;
      if (principal) {
        const [roleP, adminP] = await Promise.all([
          getMyModeratorRole(principal, identity),
          checkIsAdmin(principal, identity),
        ]);
        role = roleP;
        adminFlag = adminP;
      }
      if (!role && actorId && actorId !== principal) {
        role = await getMyModeratorRole(actorId, identity);
      }
      // If listAdmins failed/empty but isAdmin(principal) is true, still show self
      let adminList = admins;
      if (adminList.length === 0 && principal && adminFlag) {
        adminList = [principal];
      } else if (
        principal &&
        adminFlag &&
        !adminList.some((a) => a === principal)
      ) {
        adminList = [...adminList, principal];
      }
      setChainAdmins(adminList);
      setMyRole(role);
      setIsAdmin(adminFlag || adminList.some((a) => a === principal));
    } finally {
      setLoading(false);
    }
  }, [identity, actorId, principal]);

  useEffect(() => {
    // Wait for session bootstrap so we don't flash Connect / empty admins
    if (!authReady) return;
    void reload();
  }, [reload, authReady]);

  const caller = principal || actorId;

  const stats = useMemo(() => {
    const activeDisp = disputes.filter((d) => d.status === "Active").length;
    const activePen = penalties.filter((p) => p.active).length;
    const sbAdmins = sbRoleRows.filter((r) => r.role === "admin").length;
    return {
      mods: mods.length,
      activeDisp,
      activePen,
      admins: mods.filter((m) => m.role === "AdminMod").length + sbAdmins,
      chainAdmins: chainAdmins.length,
    };
  }, [mods, disputes, penalties, sbRoleRows, chainAdmins]);

  /** Full admin for shop / fees / appoint (chain OR Supabase) */
  const isAdminEffective = isAdmin || myRole === "AdminMod" || sbAdmin;
  /** Only setAdmin-flag holders can grant/revoke that flag on-chain */
  const canManageChainAdmins =
    Boolean(principal) &&
    (isAdmin ||
      chainAdmins.some((a) => a === principal));
  const canAppoint = isAdminEffective;

  const onGrantAdmin = () => {
    if (!canManageChainAdmins) {
      ghToast({
        title: "On-chain admin only",
        description: "You need the setAdmin flag to add another admin.",
        type: "error",
      });
      return;
    }
    const target = adminTarget.trim();
    if (!target) {
      ghToast({ title: "Enter principal", type: "error" });
      return;
    }
    void runProcess({
      title: "Granting on-chain admin",
      description: "setAdmin(target, true) — caller must be admin.",
      contextLine: shortAddr(target),
      tone: "live",
      steps: [
        { key: "set", label: "setAdmin", detail: "flag = true" },
        { key: "reload", label: "listAdmins", detail: "Refresh roster" },
      ],
      successTitle: "Admin granted",
      successDetail: shortAddr(target),
      action: async (setStep) => {
        setStep(0);
        const r = await setChainAdmin(target, true, identity);
        if (!r.ok) throw new Error(r.err || "setAdmin failed");
        setStep(1);
        setAdminTarget("");
        await reload();
      },
    });
  };

  const onRevokeAdmin = (target: string) => {
    if (!canManageChainAdmins) {
      ghToast({
        title: "On-chain admin only",
        type: "error",
      });
      return;
    }
    void runProcess({
      title: "Revoking on-chain admin",
      description: "Cannot remove the last admin.",
      contextLine: shortAddr(target),
      tone: "attr",
      steps: [
        { key: "set", label: "setAdmin", detail: "flag = false" },
        { key: "reload", label: "listAdmins", detail: "Refresh roster" },
      ],
      successTitle: "Admin revoked",
      successDetail: shortAddr(target),
      action: async (setStep) => {
        setStep(0);
        const r = await setChainAdmin(target, false, identity);
        if (!r.ok) throw new Error(r.err || "setAdmin failed");
        setStep(1);
        await reload();
      },
    });
  };
  const canFinalize =
    myRole === "SuperMod" ||
    myRole === "AdminMod" ||
    isAdmin ||
    sbAdmin ||
    sbMod;
  const canVote = Boolean(myRole) || sbMod;

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
        description="Roles from Supabase and/or on-chain. Assign platform admin/moderator, vote disputes, manage shop."
        badge="Admin console"
        action={
          <HStack gap="2" flexWrap="wrap">
            {profile?.role && profile.role !== "user" ? (
              <GhBadge tone="prize">
                SB · {platformRoleLabel(profile.role)}
              </GhBadge>
            ) : null}
            {myRole ? (
              <GhBadge tone="attr">Chain · {roleLabel(myRole)}</GhBadge>
            ) : null}
            {isAdmin ? <GhBadge tone="live">Chain admin flag</GhBadge> : null}
            <GhButton
              size="sm"
              variant="outline"
              leftIcon={<RefreshCw size={14} />}
              onClick={() => void reload()}
            >
              Refresh
            </GhButton>
            {isLoggedIn && !myRole && !isAdmin ? (
              <GhButton size="sm" variant="primary" onClick={onApply}>
                Apply as Base Referee
              </GhButton>
            ) : null}
            {!authReady ? (
              <GhBadge tone="muted">Restoring session…</GhBadge>
            ) : !isLoggedIn ? (
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
          value={String(stats.chainAdmins)}
          label="Chain admins"
          tone="brand"
        />
        <StatTile
          icon={<Ban size={16} />}
          value={String(stats.activePen)}
          label="Active penalties"
          tone="attr"
        />
      </Grid>

      {!authReady || loading ? (
        <VStack py="phi6" gap="2">
          <GhSpinner />
          <Text fontSize="sm" color="fg.muted">
            {!authReady
              ? "Restoring session…"
              : "Loading console from canister…"}
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
              value: "admins",
              label: `Admins (${chainAdmins.length})`,
              icon: <Shield size={14} />,
              content: (
                <ChainAdminsPanel
                  admins={chainAdmins}
                  canManage={canManageChainAdmins}
                  myPrincipal={principal || ""}
                  target={adminTarget}
                  setTarget={setAdminTarget}
                  onGrant={onGrantAdmin}
                  onRevoke={onRevokeAdmin}
                />
              ),
            },
            {
              value: "roles",
              label: `Roles (${sbRoleRows.filter((r) => r.role !== "user").length})`,
              icon: <KeyRound size={14} />,
              content: (
                <PlatformRolesPanel
                  rows={sbRoleRows}
                  canManage={isAdminEffective}
                  callerPrincipal={principal || ""}
                  myPrincipal={principal || ""}
                  mySbRole={profile?.role || "user"}
                  isLoggedIn={isLoggedIn}
                  onLogin={() => void login()}
                  onChanged={async (selfRole) => {
                    if (selfRole) {
                      await updateProfile({ role: selfRole });
                    }
                    await reload();
                  }}
                />
              ),
            },
            {
              value: "penalties",
              label: `Penalties (${penalties.filter((p) => p.active).length})`,
              icon: <Ban size={14} />,
              content: <PenaltiesPanel penalties={penalties} />,
            },
            {
              value: "shop",
              label: "Shop",
              icon: <ShoppingBag size={14} />,
              content: (
                <AdminShopPanel isAdmin={Boolean(isAdminEffective)} />
              ),
            },
            {
              value: "fees",
              label: `Fees (${treasuryTxs.length})`,
              icon: <Coins size={14} />,
              content: (
                <FeesPanel
                  txs={treasuryTxs}
                  summary={treasurySummary}
                  policy={feePolicy}
                  isAdmin={Boolean(isAdmin)}
                  caller={caller}
                  identity={identity}
                  arcadeBpsInput={arcadeBpsInput}
                  setArcadeBpsInput={setArcadeBpsInput}
                  arcadeSubmitIcpInput={arcadeSubmitIcpInput}
                  setArcadeSubmitIcpInput={setArcadeSubmitIcpInput}
                  headsUpBpsInput={headsUpBpsInput}
                  setHeadsUpBpsInput={setHeadsUpBpsInput}
                  tournamentBpsInput={tournamentBpsInput}
                  setTournamentBpsInput={setTournamentBpsInput}
                  platformXftInput={platformXftInput}
                  setPlatformXftInput={setPlatformXftInput}
                  platformPctInput={platformPctInput}
                  setPlatformPctInput={setPlatformPctInput}
                  payoutAddressInput={payoutAddressInput}
                  setPayoutAddressInput={setPayoutAddressInput}
                  onSaved={() => void reload()}
                  runProcess={runProcess}
                />
              ),
            },
          ]}
        />
      )}
    </VStack>
  );
}

/**
 * Supabase platform roles — assign admin / moderator without on-chain AdminMod.
 */
function PlatformRolesPanel({
  rows,
  canManage,
  callerPrincipal,
  myPrincipal,
  mySbRole,
  isLoggedIn,
  onLogin,
  onChanged,
}: {
  rows: PlatformProfileRoleRow[];
  canManage: boolean;
  callerPrincipal: string;
  myPrincipal: string;
  mySbRole: PlatformRole | string;
  isLoggedIn: boolean;
  onLogin: () => void;
  onChanged: (selfRole?: PlatformRole) => Promise<void>;
}) {
  const [target, setTarget] = useState("");
  const [role, setRole] = useState<PlatformRole>("moderator");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");

  const adminCount = rows.filter((r) => r.role === "admin").length;
  const canBootstrap =
    isLoggedIn &&
    Boolean(myPrincipal) &&
    adminCount === 0 &&
    mySbRole !== "admin";

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.username.toLowerCase().includes(q) ||
        r.principal.toLowerCase().includes(q) ||
        r.role.includes(q),
    );
  }, [rows, filter]);

  const assign = async (
    targetPrincipal: string,
    nextRole: PlatformRole,
  ) => {
    if (!callerPrincipal) {
      onLogin();
      return;
    }
    setBusy(true);
    try {
      const res = await setPlatformRole({
        callerPrincipal,
        targetPrincipal,
        role: nextRole,
      });
      if (!res.ok) {
        ghToast({
          title: "Role update failed",
          description: res.error || "Unknown error",
          type: "error",
        });
        return;
      }
      ghToast({
        title: "Role updated",
        description: `${shortAddr(targetPrincipal, 10)} → ${platformRoleLabel(nextRole)}`,
        type: "success",
      });
      const self =
        targetPrincipal === myPrincipal ? nextRole : undefined;
      await onChanged(self);
    } finally {
      setBusy(false);
    }
  };

  const onAssignForm = async () => {
    const raw = target.trim();
    if (!raw) {
      ghToast({
        title: "Target required",
        description: "Username or principal",
        type: "warning",
      });
      return;
    }
    setBusy(true);
    try {
      let principal = raw;
      // Heuristic: II principals are long with hyphens; usernames are short
      if (!raw.includes("-") || raw.length < 20) {
        const found = await findPrincipalByUsername(raw);
        if (!found) {
          ghToast({
            title: "User not found",
            description: `No profile for “${raw}” — they must log in once first.`,
            type: "error",
          });
          return;
        }
        principal = found;
      }
      await assign(principal, role);
      setTarget("");
    } finally {
      setBusy(false);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <Box pt="phi4">
        <GhEmptyState
          icon={KeyRound}
          title="Supabase not configured"
          description="Set NEXT_PUBLIC_SUPABASE_URL and ANON_KEY, then apply gh_profile_roles migration."
        />
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap="phi3" pt="phi4">
      <GhSurface variant="elevated" p="phi3">
        <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm" mb="1">
          Platform roles (Supabase)
        </Text>
        <Text fontSize="xs" color="fg.muted" lineHeight="1.55" mb="phi2">
          <strong>admin</strong> unlocks shop, fees, and role assignment.{" "}
          <strong>moderator</strong> unlocks dispute tools in this console.
          Independent of on-chain AdminMod — apply migration{" "}
          <code>20260802_gh_profile_roles.sql</code> once.
        </Text>
        <HStack gap="2" flexWrap="wrap" mb="phi2">
          <GhBadge tone="prize">
            {adminCount} admin{adminCount === 1 ? "" : "s"}
          </GhBadge>
          <GhBadge tone="attr">
            {rows.filter((r) => r.role === "moderator").length} moderator
            {rows.filter((r) => r.role === "moderator").length === 1 ? "" : "s"}
          </GhBadge>
          <GhBadge tone="muted">{rows.length} profiles</GhBadge>
        </HStack>

        {canBootstrap ? (
          <GhAlert tone="live" title="No platform admin yet" mb="phi2">
            Claim bootstrap admin for your connected principal (one-time when
            zero admins exist).
          </GhAlert>
        ) : null}

        {canBootstrap ? (
          <GhButton
            variant="primary"
            size="sm"
            leftIcon={<Shield size={14} />}
            disabled={busy}
            onClick={() => void assign(myPrincipal, "admin")}
            mb="phi2"
          >
            {busy ? "Working…" : "Claim bootstrap admin"}
          </GhButton>
        ) : null}

        {canManage || canBootstrap ? (
          <Grid
            templateColumns={{ base: "1fr", md: "1fr 9rem auto" }}
            gap="phi2"
            alignItems="end"
          >
            <GhField label="Username or principal">
              <GhInput
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="username or II principal"
              />
            </GhField>
            <GhField label="Role">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as PlatformRole)}
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
                {(["admin", "moderator", "user"] as PlatformRole[]).map(
                  (r) => (
                    <option key={r} value={r} style={{ background: "#16132a" }}>
                      {platformRoleLabel(r)}
                    </option>
                  ),
                )}
              </select>
            </GhField>
            <GhButton
              variant="primary"
              disabled={busy || (!canManage && !canBootstrap)}
              onClick={() => void onAssignForm()}
            >
              Assign
            </GhButton>
          </Grid>
        ) : (
          <Text fontSize="sm" color="fg.muted">
            {isLoggedIn
              ? "Only platform admins can assign roles. Ask an admin or run SQL: update gh_profiles set role = 'admin' where principal = '…'."
              : "Connect to manage or claim bootstrap admin."}
          </Text>
        )}
      </GhSurface>

      <GhField label="Filter">
        <GhInput
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search username, principal, role…"
        />
      </GhField>

      {filtered.length === 0 ? (
        <GhEmptyState
          icon={Users}
          title="No profiles"
          description="Users appear after first Internet Identity login."
        />
      ) : (
        <VStack align="stretch" gap="2">
          {filtered.map((r) => (
            <GhSurface key={r.principal} variant="elevated" p="phi3">
              <Flex
                justify="space-between"
                gap="2"
                flexWrap="wrap"
                align="center"
              >
                <Box minW="0">
                  <Text fontWeight="bold" fontSize="sm" lineClamp={1}>
                    {r.username || shortAddr(r.principal, 12)}
                  </Text>
                  <Text fontSize="2xs" fontFamily="mono" color="fg.subtle">
                    {shortAddr(r.principal, 14)}
                  </Text>
                  <HStack gap="2" mt="1" flexWrap="wrap">
                    <GhBadge
                      tone={
                        r.role === "admin"
                          ? "prize"
                          : r.role === "moderator"
                            ? "attr"
                            : "muted"
                      }
                    >
                      {platformRoleLabel(r.role)}
                    </GhBadge>
                    {r.principal === myPrincipal ? (
                      <GhBadge tone="live">You</GhBadge>
                    ) : null}
                  </HStack>
                </Box>
                {canManage ? (
                  <HStack gap="1" flexWrap="wrap">
                    {(["admin", "moderator", "user"] as PlatformRole[])
                      .filter((x) => x !== r.role)
                      .map((x) => (
                        <GhButton
                          key={x}
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void assign(r.principal, x)}
                        >
                          → {platformRoleLabel(x)}
                        </GhButton>
                      ))}
                  </HStack>
                ) : null}
              </Flex>
            </GhSurface>
          ))}
        </VStack>
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

/**
 * On-chain setAdmin flag roster. Only existing flag holders can grant/revoke.
 */
function ChainAdminsPanel({
  admins,
  canManage,
  myPrincipal,
  target,
  setTarget,
  onGrant,
  onRevoke,
}: {
  admins: string[];
  canManage: boolean;
  myPrincipal: string;
  target: string;
  setTarget: (v: string) => void;
  onGrant: () => void;
  onRevoke: (principal: string) => void;
}) {
  return (
    <VStack align="stretch" gap="phi4" pt="phi3">
      <GhAlert tone="live" title="On-chain admin flag">
        Controls fee policy, shop, and who may call setAdmin. Separate from
        Supabase platform roles and moderator ladder (AdminMod). Only an
        existing chain admin can add or remove others. The last admin cannot be
        removed.
      </GhAlert>

      {canManage ? (
        <GhSurface variant="brand" p="phi4">
          <Text fontFamily="heading" fontWeight="extrabold" mb="phi2">
            Grant admin
          </Text>
          <Grid
            templateColumns={{ base: "1fr", md: "1fr auto" }}
            gap="phi2"
            alignItems="end"
          >
            <GhField label="Principal">
              <GhInput
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="aaaaa-… principal text"
              />
            </GhField>
            <GhButton variant="primary" onClick={onGrant}>
              Grant admin
            </GhButton>
          </Grid>
        </GhSurface>
      ) : (
        <Text fontSize="sm" color="fg.muted">
          Connect with an on-chain admin principal to manage this list.
        </Text>
      )}

      {admins.length === 0 ? (
        <GhEmptyState
          icon={Shield}
          title="No chain admins listed"
          description="If the canister was just upgraded, re-grant via bootstrap or controller once."
        />
      ) : (
        <VStack align="stretch" gap="2">
          {admins.map((a) => {
            const isMe = myPrincipal && a === myPrincipal;
            return (
              <GhSurface key={a} variant="elevated" p="phi3">
                <Flex
                  justify="space-between"
                  align="center"
                  gap="phi2"
                  flexWrap="wrap"
                >
                  <Box minW="0">
                    <Text
                      fontFamily="mono"
                      fontSize="sm"
                      fontWeight="semibold"
                      wordBreak="break-all"
                    >
                      {a}
                    </Text>
                    <HStack gap="2" mt="1">
                      <GhBadge tone="live">setAdmin</GhBadge>
                      {isMe ? <GhBadge tone="brand">You</GhBadge> : null}
                    </HStack>
                  </Box>
                  {canManage ? (
                    <GhButton
                      size="sm"
                      variant="outline"
                      onClick={() => onRevoke(a)}
                      disabled={admins.length <= 1}
                    >
                      Revoke
                    </GhButton>
                  ) : null}
                </Flex>
              </GhSurface>
            );
          })}
        </VStack>
      )}
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

function FeesPanel({
  txs,
  summary,
  policy,
  isAdmin,
  caller,
  identity,
  arcadeBpsInput,
  setArcadeBpsInput,
  arcadeSubmitIcpInput,
  setArcadeSubmitIcpInput,
  headsUpBpsInput,
  setHeadsUpBpsInput,
  tournamentBpsInput,
  setTournamentBpsInput,
  platformXftInput,
  setPlatformXftInput,
  platformPctInput,
  setPlatformPctInput,
  payoutAddressInput,
  setPayoutAddressInput,
  onSaved,
  runProcess,
}: {
  txs: TreasuryTx[];
  summary: { token: string; balanceIcp: number; balanceRaw: number }[];
  policy: FeePolicy;
  /** On-chain admin flag only (not moderator) */
  isAdmin: boolean;
  caller: string;
  identity: ReturnType<typeof useSession>["identity"];
  arcadeBpsInput: string;
  setArcadeBpsInput: (v: string) => void;
  arcadeSubmitIcpInput: string;
  setArcadeSubmitIcpInput: (v: string) => void;
  headsUpBpsInput: string;
  setHeadsUpBpsInput: (v: string) => void;
  tournamentBpsInput: string;
  setTournamentBpsInput: (v: string) => void;
  platformXftInput: string;
  setPlatformXftInput: (v: string) => void;
  platformPctInput: string;
  setPlatformPctInput: (v: string) => void;
  payoutAddressInput: string;
  setPayoutAddressInput: (v: string) => void;
  onSaved: () => void;
  runProcess: ReturnType<typeof useProcessModal>["runProcess"];
}) {
  const agg = summarizeFeeCollections(txs);
  const icpSum = summary.find((s) => s.token === "ICP" || s.token === "WICP");

  const feeListRows: {
    label: string;
    value: string;
    hint: string;
  }[] = [
    {
      label: "Heads-up platform",
      value: `${policy.headsUpPlatformFeeBps} bps (${(policy.headsUpPlatformFeeBps / 100).toFixed(2)}%)`,
      hint: "1v1 pot rake",
    },
    {
      label: "Tournament / room platform",
      value: `${policy.tournamentPlatformFeeBps} bps (${(policy.tournamentPlatformFeeBps / 100).toFixed(2)}%)`,
      hint: `legacy ${policy.platformFeeRatePct}%`,
    },
    {
      label: "Arcade play cut",
      value: `${policy.arcadePlatformFeeBps} bps (${(policy.arcadePlatformFeeBps / 100).toFixed(2)}%)`,
      hint: "of each paid play fee",
    },
    {
      label: "Arcade submit fee",
      value:
        policy.arcadeSubmitFeeIcp <= 0
          ? "free"
          : `${formatIcpShort(policy.arcadeSubmitFeeIcp)} ICP`,
      hint: `${policy.arcadeSubmitFeeE8s} e8s`,
    },
    {
      label: "Host (when present)",
      value: `${PAYOUT_POLICY.hostBps / 100}%`,
      hint: "fixed role cut on pot settle",
    },
    {
      label: "Moderator (when assigned)",
      value: `${PAYOUT_POLICY.modBps / 100}%`,
      hint: "fixed role cut",
    },
    {
      label: "Community vault",
      value: `${PAYOUT_POLICY.vaultBps / 100}%`,
      hint: "fixed on pot settle",
    },
    {
      label: "Platform XFT (bag 50%)",
      value:
        policy.platformXftId > 0
          ? `XFT #${policy.platformXftId}`
          : "off",
      hint: policy.platformBagPrincipal
        ? `bag ${shortAddr(policy.platformBagPrincipal)}`
        : policy.platformXftId > 0
          ? "bag unresolved"
          : "100% → payout address",
    },
    {
      label: "Payout address",
      value: policy.platformFeePrincipal
        ? shortAddr(policy.platformFeePrincipal, 12)
        : policy.feeRecipient
          ? shortAddr(policy.feeRecipient, 12)
          : "—",
      hint: "platform wallet (non-bag share)",
    },
  ];

  const requireAdmin = () => {
    if (!isAdmin || !caller) {
      ghToast({
        title: "Admin only",
        description: "On-chain admin flag required (not moderator).",
        type: "error",
      });
      return false;
    }
    return true;
  };

  const parseBps = (raw: string, label: string): number | null => {
    const bps = parseInt(raw, 10);
    if (!Number.isFinite(bps) || bps < 0 || bps > 2000) {
      ghToast({
        title: `Invalid ${label}`,
        description: "0–2000 bps (0–20%). 100 bps = 1%.",
        type: "error",
      });
      return null;
    }
    return bps;
  };

  const saveArcade = () => {
    if (!requireAdmin()) return;
    const bps = parseBps(arcadeBpsInput, "arcade bps");
    if (bps == null) return;
    void runProcess({
      title: "Updating arcade platform fee",
      description: "Admin policy on gh_backend · of each paid play fee.",
      contextLine: `${bps} bps (${(bps / 100).toFixed(2)}%)`,
      tone: "prize",
      steps: [
        { key: "set", label: "setArcadePlatformFeeBps", detail: "Admin only" },
        { key: "reload", label: "Refresh fees", detail: "getFeePolicy" },
      ],
      successTitle: "Arcade fee updated",
      successDetail: `${bps} bps of each paid play fee`,
      action: async (setStep) => {
        setStep(0);
        const ok = await setArcadePlatformFeeBps(caller, bps, identity);
        if (!ok) throw new Error("setArcadePlatformFeeBps failed — admin flag?");
        setStep(1);
        onSaved();
      },
    });
  };

  const saveArcadeSubmit = () => {
    if (!requireAdmin()) return;
    const icp = parseFloat(arcadeSubmitIcpInput);
    if (!Number.isFinite(icp) || icp < 0 || icp > 10) {
      ghToast({
        title: "Invalid fee",
        description: "Arcade submit fee: 0–10 ICP (0 = free submissions)",
        type: "error",
      });
      return;
    }
    void runProcess({
      title: "Updating arcade submit fee",
      description: "Flat fee when creators ship a cabinet for testing.",
      contextLine: `${icp} ICP → play sub debit`,
      tone: "prize",
      steps: [
        { key: "set", label: "setArcadeSubmitFeeE8s", detail: "Admin only" },
        { key: "reload", label: "Refresh fees", detail: "getFeePolicy" },
      ],
      successTitle: "Submit fee updated",
      successDetail:
        icp <= 0
          ? "Free submissions"
          : `${icp} ICP per new cabinet (testing)`,
      action: async (setStep) => {
        setStep(0);
        const ok = await setArcadeSubmitFeeIcp(caller, icp, identity);
        if (!ok) throw new Error("setArcadeSubmitFeeE8s failed — admin flag?");
        setStep(1);
        onSaved();
      },
    });
  };

  const saveHeadsUp = () => {
    if (!requireAdmin()) return;
    const bps = parseBps(headsUpBpsInput, "heads-up bps");
    if (bps == null) return;
    void runProcess({
      title: "Updating heads-up platform fee",
      description: "1v1 challenge pot rake · admin only.",
      contextLine: `${bps} bps (${(bps / 100).toFixed(2)}%)`,
      tone: "prize",
      steps: [
        { key: "set", label: "setHeadsUpPlatformFeeBps", detail: "Admin only" },
        { key: "reload", label: "Refresh fees", detail: "getFeePolicy" },
      ],
      successTitle: "Heads-up fee updated",
      successDetail: `${(bps / 100).toFixed(2)}% of pot`,
      action: async (setStep) => {
        setStep(0);
        const ok = await setHeadsUpPlatformFeeBps(caller, bps, identity);
        if (!ok) throw new Error("setHeadsUpPlatformFeeBps failed — admin flag?");
        setStep(1);
        onSaved();
      },
    });
  };

  const saveTournament = () => {
    if (!requireAdmin()) return;
    const bps = parseBps(tournamentBpsInput, "tournament bps");
    if (bps == null) return;
    void runProcess({
      title: "Updating tournament platform fee",
      description: "Tournament + room pot rake · also syncs legacy %.",
      contextLine: `${bps} bps (${(bps / 100).toFixed(2)}%)`,
      tone: "prize",
      steps: [
        {
          key: "set",
          label: "setTournamentPlatformFeeBps",
          detail: "Admin only",
        },
        { key: "reload", label: "Refresh fees", detail: "getFeePolicy" },
      ],
      successTitle: "Tournament fee updated",
      successDetail: `${(bps / 100).toFixed(2)}% of pot`,
      action: async (setStep) => {
        setStep(0);
        const ok = await setTournamentPlatformFeeBps(caller, bps, identity);
        if (!ok)
          throw new Error("setTournamentPlatformFeeBps failed — admin flag?");
        setStep(1);
        onSaved();
      },
    });
  };

  const savePlatformXft = () => {
    if (!requireAdmin()) return;
    const id = parseInt(platformXftInput, 10);
    if (!Number.isFinite(id) || id < 0) {
      ghToast({
        title: "Invalid XFT id",
        description: "Enter 0 to clear, or a positive Dexsta XFT id.",
        type: "error",
      });
      return;
    }
    void runProcess({
      title: "Setting platform XFT",
      description:
        id === 0
          ? "Clear bag split — 100% platform wallet."
          : "Resolve bag via Dexsta bag_factory · 50% platform fees → bag.",
      contextLine: id === 0 ? "xft_id = 0 (cleared)" : `xft_id = ${id}`,
      tone: "prize",
      steps: [
        { key: "set", label: "setPlatformXftId", detail: "Admin only" },
        { key: "reload", label: "Refresh fees", detail: "getFeePolicy" },
      ],
      successTitle: id === 0 ? "Platform XFT cleared" : "Platform XFT set",
      successDetail:
        id === 0 ? "All platform fees → wallet" : `XFT #${id} · bag 50%`,
      action: async (setStep) => {
        setStep(0);
        const r = await setPlatformXftId(caller, id, identity);
        if (!r.ok) throw new Error(r.err || "setPlatformXftId failed");
        setStep(1);
        onSaved();
      },
    });
  };

  const savePlatformPct = () => {
    if (!requireAdmin()) return;
    const pct = parseInt(platformPctInput, 10);
    if (!Number.isFinite(pct) || pct < 0 || pct > 20) {
      ghToast({ title: "Invalid %", description: "0–20", type: "error" });
      return;
    }
    void runProcess({
      title: "Updating platform fee rate",
      description: "Legacy % — also sets tournament platform bps.",
      contextLine: `${pct}%`,
      tone: "prize",
      steps: [
        { key: "set", label: "setPlatformFeeRate", detail: "Admin only" },
        { key: "reload", label: "Refresh", detail: "policy" },
      ],
      successTitle: "Platform rate updated",
      successDetail: `${pct}%`,
      action: async (setStep) => {
        setStep(0);
        const ok = await setPlatformFeeRate(caller, pct, identity);
        if (!ok) throw new Error("setPlatformFeeRate failed");
        setStep(1);
        onSaved();
      },
    });
  };

  const savePayoutAddress = () => {
    if (!requireAdmin()) return;
    const addr = payoutAddressInput.trim();
    if (!addr) {
      ghToast({
        title: "Enter payout principal",
        description: "ICP principal that receives platform fees (non-bag share).",
        type: "error",
      });
      return;
    }
    void runProcess({
      title: "Updating payout address",
      description: "Platform fee principal on gh_backend.",
      contextLine: shortAddr(addr),
      tone: "attr",
      steps: [
        {
          key: "set",
          label: "setPlatformFeePrincipal",
          detail: "Admin only",
        },
        { key: "reload", label: "Refresh", detail: "policy" },
      ],
      successTitle: "Payout address updated",
      successDetail: shortAddr(addr),
      action: async (setStep) => {
        setStep(0);
        const r = await setPlatformFeePrincipal(caller, addr, identity);
        if (!r.ok) throw new Error(r.err || "setPlatformFeePrincipal failed");
        setStep(1);
        onSaved();
      },
    });
  };

  return (
    <VStack align="stretch" gap="phi4" pt="phi3">
      <GhAlert tone="prize" title="Fee ledger">
        Collections from challenges, tournaments, room tables, arcade play
        fees, and arcade submit-for-testing fees. When platform XFT is set, 50%
        of platform fees go to that XFT&apos;s Dexsta bag; the rest goes to the
        payout address. On-chain admin only to edit rates and destinations.
      </GhAlert>

      {/* Stats */}
      <Grid
        templateColumns={{ base: "1fr 1fr", md: "repeat(4, 1fr)" }}
        gap="phi3"
      >
        <StatTile
          icon={<Coins size={16} />}
          value={formatIcpShort(agg.platformIcp)}
          label="Platform fees (ICP)"
          tone="prize"
        />
        <StatTile
          icon={<Shield size={16} />}
          value={formatIcpShort(agg.vaultIcp)}
          label="Vault allocations"
          tone="brand"
        />
        <StatTile
          icon={<Gavel size={16} />}
          value={formatIcpShort(agg.rakeIcp)}
          label="Rake collected"
          tone="live"
        />
        <StatTile
          icon={<Zap size={16} />}
          value={formatIcpShort(agg.prizesIcp)}
          label="Prizes distributed"
          tone="attr"
        />
      </Grid>

      {/* Full fees list (read-only live snapshot under stats) */}
      <GhSurface variant="elevated" p="phi4">
        <HStack gap="2" mb="phi3" flexWrap="wrap">
          <Coins size={16} color="var(--gh-colors-prize-fg)" />
          <Text fontFamily="heading" fontWeight="extrabold">
            Full fees list
          </Text>
          <GhBadge tone="muted">Live on-chain</GhBadge>
          {icpSum ? (
            <GhBadge tone="prize">
              Treasury {formatIcpShort(icpSum.balanceIcp)} ICP
            </GhBadge>
          ) : null}
        </HStack>
        <Text fontSize="xs" color="fg.muted" mb="phi3" lineHeight="1.5">
          Snapshot of every platform fee knob and destination. Edit rates and
          destinations in the sections below (admin only). Inputs are prefilled
          from these stored values.
        </Text>
        <VStack align="stretch" gap="1">
          {feeListRows.map((row) => (
            <HStack
              key={row.label}
              justify="space-between"
              align="flex-start"
              gap="phi2"
              py="2"
              borderBottomWidth="1px"
              borderColor="border.subtle"
              flexWrap="wrap"
            >
              <Box minW="0">
                <Text fontSize="sm" fontWeight="bold">
                  {row.label}
                </Text>
                <Text fontSize="2xs" color="fg.subtle">
                  {row.hint}
                </Text>
              </Box>
              <Text
                fontSize="sm"
                fontFamily="heading"
                fontWeight="extrabold"
                className="gh-text-prize"
                textAlign="right"
                wordBreak="break-all"
              >
                {row.value}
              </Text>
            </HStack>
          ))}
        </VStack>
      </GhSurface>

      {/* Destinations: XFT id + payout address */}
      <GhSurface variant="elevated" p="phi4" borderColor="prize.solid">
        <HStack gap="2" mb="phi3" flexWrap="wrap">
          <Joystick size={16} color="var(--gh-colors-prize-fg)" />
          <Text fontFamily="heading" fontWeight="extrabold">
            Destinations
          </Text>
          {!isAdmin ? (
            <GhBadge tone="muted">On-chain admin only</GhBadge>
          ) : (
            <GhBadge tone="prize">Admin</GhBadge>
          )}
        </HStack>
        <Text fontSize="xs" color="fg.muted" mb="phi3" lineHeight="1.5">
          Platform XFT routes 50% of platform fees to that token&apos;s Dexsta
          bag. Payout address receives the remaining 50% (or 100% when XFT is
          off). Inputs load from stored canister values.
        </Text>
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="phi3">
          <Box>
            <GhField
              label="Platform XFT id (Dexsta)"
              helperText="0 = no bag split · positive id must already have a bag"
            >
              <GhInput
                type="number"
                min="0"
                value={platformXftInput}
                onChange={(e) => setPlatformXftInput(e.target.value)}
                disabled={!isAdmin}
                tone="prize"
                placeholder={
                  policy.platformXftId > 0
                    ? String(policy.platformXftId)
                    : "0"
                }
              />
            </GhField>
            <Text fontSize="2xs" color="fg.subtle" mt="1" wordBreak="break-all">
              Stored:{" "}
              {policy.platformXftId > 0
                ? `XFT #${policy.platformXftId}${
                    policy.platformBagPrincipal
                      ? ` · bag ${policy.platformBagPrincipal}`
                      : " · bag unresolved"
                  }`
                : "0 (off)"}
            </Text>
            {isAdmin ? (
              <GhButton
                size="sm"
                variant="prize"
                mt="phi2"
                onClick={savePlatformXft}
              >
                Save XFT id
              </GhButton>
            ) : null}
          </Box>
          <Box>
            <GhField
              label="Payout address (principal)"
              helperText="ICP principal for platform fees · prefilled from canister"
            >
              <GhInput
                value={payoutAddressInput}
                onChange={(e) => setPayoutAddressInput(e.target.value)}
                disabled={!isAdmin}
                tone="prize"
                placeholder={
                  policy.platformFeePrincipal ||
                  policy.feeRecipient ||
                  "principal-…"
                }
              />
            </GhField>
            <Text fontSize="2xs" color="fg.subtle" mt="1" wordBreak="break-all">
              Stored:{" "}
              {policy.platformFeePrincipal ||
                policy.feeRecipient ||
                "— not set"}
            </Text>
            {isAdmin ? (
              <GhButton
                size="sm"
                variant="prize"
                mt="phi2"
                onClick={savePayoutAddress}
              >
                Save payout address
              </GhButton>
            ) : null}
          </Box>
        </Grid>
      </GhSurface>

      {/* Rate editors */}
      <GhSurface variant="elevated" p="phi4" borderColor="prize.solid">
        <HStack gap="2" mb="phi3" flexWrap="wrap">
          <Joystick size={16} color="var(--gh-colors-prize-fg)" />
          <Text fontFamily="heading" fontWeight="extrabold">
            Edit fee rates
          </Text>
          {!isAdmin ? (
            <GhBadge tone="muted">On-chain admin only</GhBadge>
          ) : (
            <GhBadge tone="prize">Admin</GhBadge>
          )}
        </HStack>
        <Text fontSize="xs" color="fg.muted" mb="phi3" lineHeight="1.5">
          Heads-up default 10% · tournament 5% · arcade 1.5% (bps for fractional
          %). Each field is prefilled from the live stored value.
        </Text>

        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="phi3" mb="phi3">
          <Box>
            <GhField
              label="Heads-up platform fee (bps)"
              helperText="1v1 pot rake · 1000 = 10% · max 2000"
            >
              <GhInput
                type="number"
                min="0"
                max="2000"
                value={headsUpBpsInput}
                onChange={(e) => setHeadsUpBpsInput(e.target.value)}
                disabled={!isAdmin}
                tone="prize"
              />
            </GhField>
            <Text fontSize="2xs" color="fg.subtle" mt="1">
              Stored: {policy.headsUpPlatformFeeBps} bps (
              {(policy.headsUpPlatformFeeBps / 100).toFixed(2)}%)
            </Text>
            {isAdmin ? (
              <GhButton size="sm" variant="prize" mt="phi2" onClick={saveHeadsUp}>
                Save heads-up fee
              </GhButton>
            ) : null}
          </Box>
          <Box>
            <GhField
              label="Tournament platform fee (bps)"
              helperText="Tournament + room pot rake · 500 = 5% · max 2000"
            >
              <GhInput
                type="number"
                min="0"
                max="2000"
                value={tournamentBpsInput}
                onChange={(e) => setTournamentBpsInput(e.target.value)}
                disabled={!isAdmin}
                tone="prize"
              />
            </GhField>
            <Text fontSize="2xs" color="fg.subtle" mt="1">
              Stored: {policy.tournamentPlatformFeeBps} bps (
              {(policy.tournamentPlatformFeeBps / 100).toFixed(2)}%) · legacy{" "}
              {policy.platformFeeRatePct}%
            </Text>
            {isAdmin ? (
              <GhButton
                size="sm"
                variant="prize"
                mt="phi2"
                onClick={saveTournament}
              >
                Save tournament fee
              </GhButton>
            ) : null}
          </Box>
        </Grid>

        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="phi3" mb="phi3">
          <Box>
            <GhField
              label="Arcade platform fee (bps)"
              helperText="Of each paid play fee · 150 = 1.5% · max 2000"
            >
              <GhInput
                type="number"
                min="0"
                max="2000"
                value={arcadeBpsInput}
                onChange={(e) => setArcadeBpsInput(e.target.value)}
                disabled={!isAdmin}
                tone="prize"
              />
            </GhField>
            <Text fontSize="2xs" color="fg.subtle" mt="1">
              Stored: {policy.arcadePlatformFeeBps} bps (
              {(policy.arcadePlatformFeeBps / 100).toFixed(2)}%)
            </Text>
            {isAdmin ? (
              <GhButton
                size="sm"
                variant="prize"
                mt="phi2"
                onClick={saveArcade}
              >
                Save arcade play cut
              </GhButton>
            ) : null}
          </Box>
          <Box>
            <GhField
              label="Arcade submit fee (ICP)"
              helperText="Cabinet submit · 0 = free · max 10"
            >
              <GhInput
                type="number"
                min="0"
                max="10"
                step="0.001"
                value={arcadeSubmitIcpInput}
                onChange={(e) => setArcadeSubmitIcpInput(e.target.value)}
                disabled={!isAdmin}
                tone="prize"
              />
            </GhField>
            <Text fontSize="2xs" color="fg.subtle" mt="1">
              Stored:{" "}
              {policy.arcadeSubmitFeeIcp <= 0
                ? "free"
                : `${formatIcpShort(policy.arcadeSubmitFeeIcp)} ICP`}{" "}
              ({policy.arcadeSubmitFeeE8s} e8s)
            </Text>
            {isAdmin ? (
              <GhButton
                size="sm"
                variant="prize"
                mt="phi2"
                onClick={saveArcadeSubmit}
              >
                Save submit fee
              </GhButton>
            ) : null}
          </Box>
        </Grid>

        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="phi3">
          <Box>
            <GhField
              label="Legacy tournament rate (%)"
              helperText="0–20 · mirrors tournament bps"
            >
              <GhInput
                type="number"
                min="0"
                max="20"
                value={platformPctInput}
                onChange={(e) => setPlatformPctInput(e.target.value)}
                disabled={!isAdmin}
              />
            </GhField>
            <Text fontSize="2xs" color="fg.subtle" mt="1">
              Stored: {policy.platformFeeRatePct}%
            </Text>
            {isAdmin ? (
              <GhButton
                size="sm"
                variant="primary"
                mt="phi2"
                onClick={savePlatformPct}
              >
                Save legacy %
              </GhButton>
            ) : null}
          </Box>
        </Grid>
      </GhSurface>

      {/* Transaction log */}
      <Box>
        <Text fontFamily="heading" fontWeight="extrabold" mb="phi2">
          Fee &amp; treasury transactions
        </Text>
        <Text fontSize="xs" color="fg.muted" mb="phi3">
          From getTreasuryTransactions — includes platform fees, vault
          allocations, rake, prize distributions, and escrow deposits.
        </Text>
        {txs.length === 0 ? (
          <GhEmptyState
            icon={Coins}
            title="No fee transactions yet"
            description="Debits and distributes write here when paid challenges, tournaments, room tables, and arcade plays settle."
          />
        ) : (
          <VStack align="stretch" gap="2" maxH="28rem" overflowY="auto">
            {txs.map((tx) => (
              <GhSurface key={tx.id} variant="glass" p="phi3">
                <HStack
                  justify="space-between"
                  align="flex-start"
                  gap="phi2"
                  flexWrap="wrap"
                >
                  <Box minW="0">
                    <HStack gap="2" mb="1" flexWrap="wrap">
                      <GhBadge
                        tone={
                          tx.type === "PlatformFee"
                            ? "prize"
                            : tx.type === "PrizeDistribution"
                              ? "success"
                              : tx.type === "TreasuryAllocation"
                                ? "brand"
                                : tx.type === "RakeCollection"
                                  ? "live"
                                  : "muted"
                        }
                      >
                        {tx.type}
                      </GhBadge>
                      <Text fontSize="2xs" color="fg.subtle">
                        {tx.timestampMs
                          ? new Date(tx.timestampMs).toLocaleString()
                          : "—"}
                      </Text>
                    </HStack>
                    <Text fontSize="sm" fontWeight="bold" lineClamp={2}>
                      {tx.description || tx.id}
                    </Text>
                    <Text fontSize="2xs" color="fg.subtle" mt="0.5">
                      {tx.from ? `${shortAddr(tx.from)} → ` : ""}
                      {tx.to ? shortAddr(tx.to) : "—"}
                      {tx.challengeId
                        ? ` · chal ${shortAddr(tx.challengeId, 10)}`
                        : ""}
                      {tx.tournamentId
                        ? ` · tourney ${shortAddr(tx.tournamentId, 10)}`
                        : ""}
                    </Text>
                  </Box>
                  <Text
                    fontFamily="heading"
                    fontWeight="extrabold"
                    className="gh-text-prize"
                    flexShrink={0}
                  >
                    {formatIcpShort(tx.amountIcp)} {tx.token}
                  </Text>
                </HStack>
              </GhSurface>
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );
}
