"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Box, Grid, HStack, Text, VStack } from "@chakra-ui/react";
import { Layers, Plus, Swords, Trophy } from "lucide-react";
import { ModeHeader } from "@/components/spectacle/mode-header";
import { LiveTicker } from "@/components/spectacle/live-ticker";
import { MatchCard } from "@/components/cards/match-card";
import {
  GhBadge,
  GhButton,
  GhEmptyState,
  GhSpinner,
  GhSurface,
  GhTabs,
} from "@/components/ui";
import {
  filledLabel,
  formatIcp,
  formatWhen,
  isGroupPotTournament,
  statusLabel,
  statusTone,
  tournamentKindLabel,
  type TournamentDetail,
} from "@/lib/tournaments";
import { listTournaments } from "@/lib/ic/tournament-service";
import { isCanisterConfigured } from "@/lib/ic/canisters";

export default function TournamentsPage() {
  const [items, setItems] = useState<TournamentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "bracket" | "group_pot">("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
        const list = await listTournaments();
        if (!cancelled) setItems(list);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const brackets = useMemo(
    () => items.filter((t) => !isGroupPotTournament(t)),
    [items],
  );
  const groupPots = useMemo(
    () => items.filter((t) => isGroupPotTournament(t)),
    [items],
  );
  const filtered = useMemo(() => {
    if (filter === "bracket") return brackets;
    if (filter === "group_pot") return groupPots;
    return items;
  }, [filter, items, brackets, groupPots]);

  return (
    <>
      <ModeHeader
        mode="host"
        icon={Trophy}
        title="Brackets & group pots"
        description="Elimination brackets and multiplayer group pots. Host for a fee · optional betable markets."
        action={
          <Link href="/create?type=tournament">
            <GhButton size="sm" variant="prize" leftIcon={<Plus size={16} />}>
              Host & earn
            </GhButton>
          </Link>
        }
      />
      <Box mb="phi4">
        <LiveTicker label="Tournaments" />
      </Box>

      {loading ? (
        <VStack py="phi6" gap="phi3">
          <GhSpinner />
          <Text fontSize="sm" color="fg.muted">
            Loading tournaments from canister…
          </Text>
        </VStack>
      ) : error ? (
        <GhEmptyState
          icon={Trophy}
          title="Cannot load tournaments"
          description={error}
        />
      ) : items.length === 0 ? (
        <GhEmptyState
          icon={Trophy}
          title="No tournaments yet"
          description="Host your first bracket or group pot from the create booth."
          action={
            <Link href="/create?type=tournament">
              <GhButton variant="prize" leftIcon={<Plus size={16} />}>
                Host tournament
              </GhButton>
            </Link>
          }
        />
      ) : (
        <>
          <GhTabs
            tone="prize"
            size="sm"
            value={filter}
            onValueChange={(v) =>
              setFilter(v as "all" | "bracket" | "group_pot")
            }
            items={[
              {
                value: "all",
                label: `All (${items.length})`,
                icon: <Trophy size={13} />,
                content: null,
              },
              {
                value: "bracket",
                label: `Brackets (${brackets.length})`,
                icon: <Swords size={13} />,
                content: null,
              },
              {
                value: "group_pot",
                label: `Group pots (${groupPots.length})`,
                icon: <Layers size={13} />,
                content: null,
              },
            ]}
          />

          <Grid
            templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)" }}
            gap="phi3"
            alignItems="stretch"
            mb="phi5"
            mt="phi3"
          >
            {filtered.length === 0 ? (
              <Box gridColumn="1 / -1">
                <GhEmptyState
                  icon={filter === "group_pot" ? Layers : Swords}
                  title={
                    filter === "group_pot"
                      ? "No group pot events"
                      : "No brackets"
                  }
                  description={
                    filter === "group_pot"
                      ? "FFA / multiplayer pots show here — host one from Create."
                      : "Single-elim trees show here."
                  }
                />
              </Box>
            ) : (
              filtered.map((t) => {
                const group = isGroupPotTournament(t);
                return (
                  <Box key={t.id}>
                    <MatchCard
                      kind={group ? "room" : "tournament"}
                      title={t.title}
                      game={t.game}
                      console={t.console}
                      entryFee={formatIcp(t.entryFeeIcp)}
                      prizePot={
                        t.prizePotIcp != null
                          ? formatIcp(t.prizePotIcp)
                          : undefined
                      }
                      status={
                        t.status === "live"
                          ? "live"
                          : t.status === "settled"
                            ? "settled"
                            : t.status === "cancelled"
                              ? "disputed"
                              : "open"
                      }
                      players={filledLabel(t)}
                      meta={`${tournamentKindLabel(t)} · ${t.format} · ${formatWhen(t.scheduledAt)}`}
                      hostEarn={`${t.hostFeePct}% host · ${t.hostUsername}`}
                      username={t.hostUsername}
                      betable={t.betable}
                      market={
                        t.betable && t.marketId
                          ? {
                              id: t.marketId,
                              category: "esports" as const,
                              label: `Winner · ${t.title.slice(0, 18)}`,
                            }
                          : undefined
                      }
                    />
                    <Box mt="2">
                      <Link href={`/tournaments/${encodeURIComponent(t.id)}`}>
                        <GhButton
                          size="sm"
                          variant={group ? "live" : "prize"}
                          w="100%"
                        >
                          {group ? "Open group pot" : "Open bracket"}
                        </GhButton>
                      </Link>
                    </Box>
                  </Box>
                );
              })
            )}
          </Grid>

          <VStack align="stretch" gap="phi2">
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              fontSize="sm"
              letterSpacing="0.06em"
              textTransform="uppercase"
              color="fg.subtle"
            >
              {filter === "group_pot"
                ? "Group pot list"
                : filter === "bracket"
                  ? "Bracket list"
                  : "All events"}
            </Text>
            {filtered.map((t) => {
              const group = isGroupPotTournament(t);
              return (
              <Link key={`row-${t.id}`} href={`/tournaments/${encodeURIComponent(t.id)}`}>
                <GhSurface
                  variant="glass"
                  p="phi3"
                  borderColor={group ? "live.solid" : "border.default"}
                >
                  <HStack justify="space-between" gap="phi3" flexWrap="wrap">
                    <Box minW="0">
                      <HStack gap="2" mb="1" flexWrap="wrap">
                        <GhBadge
                          tone={statusTone(t.status)}
                          pulse={t.status === "live"}
                        >
                          {statusLabel(t.status)}
                        </GhBadge>
                        <GhBadge tone={group ? "live" : "prize"}>
                          {tournamentKindLabel(t)}
                        </GhBadge>
                        {t.betable ? (
                          <GhBadge tone="prize">Betable</GhBadge>
                        ) : null}
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
                        {t.game} · {t.console} · {filledLabel(t)} · host{" "}
                        {t.hostUsername}
                      </Text>
                    </Box>
                    <GhButton size="sm" variant="outline">
                      Details
                    </GhButton>
                  </HStack>
                </GhSurface>
              </Link>
              );
            })}
          </VStack>
        </>
      )}
    </>
  );
}
