"use client";

import Link from "next/link";
import {
  Box,
  Flex,
  Grid,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  Coins,
  Flame,
  Gamepad2,
  Monitor,
  Share2,
  Snowflake,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import {
  GhAvatar,
  GhBadge,
  GhButton,
  GhEmptyState,
  GhSurface,
  GhTabs,
  ghToast,
} from "@/components/ui";
import { MatchCard } from "@/components/cards/match-card";
import { teamShareUrl } from "@/lib/deep-links";
import {
  formatWhen,
  getTeamById,
  getTeamMatches,
  teamEarningsTotal,
  teamRecordLabel,
  teamWinRate,
  totalSplit,
  type Team,
  type TeamMatch,
  type TeamMember,
} from "@/lib/teams";

/**
 * Full esports team page — cover, logo, HUD stats, roster, match cards.
 * Ideal layout mirrors top org pages (Liquid / Cloud9 style) adapted for web3 pots.
 */
export function TeamDetailView({ teamId }: { teamId: string }) {
  const team = getTeamById(teamId);

  if (!team) {
    return (
      <VStack align="stretch" gap="phi4" pb="phi4">
        <GhEmptyState
          icon={Users}
          title="Team not found"
          description="This squad doesn’t exist or was removed."
          action={
            <Link href="/teams">
              <GhButton variant="primary" leftIcon={<ArrowLeft size={16} />}>
                Back to teams
              </GhButton>
            </Link>
          }
        />
      </VStack>
    );
  }

  const matches = getTeamMatches(team.id);
  const challenges = matches.filter((m) => m.kind === "challenge");
  const tournaments = matches.filter((m) => m.kind === "tournament");
  const earnings = teamEarningsTotal(team);
  const winRate = teamWinRate(team);
  const split = totalSplit(team.members);

  const share = () => {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : teamShareUrl(team.id);
    void navigator.clipboard?.writeText(url);
    ghToast({
      title: "Team link copied",
      description: url,
      type: "success",
    });
  };

  return (
    <VStack align="stretch" gap={{ base: "phi4", md: "phi5" }} pb="phi4">
      {/* ── Cover hero ── */}
      <Box
        position="relative"
        borderRadius="3xl"
        borderWidth="1px"
        borderColor="border.brand"
        overflow="hidden"
        boxShadow="glow"
      >
        <Box position="relative" h={{ base: "10rem", md: "14rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={team.coverUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.5) saturate(1.15)",
            }}
          />
          <Box
            position="absolute"
            inset="0"
            bg="linear-gradient(180deg, rgba(7,6,18,0.15) 0%, rgba(7,6,18,0.55) 45%, rgba(7,6,18,0.96) 100%)"
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
            <Link href="/teams">
              <GhButton size="sm" variant="soft" leftIcon={<ArrowLeft size={14} />}>
                Teams
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
              <Link href="/dashboard">
                <GhButton size="sm" variant="primary" leftIcon={<Swords size={14} />}>
                  Challenge
                </GhButton>
              </Link>
              <Link href="/create?type=tournament">
                <GhButton size="sm" variant="prize" leftIcon={<Trophy size={14} />}>
                  Host
                </GhButton>
              </Link>
            </HStack>
          </HStack>
        </Box>

        {/* Logo + identity */}
        <Box
          px={{ base: "phi3", md: "phi5" }}
          pb="phi4"
          mt={{ base: "-3.25rem", md: "-4rem" }}
          position="relative"
        >
          <Flex
            direction={{ base: "column", sm: "row" }}
            gap="phi3"
            align={{ sm: "flex-end" }}
          >
            <Box
              w={{ base: "5.5rem", md: "7rem" }}
              h={{ base: "5.5rem", md: "7rem" }}
              borderRadius="2xl"
              borderWidth="3px"
              borderColor="border.brand"
              overflow="hidden"
              bg="bg.elevated"
              boxShadow="glow"
              flexShrink={0}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={team.avatarUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
            <Box flex="1" minW="0" pb={{ sm: "1" }}>
              <HStack gap="2" mb="1" flexWrap="wrap">
                <GhBadge tone="brand">[{team.tag}]</GhBadge>
                <GhBadge tone="live">
                  <Monitor size={10} /> {team.console}
                </GhBadge>
                <GhBadge tone="muted">
                  <Gamepad2 size={10} /> {team.game}
                </GhBadge>
                <GhBadge tone="prize">{team.members.length} roster</GhBadge>
              </HStack>
              <Heading
                as="h1"
                fontFamily="heading"
                fontSize={{ base: "xl", md: "3xl" }}
                fontWeight="extrabold"
                letterSpacing="0.03em"
                textTransform="uppercase"
                lineHeight="1.1"
              >
                {team.name}
              </Heading>
              <Text
                fontSize="sm"
                color="fg.muted"
                mt="phi2"
                maxW="36rem"
                lineHeight="1.55"
              >
                {team.bio}
              </Text>
              <Text fontSize="2xs" color="fg.subtle" mt="phi2" fontFamily="mono">
                Formed {formatWhen(team.createdAt)} · splits {split}%
              </Text>
            </Box>
          </Flex>
        </Box>
      </Box>

      {/* ── Stats HUD ── */}
      <SimpleGrid columns={{ base: 2, md: 5 }} gap="phi2">
        <StatTile
          label="Record"
          value={teamRecordLabel(team)}
          hint={`${winRate}% WR`}
          tone="brand"
        />
        <StatTile
          label="Win streak"
          value={String(team.winStreak)}
          hint={team.winStreak > 0 ? "Hot" : "—"}
          icon={<Flame size={14} color="var(--gh-colors-prize-fg)" />}
          tone="prize"
        />
        <StatTile
          label="Loss streak"
          value={String(team.lossStreak)}
          hint={team.lossStreak > 0 ? "Cold" : "Clean"}
          icon={<Snowflake size={14} color="var(--gh-colors-live-fg)" />}
          tone="live"
        />
        <StatTile
          label="Best streak"
          value={String(team.bestWinStreak)}
          hint="All-time"
          tone="attr"
        />
        <StatTile
          label="Team earnings"
          value={`${earnings.toFixed(1)}`}
          hint="ICP combined"
          icon={<Coins size={14} color="var(--gh-colors-prize-fg)" />}
          tone="prize"
        />
      </SimpleGrid>

      {/* ── Tabs: roster · matches · tournaments ── */}
      <GhTabs
        tone="brand"
        fitted
        defaultValue="roster"
        items={[
          {
            value: "roster",
            label: `Roster (${team.members.length})`,
            content: <RosterPanel team={team} />,
          },
          {
            value: "matches",
            label: `Matches (${challenges.length})`,
            content: (
              <MatchList
                empty="No team challenges yet"
                emptyHint="Issue a team challenge from the dashboard."
                matches={challenges}
                team={team}
              />
            ),
          },
          {
            value: "tournaments",
            label: `Tournaments (${tournaments.length})`,
            content: (
              <MatchList
                empty="No tournaments yet"
                emptyHint="Host a team bracket from the host booth."
                matches={tournaments}
                team={team}
              />
            ),
          },
          {
            value: "about",
            label: "About",
            content: <AboutPanel team={team} />,
          },
        ]}
      />
    </VStack>
  );
}

function StatTile({
  label,
  value,
  hint,
  icon,
  tone = "brand",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "brand" | "prize" | "live" | "attr";
}) {
  const border =
    tone === "prize"
      ? "prize.solid"
      : tone === "live"
        ? "live.solid"
        : tone === "attr"
          ? "attr.solid"
          : "border.brand";
  return (
    <GhSurface
      variant="glass"
      p="phi3"
      borderColor={border}
      minH="5.5rem"
    >
      <HStack justify="space-between" mb="1">
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
        {icon}
      </HStack>
      <Text
        fontFamily="heading"
        fontSize={{ base: "xl", md: "2xl" }}
        fontWeight="extrabold"
        lineHeight="1"
        className={
          tone === "prize"
            ? "gh-text-prize"
            : tone === "live"
              ? "gh-text-live"
              : undefined
        }
      >
        {value}
      </Text>
      {hint ? (
        <Text fontSize="2xs" color="fg.muted" mt="1">
          {hint}
        </Text>
      ) : null}
    </GhSurface>
  );
}

function RosterPanel({ team }: { team: Team }) {
  return (
    <VStack align="stretch" gap="phi3" pt="phi3">
      <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
        Win splits total{" "}
        <Text as="span" color="prize.fg" fontWeight="bold">
          {totalSplit(team.members)}%
        </Text>
        . Each member’s share of team prizes is paid to their play subaccount on
        finalize.
      </Text>
      <Grid
        templateColumns={{ base: "1fr", md: "1fr 1fr" }}
        gap="phi3"
      >
        {team.members.map((m) => (
          <PlayerCard key={m.id} member={m} />
        ))}
      </Grid>
    </VStack>
  );
}

function PlayerCard({ member }: { member: TeamMember }) {
  const isCaptain = member.role === "captain";
  return (
    <GhSurface
      variant={isCaptain ? "brand" : "elevated"}
      p="phi3"
      borderColor={isCaptain ? "border.brand" : undefined}
    >
      <HStack gap="phi3" align="flex-start">
        <GhAvatar name={member.username} size="md" tone="brand" />
        <Box flex="1" minW="0">
          <HStack gap="2" flexWrap="wrap" mb="1">
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              fontSize="sm"
              lineClamp={1}
            >
              {member.username}
            </Text>
            {isCaptain ? <GhBadge tone="prize">Captain</GhBadge> : (
              <GhBadge tone="muted">Member</GhBadge>
            )}
          </HStack>
          <SimpleGrid columns={3} gap="2" mb="phi2">
            <MiniStat label="Split" value={`${member.winSplitPct}%`} />
            <MiniStat
              label="Earned"
              value={`${member.earningsIcp.toFixed(1)}`}
              sub="ICP"
            />
            <MiniStat label="Record" value={member.record ?? "—"} />
          </SimpleGrid>
          <Link href={`/profile?u=${encodeURIComponent(member.username)}`}>
            <GhButton size="sm" variant="outline" w="100%">
              View profile
            </GhButton>
          </Link>
        </Box>
      </HStack>
    </GhSurface>
  );
}

function MiniStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Box
      p="2"
      borderRadius="lg"
      bg="blackAlpha.400"
      borderWidth="1px"
      borderColor="border.default"
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
      <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
        {value}
        {sub ? (
          <Text as="span" fontSize="2xs" color="fg.muted" ml="0.5">
            {sub}
          </Text>
        ) : null}
      </Text>
    </Box>
  );
}

function MatchList({
  matches,
  team,
  empty,
  emptyHint,
}: {
  matches: TeamMatch[];
  team: Team;
  empty: string;
  emptyHint: string;
}) {
  if (matches.length === 0) {
    return (
      <Box pt="phi3">
        <GhEmptyState
          icon={empty.toLowerCase().includes("tournament") ? Trophy : Swords}
          title={empty}
          description={emptyHint}
          action={
            <Link
              href={
                empty.toLowerCase().includes("tournament")
                  ? "/create?type=tournament"
                  : "/dashboard"
              }
            >
              <GhButton size="sm" variant="primary">
                {empty.toLowerCase().includes("tournament")
                  ? "Host booth"
                  : "Dashboard"}
              </GhButton>
            </Link>
          }
        />
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap="phi3" pt="phi3">
      {matches.map((m) => (
        <MatchCard key={m.id} {...teamMatchToCard(m, team)} />
      ))}
    </VStack>
  );
}

function teamMatchToCard(m: TeamMatch, team: Team) {
  const settled = m.result === "W" || m.result === "L";
  const status = settled
    ? ("settled" as const)
    : m.result === "ongoing"
      ? ("live" as const)
      : ("open" as const);

  if (m.kind === "tournament") {
    return {
      kind: "tournament" as const,
      title: m.title,
      game: m.game,
      console: m.console,
      entryFee: m.entryFee ?? "—",
      prizePot: m.prize,
      status,
      players: m.players ?? "—",
      meta: `${m.result === "W" ? "Win" : m.result === "L" ? "Loss" : "Live"} · ${formatWhen(m.at)}`,
      username: team.name,
      avatarUrl: team.avatarUrl,
      record: teamRecordLabel(team),
      recordLabel: "Team W–L",
      seats: 2,
      challengers: [
        { username: team.tag, record: teamRecordLabel(team) },
        { username: m.opponent, record: "—" },
      ],
      hostEarn: m.prize && m.result === "W" ? `Prize ${m.prize}` : undefined,
    };
  }

  return {
    kind: "challenge" as const,
    title: m.title,
    game: m.game,
    console: m.console,
    entryFee: m.stake,
    prizePot: m.prize,
    stake: m.stake,
    status,
    players: "2 teams",
    meta: `${m.result === "W" ? "Win" : m.result === "L" ? "Loss" : "Live"} · vs ${m.opponent} · ${formatWhen(m.at)}`,
    username: team.name,
    avatarUrl: team.avatarUrl,
    record: teamRecordLabel(team),
    recordLabel: "Team W–L",
    seats: 2,
    challengers: [
      { username: `[${team.tag}]`, record: teamRecordLabel(team) },
      { username: m.opponent, record: "—" },
    ],
    hostEarn:
      m.result === "W" && m.prize
        ? `Won ${m.prize}`
        : m.result === "L"
          ? "Loss"
          : undefined,
  };
}

function AboutPanel({ team }: { team: Team }) {
  return (
    <VStack align="stretch" gap="phi3" pt="phi3">
      <GhSurface variant="glass" p="phi4">
        <Text
          fontFamily="heading"
          fontWeight="extrabold"
          fontSize="sm"
          mb="phi2"
        >
          Squad identity
        </Text>
        <Text fontSize="sm" color="fg.muted" lineHeight="1.6" mb="phi3">
          {team.bio}
        </Text>
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="phi2">
          <AboutRow label="Primary game" value={team.game} />
          <AboutRow label="Console" value={team.console} />
          <AboutRow label="Tag" value={`[${team.tag}]`} />
          <AboutRow label="Roster size" value={String(team.members.length)} />
          <AboutRow label="Record" value={teamRecordLabel(team)} />
          <AboutRow
            label="Combined earnings"
            value={`${teamEarningsTotal(team).toFixed(2)} ICP`}
          />
        </SimpleGrid>
      </GhSurface>

      <GhSurface variant="muted" p="phi4">
        <Text
          fontFamily="heading"
          fontWeight="extrabold"
          fontSize="sm"
          mb="phi2"
        >
          What a great esports team page includes
        </Text>
        <VStack align="stretch" gap="2">
          {[
            "Hero cover + logo that reads at thumbnail size",
            "Clear record, streaks, and prize earnings HUD",
            "Roster cards with role, split %, and profile links",
            "Recent matches & tournaments as game cards (not tables alone)",
            "CTA strip: challenge this team · join roster · share",
            "Optional: schedule, socials, VOD highlight, sponsor strip",
            "Optional: active markets betable on this team’s next match",
          ].map((line) => (
            <HStack key={line} gap="2" align="flex-start">
              <Box
                w="1.5"
                h="1.5"
                mt="1.5"
                borderRadius="full"
                bg="brand.solid"
                flexShrink={0}
              />
              <Text fontSize="sm" color="fg.muted" lineHeight="1.5">
                {line}
              </Text>
            </HStack>
          ))}
        </VStack>
      </GhSurface>
    </VStack>
  );
}

function AboutRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack
      justify="space-between"
      p="phi2"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border.default"
      bg="blackAlpha.400"
    >
      <Text fontSize="xs" color="fg.subtle">
        {label}
      </Text>
      <Text fontFamily="heading" fontSize="sm" fontWeight="bold">
        {value}
      </Text>
    </HStack>
  );
}
