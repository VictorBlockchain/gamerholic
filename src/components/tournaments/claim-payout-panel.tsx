"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Flex,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Coins,
  Info,
  Percent,
  Trophy,
  Users,
} from "lucide-react";
import {
  GhAlert,
  GhAvatar,
  GhBadge,
  GhButton,
  GhField,
  GhInput,
  ghToast,
} from "@/components/ui";
import {
  claimTournamentSolo,
  claimTournamentTeam,
  markTournamentBetableSettled,
  previewTeamClaim,
  type TeamClaimPreview,
} from "@/lib/ic/tournament-service";
import {
  betableMarketUrl,
  getBetableMarket,
  isBetableConfigured,
  isBetableMarketSettled,
  type BetableMarket,
} from "@/lib/ic/betable-service";
import { formatIcp, type TournamentDetail } from "@/lib/tournaments";
import { isCanisterConfigured } from "@/lib/ic/canisters";

/**
 * Claim payout panel — solo winner or team split by win-split % assigned on invite.
 * If a betable market is linked, claim is blocked until the market is #resolved.
 */
export function ClaimPayoutPanel({
  tournament,
  isHost,
  hostPrincipal,
  onClaimed,
}: {
  tournament: TournamentDetail;
  isHost: boolean;
  hostPrincipal: string;
  onClaimed?: () => void;
}) {
  const [potIcp, setPotIcp] = useState(
    String(tournament.prizePotIcp ?? tournament.entryFeeIcp * Math.max(2, tournament.entrants.length || 2)),
  );
  const [winner, setWinner] = useState(hostPrincipal);
  const [winningTeamId, setWinningTeamId] = useState("");
  const [preview, setPreview] = useState<TeamClaimPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [market, setMarket] = useState<BetableMarket | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);

  const teamMode = tournament.teamEntry;
  const claimable =
    tournament.status === "live" || tournament.status === "settled";
  const hasBetable = Boolean(tournament.betable && tournament.marketId);
  const marketSettled = !hasBetable || isBetableMarketSettled(market);
  const claimBlockedByBetable = hasBetable && !marketSettled;

  const refreshMarket = useCallback(async () => {
    if (!hasBetable || !tournament.marketId) {
      setMarket(null);
      return;
    }
    if (!isBetableConfigured()) {
      setMarket(null);
      return;
    }
    setMarketLoading(true);
    try {
      const m = await getBetableMarket(tournament.marketId);
      setMarket(m);
    } catch {
      setMarket(null);
    } finally {
      setMarketLoading(false);
    }
  }, [hasBetable, tournament.marketId]);

  useEffect(() => {
    void refreshMarket();
  }, [refreshMarket]);

  const refreshPreview = useCallback(async () => {
    if (!teamMode || !winningTeamId.trim()) {
      setPreview(null);
      return;
    }
    const pot = parseFloat(potIcp);
    if (!Number.isFinite(pot) || pot < 0) return;
    setPreviewing(true);
    try {
      const p = await previewTeamClaim(
        tournament.id,
        pot,
        winningTeamId.trim(),
      );
      setPreview(p);
    } catch {
      setPreview(null);
    } finally {
      setPreviewing(false);
    }
  }, [teamMode, winningTeamId, potIcp, tournament.id]);

  useEffect(() => {
    if (teamMode && winningTeamId) void refreshPreview();
  }, [teamMode, winningTeamId, potIcp, refreshPreview]);

  if (!claimable) return null;

  const onClaim = async () => {
    if (!isCanisterConfigured()) {
      ghToast({
        title: "Canister not configured",
        type: "error",
      });
      return;
    }
    if (!isHost) {
      ghToast({
        title: "Host only",
        description: "Only the tournament host can finalize claim",
        type: "error",
      });
      return;
    }
    if (hasBetable) {
      const m =
        market ??
        (tournament.marketId
          ? await getBetableMarket(tournament.marketId)
          : null);
      if (!isBetableMarketSettled(m)) {
        ghToast({
          title: "Wait for betable settlement",
          description:
            m?.status === "closed"
              ? "Market is closed but not resolved yet. Finalize resolution on betable first."
              : m
                ? `Market status is “${m.status}”. Resolve the market before claiming the prize pot.`
                : "Could not load betable market status. Resolve the market on betable, then retry.",
          type: "error",
        });
        return;
      }
      // Unlock claim gate on gamerholic canister after verifying resolved
      await markTournamentBetableSettled(tournament.id, hostPrincipal, true);
    }
    const pot = parseFloat(potIcp);
    if (!Number.isFinite(pot) || pot <= 0) {
      ghToast({ title: "Valid pot required", type: "error" });
      return;
    }
    setLoading(true);
    try {
      let ok = false;
      if (teamMode) {
        if (!winningTeamId.trim()) {
          ghToast({ title: "Winning team id required", type: "error" });
          setLoading(false);
          return;
        }
        if (preview && !preview.splitsValid) {
          ghToast({
            title: "Invalid team splits",
            description: `Win splits total ${preview.splitsTotalBps / 100}% — must equal 100%`,
            type: "error",
          });
          setLoading(false);
          return;
        }
        ok = await claimTournamentTeam(
          tournament.id,
          pot,
          winningTeamId.trim(),
        );
      } else {
        if (!winner.trim()) {
          ghToast({ title: "Winner address required", type: "error" });
          setLoading(false);
          return;
        }
        ok = await claimTournamentSolo(tournament.id, pot, winner.trim());
      }
      if (!ok) throw new Error("Claim returned false — check betable settled flag and pot");
      ghToast({
        title: "Payout claimed on-chain",
        description: teamMode
          ? "Team prize split by each member’s assigned win %"
          : "Winner paid after host fee + platform rake",
        type: "success",
      });
      onClaimed?.();
    } catch (e) {
      ghToast({
        title: "Claim failed",
        description: e instanceof Error ? e.message : String(e),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

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
        bg="linear-gradient(125deg, rgba(244,63,168,0.2) 0%, rgba(13,11,26,0.94) 45%, rgba(163,255,61,0.1) 100%)"
      />
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        h="1"
        bg="linear-gradient(90deg, #f43fa8, #a3ff3d, #f43fa8)"
      />
      <Box position="relative" p={{ base: "phi4", md: "phi5" }}>
        <HStack gap="2" mb="phi3" flexWrap="wrap">
          <Box
            w="11"
            h="11"
            borderRadius="xl"
            bg="prize.muted"
            color="prize.fg"
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderWidth="1px"
            borderColor="prize.solid"
          >
            <Coins size={20} />
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
              Finalize payout
            </Text>
            <Text fontFamily="heading" fontWeight="extrabold" fontSize="lg">
              Claim form
            </Text>
          </Box>
          {teamMode ? (
            <GhBadge tone="brand">
              <Users size={10} /> Team entry
            </GhBadge>
          ) : (
            <GhBadge tone="prize">
              <Trophy size={10} /> Solo / FFA
            </GhBadge>
          )}
        </HStack>

        {hasBetable ? (
          <GhAlert
            tone={claimBlockedByBetable ? "warning" : "success"}
            title={
              claimBlockedByBetable
                ? "Betable market must settle first"
                : "Betable market settled — claim unlocked"
            }
            mb="phi4"
          >
            <VStack align="stretch" gap="2" mt="1">
              <Text fontSize="sm" lineHeight="1.55">
                This tournament has a linked betable market
                {tournament.marketId ? ` (#${tournament.marketId})` : ""}. Prize
                claim is blocked until the market is fully{" "}
                <strong>resolved</strong> on betable (not just closed).
              </Text>
              <HStack gap="2" flexWrap="wrap">
                <GhBadge tone={marketSettled ? "success" : "prize"}>
                  {marketLoading
                    ? "Checking…"
                    : market
                      ? `Status: ${market.status}`
                      : isBetableConfigured()
                        ? "Status: unknown"
                        : "Betable env not configured"}
                </GhBadge>
                {tournament.marketId && isBetableConfigured() ? (
                  <GhButton
                    size="sm"
                    variant="soft"
                    onClick={() =>
                      window.open(
                        betableMarketUrl(tournament.marketId!),
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                  >
                    Open on betable
                  </GhButton>
                ) : null}
                <GhButton
                  size="sm"
                  variant="soft"
                  onClick={() => void refreshMarket()}
                  disabled={marketLoading}
                >
                  Refresh status
                </GhButton>
              </HStack>
            </VStack>
          </GhAlert>
        ) : null}

        {/* Explainer */}
        <GhAlert
          tone="prize"
          title={
            teamMode
              ? "How team prize splits work"
              : "How solo prize payout works"
          }
          mb="phi4"
        >
          {teamMode ? (
            <VStack align="stretch" gap="2" mt="1">
              <Text fontSize="sm" lineHeight="1.55">
                When this team tournament is claimed, the pot is split in order:
              </Text>
              <Text fontSize="sm" as="span" display="block" pl="2">
                1. <strong>Host fee</strong> ({tournament.hostFeePct}% of pot) →
                tournament host
              </Text>
              <Text fontSize="sm" as="span" display="block" pl="2">
                2. <strong>Platform rake</strong> on the remainder
              </Text>
              <Text fontSize="sm" as="span" display="block" pl="2">
                3. <strong>Team prize pool</strong> is paid to each roster
                member by the <strong>win-split % assigned when they were
                invited / added to the team</strong> (must total 100%)
              </Text>
              <Text fontSize="xs" color="fg.muted" mt="1">
                Example: captain 40%, fragger 35%, support 25% → each receives
                that share of the team prize pool into their play subaccount.
              </Text>
            </VStack>
          ) : (
            <Text fontSize="sm" lineHeight="1.55" mt="1">
              Host fee ({tournament.hostFeePct}%) is taken first, then platform
              rake. The remainder is paid to the single winner address.
            </Text>
          )}
        </GhAlert>

        <VStack align="stretch" gap="phi3">
          <GhField
            label="Prize pot (ICP)"
            helperText="Full escrow pot before fees"
          >
            <GhInput
              type="number"
              min="0"
              step="0.01"
              value={potIcp}
              onChange={(e) => setPotIcp(e.target.value)}
              tone="prize"
            />
          </GhField>

          {teamMode ? (
            <GhField
              label="Winning team id"
              helperText="Team that won the bracket (e.g. team-…)"
            >
              <GhInput
                value={winningTeamId}
                onChange={(e) => setWinningTeamId(e.target.value)}
                placeholder="team-…"
              />
            </GhField>
          ) : (
            <GhField label="Winner address / username">
              <GhInput
                value={winner}
                onChange={(e) => setWinner(e.target.value)}
                placeholder="principal or username"
              />
            </GhField>
          )}

          {/* Live preview for team */}
          {teamMode ? (
            <Box
              p="phi4"
              borderRadius="xl"
              borderWidth="1px"
              borderColor={
                preview?.splitsValid === false
                  ? "danger.solid"
                  : "border.brand"
              }
              bg="blackAlpha.500"
            >
              <HStack justify="space-between" mb="phi3" flexWrap="wrap" gap="2">
                <HStack gap="2">
                  <Percent size={16} color="var(--gh-colors-brand-fg)" />
                  <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
                    Member payout preview
                  </Text>
                </HStack>
                <GhButton
                  size="sm"
                  variant="soft"
                  onClick={() => void refreshPreview()}
                  disabled={previewing || !winningTeamId.trim()}
                >
                  {previewing ? "Loading…" : "Refresh"}
                </GhButton>
              </HStack>

              {!winningTeamId.trim() ? (
                <Text fontSize="sm" color="fg.muted">
                  Enter the winning team id to preview each member’s share.
                </Text>
              ) : preview ? (
                <>
                  <SimpleGrid columns={{ base: 2, sm: 4 }} gap="phi2" mb="phi3">
                    <Mini
                      label="Pot"
                      value={formatIcp(preview.potIcp)}
                    />
                    <Mini
                      label={`Host ${preview.hostFeePct}%`}
                      value={formatIcp(preview.hostCutIcp)}
                    />
                    <Mini
                      label="Platform rake"
                      value={formatIcp(preview.platformRakeIcp)}
                    />
                    <Mini
                      label="Team pool"
                      value={formatIcp(preview.teamPrizePoolIcp)}
                      prize
                    />
                  </SimpleGrid>

                  {!preview.splitsValid ? (
                    <GhAlert tone="error" title="Splits must total 100%">
                      Current total {preview.splitsTotalBps / 100}%. Captain must
                      fix win splits on the team before claim.
                    </GhAlert>
                  ) : null}

                  <VStack align="stretch" gap="2" mt="phi2">
                    {preview.lines.map((line) => (
                      <Flex
                        key={line.member}
                        justify="space-between"
                        align="center"
                        gap="phi2"
                        p="phi2"
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="border.default"
                        bg="blackAlpha.400"
                      >
                        <HStack gap="phi2" minW="0">
                          <GhAvatar name={line.member} size="sm" tone="prize" />
                          <Box minW="0">
                            <Text
                              fontFamily="heading"
                              fontWeight="bold"
                              fontSize="sm"
                              lineClamp={1}
                            >
                              {line.member}
                            </Text>
                            <Text fontSize="2xs" color="fg.subtle">
                              {line.winSplitPct}% of team pool
                            </Text>
                          </Box>
                        </HStack>
                        <Text
                          fontFamily="heading"
                          fontWeight="extrabold"
                          className="gh-text-prize"
                          flexShrink={0}
                        >
                          {formatIcp(line.amountIcp)}
                        </Text>
                      </Flex>
                    ))}
                  </VStack>
                </>
              ) : (
                <Text fontSize="sm" color="fg.muted">
                  No preview yet — check team id and pot.
                </Text>
              )}
            </Box>
          ) : null}

          <HStack gap="2" color="fg.muted" fontSize="xs" align="flex-start">
            <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <Text>
              Claim writes the settlement on-chain. Team members receive the
              exact win-split % configured when they joined the roster — not an
              equal split unless you set equal %.
            </Text>
          </HStack>

          <GhButton
            variant="prize"
            leftIcon={<Coins size={16} />}
            onClick={() => void onClaim()}
            disabled={loading || !isHost || claimBlockedByBetable}
          >
            {loading
              ? "Claiming…"
              : claimBlockedByBetable
                ? "Waiting for market settle…"
                : teamMode
                  ? "Claim team payouts"
                  : "Claim winner payout"}
          </GhButton>
          {!isHost ? (
            <Text fontSize="xs" color="fg.subtle">
              Only the host can run claim.
            </Text>
          ) : claimBlockedByBetable ? (
            <Text fontSize="xs" color="fg.subtle">
              Resolve the betable market first, then claim becomes available.
            </Text>
          ) : null}
        </VStack>
      </Box>
    </Box>
  );
}

function Mini({
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
      bg="blackAlpha.400"
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
