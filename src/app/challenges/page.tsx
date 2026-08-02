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
  ArrowRight,
  ChartCandlestick,
  Coins,
  Link2,
  Plus,
  Radio,
  Shield,
  Swords,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { ModeHeader } from "@/components/spectacle/mode-header";
import { MatchCard } from "@/components/cards/match-card";
import { ChallengeQuickForm } from "@/components/dashboard/challenge-quick-form";
import {
  GhBadge,
  GhButton,
  GhEmptyState,
  GhSpinner,
  GhSurface,
  SectionDivider,
} from "@/components/ui";
import {
  canAcceptChallenge,
  challengeHref,
  formatIcp,
  formatWhen,
  type ChallengeDetail,
} from "@/lib/challenges";
import { listChallenges } from "@/lib/ic/challenge-service";
import { isCanisterConfigured } from "@/lib/ic/canisters";
import { useSession } from "@/components/providers/session-context";
import { AcceptChallengeModal } from "@/components/challenges/accept-challenge-modal";

function matchStatus(
  status: ChallengeDetail["status"],
): "open" | "live" | "settled" | "disputed" {
  if (status === "live") return "live";
  if (status === "settled") return "settled";
  if (status === "disputed") return "disputed";
  return "open";
}

export default function ChallengesPage() {
  const { isLoggedIn, login, profile, principal, user } = useSession();
  const [items, setItems] = useState<ChallengeDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [acceptTarget, setAcceptTarget] = useState<ChallengeDetail | null>(
    null,
  );
  const viewer = profile?.username || user?.username || principal || "";
  const mePrincipal = principal || user?.principal || "";

  const openCreate = () => {
    if (!isLoggedIn) {
      void login();
      return;
    }
    setCreateOpen(true);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isCanisterConfigured()) {
        setError(
          "Canister not configured. Deploy gh_backend and set NEXT_PUBLIC_GH_BACKEND_CANISTER_ID.",
        );
        setItems([]);
        return;
      }
      setItems(await listChallenges());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const open = items.filter((c) => c.status === "open").length;
    const live = items.filter((c) => c.status === "live").length;
    const openSeats = items.filter(
      (c) => c.status === "open" && !c.opponent,
    ).length;
    const betable = items.filter((c) => c.betable).length;
    return { open, live, openSeats, betable, total: items.length };
  }, [items]);

  const openBoard = useMemo(
    () =>
      items.filter(
        (c) => c.status === "open" || c.status === "live",
      ),
    [items],
  );

  return (
    <VStack align="stretch" gap="0" pb="phi5">
      <ModeHeader
        mode="play"
        icon={Swords}
        title="Heads-up money matches"
        description="1v1 escrow on-chain. Both players deposit, link a stream, play, then settle."
        badge="1v1 · escrow"
        action={
          <GhButton
            size="sm"
            variant={createOpen ? "outline" : "primary"}
            leftIcon={createOpen ? <X size={16} /> : <Plus size={16} />}
            onClick={() => {
              if (createOpen) setCreateOpen(false);
              else openCreate();
            }}
          >
            {createOpen ? "Close form" : "New challenge"}
          </GhButton>
        }
      />

      {/* Create form — in-page panel (no redirect to dashboard) */}
      {createOpen ? (
        <Box mb="phi4">
          <ChallengeQuickForm open={createOpen} onOpenChange={setCreateOpen} />
        </Box>
      ) : null}

      {/* Explainer — same pattern as rooms / moderators */}
      <GhSurface
        variant="elevated"
        p={{ base: "phi3", md: "phi4" }}
        mb="phi4"
        borderColor="border.brand"
        boxShadow="glow"
      >
        <HStack gap="2" mb="phi3" flexWrap="wrap" align="flex-start">
          <Box
            w="10"
            h="10"
            borderRadius="xl"
            bg="brand.muted"
            color="brand.fg"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Swords size={20} />
          </Box>
          <Box minW="0" flex="1">
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              fontSize="md"
              letterSpacing="0.03em"
            >
              How heads-up works
            </Text>
            <Text fontSize="xs" color="fg.subtle">
              Escrow stakes · both stream · winner claims the pot
            </Text>
          </Box>
          {!loading && items.length > 0 ? (
            <HStack gap="2" flexWrap="wrap">
              <GhBadge tone="live" pulse={stats.live > 0}>
                {stats.live} live
              </GhBadge>
              <GhBadge tone="brand">{stats.open} open</GhBadge>
              {stats.openSeats > 0 ? (
                <GhBadge tone="muted">
                  <Users size={11} /> {stats.openSeats} open seats
                </GhBadge>
              ) : null}
              {stats.betable > 0 ? (
                <GhBadge tone="prize">
                  <ChartCandlestick size={11} /> {stats.betable} betable
                </GhBadge>
              ) : null}
            </HStack>
          ) : null}
        </HStack>
        <Grid
          templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
          gap="phi3"
        >
          {[
            {
              icon: Coins,
              t: "Post stake & accept",
              d: "Creator posts entry fee into escrow. Opponent accepts and matches the stake on-chain.",
            },
            {
              icon: Link2,
              t: "Stream & play",
              d: "Both sides attach a stream URL. Play the match, post scores, or call a monitor if needed.",
            },
            {
              icon: Trophy,
              t: "Settle the pot",
              d: "Confirm the winner — escrow releases to the winner. Optional spectator markets can ride the outcome.",
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
                <Box color="brand.fg" mb="2">
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

      <SectionDivider label="Active board" tone="brand" my="0" />

      {loading ? (
        <VStack py="phi6" gap="phi3" mt="phi3">
          <GhSpinner />
          <Text fontSize="sm" color="fg.muted">
            Loading challenges from canister…
          </Text>
        </VStack>
      ) : error ? (
        <Box mt="phi3">
          <GhEmptyState
            icon={Swords}
            title="Cannot load challenges"
            description={error}
            action={
              <HStack gap="2" flexWrap="wrap">
                <GhButton variant="outline" onClick={() => void load()}>
                  Retry
                </GhButton>
                <GhButton variant="primary" leftIcon={<Plus size={16} />} onClick={openCreate}>
                  Create challenge
                </GhButton>
              </HStack>
            }
          />
        </Box>
      ) : items.length === 0 ? (
        <Box mt="phi3">
          <GhEmptyState
            icon={Swords}
            title="No challenges yet"
            description="Create a heads-up match from the dashboard — stake lands in escrow on-chain."
            action={
              <GhButton
                variant="primary"
                leftIcon={<Plus size={16} />}
                onClick={openCreate}
              >
                New challenge
              </GhButton>
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
          gap="phi3"
          alignItems="stretch"
          mt="phi3"
          mb="phi5"
        >
          {items.map((c) => (
            <Box
              key={c.id}
              display="flex"
              flexDirection="column"
              h="100%"
              position="relative"
            >
              <Box flex="1" minH="0">
                <MatchCard
                  kind="challenge"
                  title={c.title}
                  game={c.game}
                  console={c.console}
                  stake={formatIcp(c.entryFeeIcp)}
                  status={matchStatus(c.status)}
                  players={c.opponent ? "2/2" : "1/2"}
                  username={c.creator.username}
                  challengers={[
                    {
                      username: c.creator.username,
                      avatarUrl: c.creator.avatarUrl,
                      record: c.creator.record,
                    },
                    ...(c.opponent
                      ? [
                          {
                            username: c.opponent.username,
                            avatarUrl: c.opponent.avatarUrl,
                            record: c.opponent.record,
                          },
                        ]
                      : c.invitedUsername
                        ? [
                            {
                              username: c.invitedUsername,
                              // Invite not seated yet — still show name if known
                            },
                          ]
                        : []),
                  ]}
                  seats={2}
                  betable={c.betable}
                  market={
                    c.betable && c.marketId
                      ? {
                          id: c.marketId,
                          category: "esports" as const,
                          label: "Moneyline",
                        }
                      : undefined
                  }
                  meta={formatWhen(c.scheduledAt)}
                  ctaLabel={
                    canAcceptChallenge(c, viewer, mePrincipal)
                      ? "Accept 1v1"
                      : "Open match"
                  }
                  onCtaClick={() => {
                    if (!isLoggedIn) {
                      void login();
                      return;
                    }
                    if (canAcceptChallenge(c, viewer, mePrincipal)) {
                      setAcceptTarget(c);
                    } else {
                      window.location.assign(challengeHref(c.id));
                    }
                  }}
                />
              </Box>
              <HStack mt="2" gap="2" flexWrap="wrap">
                <Link
                  href={challengeHref(c.id)}
                  style={{ flex: 1, minWidth: "8rem" }}
                >
                  <GhButton
                    size="sm"
                    variant="primary"
                    w="100%"
                    rightIcon={<ArrowRight size={14} />}
                  >
                    Open challenge
                  </GhButton>
                </Link>
                {c.creator.streamUrl ? (
                  <a
                    href={c.creator.streamUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <GhButton
                      size="sm"
                      variant="outline"
                      leftIcon={<Radio size={14} />}
                    >
                      Stream
                    </GhButton>
                  </a>
                ) : null}
              </HStack>
            </Box>
          ))}
        </Grid>
      )}

      {/* Open seats board */}
      {!loading && !error && stats.openSeats > 0 ? (
        <>
          <SectionDivider label="Open seats" tone="brand" my="0" />
          <Flex
            justify="space-between"
            align="flex-end"
            gap="phi2"
            mt="phi3"
            mb="phi3"
            flexWrap="wrap"
          >
            <Box>
              <Heading
                as="h2"
                fontFamily="heading"
                fontSize="lg"
                fontWeight="extrabold"
              >
                Looking for opponent
              </Heading>
              <Text fontSize="sm" color="fg.muted" mt="1">
                Accept to match stake in escrow and lock the seat.
              </Text>
            </Box>
            <GhBadge tone="brand">{stats.openSeats} open</GhBadge>
          </Flex>
          <VStack align="stretch" gap="phi2">
            {items
              .filter((c) => c.status === "open" && !c.opponent)
              .map((c) => (
                <GhSurface
                  key={`row-${c.id}`}
                  variant="elevated"
                  p="phi3"
                  _hover={{
                    borderColor: "border.brand",
                    boxShadow: "glow",
                    transform: "translateY(-1px)",
                  }}
                  transition="all 0.15s ease"
                >
                  <HStack
                    justify="space-between"
                    gap="phi3"
                    flexWrap="wrap"
                    align="center"
                  >
                    <HStack gap="phi3" minW="0" flex="1" align="flex-start">
                      <Box
                        w="9"
                        h="9"
                        borderRadius="lg"
                        bg="brand.muted"
                        color="brand.fg"
                        borderWidth="1px"
                        borderColor="border.brand"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                      >
                        <Swords size={16} />
                      </Box>
                      <Box minW="0">
                        <HStack gap="2" mb="1" flexWrap="wrap">
                          <GhBadge tone="brand">Open seat</GhBadge>
                          {c.betable ? (
                            <GhBadge tone="prize">
                              <ChartCandlestick size={10} /> Betable
                            </GhBadge>
                          ) : null}
                          <Text
                            fontFamily="heading"
                            fontWeight="extrabold"
                            fontSize="sm"
                            lineClamp={1}
                          >
                            {c.title}
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color="fg.muted">
                          {c.game}
                          {c.console ? ` · ${c.console}` : ""} ·{" "}
                          <Text as="span" color="brand.fg" fontWeight="bold">
                            {formatIcp(c.entryFeeIcp)}
                          </Text>{" "}
                          · vs @{c.creator.username}
                          {c.scheduledAt
                            ? ` · ${formatWhen(c.scheduledAt)}`
                            : ""}
                        </Text>
                      </Box>
                    </HStack>
                    <HStack gap="2" flexShrink={0}>
                      <Link href={challengeHref(c.id)}>
                        <GhButton size="sm" variant="outline">
                          View
                        </GhButton>
                      </Link>
                      <GhButton
                        size="sm"
                        variant="primary"
                        rightIcon={<ArrowRight size={14} />}
                        onClick={() => {
                          if (!isLoggedIn) {
                            void login();
                            return;
                          }
                          if (canAcceptChallenge(c, viewer, mePrincipal)) {
                            setAcceptTarget(c);
                          } else {
                            window.location.assign(challengeHref(c.id));
                          }
                        }}
                      >
                        Accept
                      </GhButton>
                    </HStack>
                  </HStack>
                </GhSurface>
              ))}
          </VStack>
        </>
      ) : null}

      {/* Footer tip */}
      <GhSurface variant="muted" p="phi3" mt="phi5">
        <HStack gap="2" align="flex-start">
          <Shield
            size={16}
            color="var(--gh-colors-brand-fg)"
            style={{ marginTop: 2, flexShrink: 0 }}
          />
          <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
            Stakes sit in non-custodial escrow until both sides confirm (or a
            monitor settles a dispute). Create from{" "}
            <Text as="span" color="brand.fg" fontWeight="bold">
              Dashboard
            </Text>
            {openBoard.length > 0
              ? ` · ${openBoard.length} active on the board right now.`
              : "."}
          </Text>
        </HStack>
      </GhSurface>

      <AcceptChallengeModal
        challenge={acceptTarget}
        open={Boolean(acceptTarget)}
        onClose={() => setAcceptTarget(null)}
        onAccepted={() => void load()}
      />
    </VStack>
  );
}
