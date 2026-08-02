"use client";

import { useState } from "react";
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
  Check,
  ImageIcon,
  Plus,
  Shield,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import {
  GhAvatar,
  GhBadge,
  GhButton,
  GhEmptyState,
  GhField,
  GhInput,
  GhSurface,
  GhTextarea,
  ghToast,
} from "@/components/ui";
import { DEMO_GAMES } from "@/lib/chat/demo-data";
import {
  CONSOLES,
  DEMO_TEAMS,
  TEAM_AVATAR_OPTIONS,
  TEAM_COVER_OPTIONS,
  fileToObjectUrl,
  teamRecordLabel,
  totalSplit,
  type ConsoleId,
  type Team,
  type TeamMember,
} from "@/lib/teams";

/**
 * Teams hub — list, create (cover/avatar/console), manage invite + win split.
 */
export function TeamsHub() {
  const [teams, setTeams] = useState<Team[]>(DEMO_TEAMS);
  const [createOpen, setCreateOpen] = useState(false);
  const [manageId, setManageId] = useState<string | null>(DEMO_TEAMS[0]?.id ?? null);

  // Create form
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [game, setGame] = useState<string>(DEMO_GAMES[0]);
  const [consoleId, setConsoleId] = useState<ConsoleId>("PC");
  const [bio, setBio] = useState("");
  const [coverUrl, setCoverUrl] = useState<string>(TEAM_COVER_OPTIONS[0].url);
  const [avatarUrl, setAvatarUrl] = useState<string>(TEAM_AVATAR_OPTIONS[0].url);

  // Invite
  const [invite, setInvite] = useState("");
  const [inviteSplit, setInviteSplit] = useState("20");

  const managing = teams.find((t) => t.id === manageId) ?? null;

  const createTeam = () => {
    if (!name.trim() || !tag.trim()) {
      ghToast({ title: "Name and tag required", type: "error" });
      return;
    }
    const t: Team = {
      id: `tm-${Date.now()}`,
      name: name.trim(),
      tag: tag.trim().toUpperCase().slice(0, 5),
      game,
      console: consoleId,
      bio: bio.trim() || "New squad. Ready to compete.",
      coverUrl,
      avatarUrl,
      wins: 0,
      losses: 0,
      winStreak: 0,
      lossStreak: 0,
      bestWinStreak: 0,
      createdAt: new Date().toISOString(),
      members: [
        {
          id: "m-you",
          username: "you",
          role: "captain",
          winSplitPct: 100,
          earningsIcp: 0,
          record: "0–0",
        },
      ],
    };
    setTeams((prev) => [t, ...prev]);
    setManageId(t.id);
    setCreateOpen(false);
    setName("");
    setTag("");
    setBio("");
    ghToast({
      title: "Team created",
      description: `${t.name} [${t.tag}] · ${t.console}`,
      type: "success",
    });
  };

  const inviteMember = () => {
    if (!managing || !invite.trim()) return;
    const split = parseFloat(inviteSplit);
    if (!Number.isFinite(split) || split < 0 || split > 100) {
      ghToast({ title: "Win split must be 0–100%", type: "error" });
      return;
    }
    const others = managing.members.reduce((s, m) => s + m.winSplitPct, 0);
    if (others + split > 100) {
      ghToast({
        title: "Split exceeds 100%",
        description: `Roster already at ${others}%. Free room: ${100 - others}%.`,
        type: "error",
      });
      return;
    }
    const member: TeamMember = {
      id: `m-${Date.now()}`,
      username: invite.trim(),
      role: "member",
      winSplitPct: split,
      earningsIcp: 0,
      record: "0–0",
    };
    setTeams((prev) =>
      prev.map((t) =>
        t.id === managing.id
          ? { ...t, members: [...t.members, member] }
          : t,
      ),
    );
    setInvite("");
    ghToast({
      title: "Invite sent",
      description: `${member.username} · ${split}% of winnings`,
      type: "info",
    });
  };

  const removeMember = (memberId: string) => {
    if (!managing) return;
    setTeams((prev) =>
      prev.map((t) =>
        t.id === managing.id
          ? {
              ...t,
              members: t.members.filter(
                (m) => m.id !== memberId || m.role === "captain",
              ),
            }
          : t,
      ),
    );
  };

  const onUpload = (
    file: File | null,
    kind: "cover" | "avatar",
  ) => {
    const url = fileToObjectUrl(file);
    if (!url) return;
    if (kind === "cover") setCoverUrl(url);
    else setAvatarUrl(url);
    ghToast({
      title: `${kind === "cover" ? "Cover" : "Logo"} uploaded`,
      description: "Demo preview — media canister next.",
      type: "success",
    });
  };

  return (
    <VStack align="stretch" gap={{ base: "phi4", md: "phi5" }} pb="phi4">
      {/* Hero */}
      <Box
        borderRadius="3xl"
        borderWidth="1px"
        borderColor="border.brand"
        overflow="hidden"
        position="relative"
        boxShadow="glow"
      >
        <Box
          position="absolute"
          inset="0"
          bg="linear-gradient(115deg, rgba(163,255,61,0.12) 0%, rgba(13,11,26,0.94) 55%, rgba(139,92,246,0.12) 100%)"
        />
        <Flex
          position="relative"
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          gap="phi3"
          p={{ base: "phi4", md: "phi5" }}
          align={{ md: "center" }}
        >
          <Box>
            <GhBadge tone="brand" mb="phi2">
              <Users size={11} /> Squads
            </GhBadge>
            <Heading
              as="h1"
              fontFamily="heading"
              fontSize={{ base: "2xl", md: "3xl" }}
              fontWeight="extrabold"
              letterSpacing="0.03em"
              textTransform="uppercase"
            >
              Teams
            </Heading>
            <Text
              fontSize="sm"
              color="fg.muted"
              mt="phi2"
              maxW="30rem"
              lineHeight="1.55"
            >
              Build a roster, set win splits, pick cover & logo, then enter
              team challenges and tournaments from the host booth or quick
              challenge.
            </Text>
          </Box>
          <HStack gap="phi2" flexWrap="wrap">
            <GhButton
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={() => setCreateOpen((v) => !v)}
            >
              {createOpen ? "Hide create" : "Create team"}
            </GhButton>
            <Link href="/create?type=tournament">
              <GhButton variant="outline">Host booth</GhButton>
            </Link>
          </HStack>
        </Flex>
      </Box>

      {/* Create team */}
      {createOpen ? (
        <GhSurface variant="brand" p="phi4">
          <Text
            fontFamily="heading"
            fontWeight="extrabold"
            fontSize="sm"
            mb="phi3"
          >
            New team
          </Text>
          <VStack align="stretch" gap="phi3">
            <HStack gap="phi2" flexWrap="wrap" align="flex-start">
              <Box flex="1" minW="10rem">
                <GhField label="Team name" required>
                  <GhInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Neon Apex"
                  />
                </GhField>
              </Box>
              <Box flex="1" minW="6rem">
                <GhField label="Tag" required helperText="Max 5">
                  <GhInput
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="NEON"
                    maxLength={5}
                  />
                </GhField>
              </Box>
              <Box flex="1" minW="8rem">
                <GhField label="Console" required>
                  <select
                    value={consoleId}
                    onChange={(e) =>
                      setConsoleId(e.target.value as ConsoleId)
                    }
                    style={selectStyle}
                  >
                    {CONSOLES.map((c) => (
                      <option key={c} value={c} style={{ background: "#16132a" }}>
                        {c}
                      </option>
                    ))}
                  </select>
                </GhField>
              </Box>
            </HStack>
            <GhField label="Primary game">
              <select
                value={game}
                onChange={(e) => setGame(e.target.value)}
                style={selectStyle}
              >
                {DEMO_GAMES.map((g) => (
                  <option key={g} value={g} style={{ background: "#16132a" }}>
                    {g}
                  </option>
                ))}
              </select>
            </GhField>
            <GhField label="Bio">
              <GhTextarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Squad identity, region, schedule…"
              />
            </GhField>

            {/* Cover */}
            <Box>
              <HStack gap="2" mb="phi2">
                <ImageIcon size={14} color="var(--gh-colors-prize-fg)" />
                <Text
                  fontFamily="heading"
                  fontSize="2xs"
                  fontWeight="bold"
                  letterSpacing="0.1em"
                  textTransform="uppercase"
                  color="fg.subtle"
                >
                  Team cover
                </Text>
              </HStack>
              <Grid
                templateColumns="repeat(auto-fill, minmax(5.5rem, 1fr))"
                gap="2"
                mb="2"
              >
                {TEAM_COVER_OPTIONS.map((c) => (
                  <ImagePick
                    key={c.id}
                    url={c.url}
                    active={coverUrl === c.url}
                    onClick={() => setCoverUrl(c.url)}
                  />
                ))}
              </Grid>
              <GhField label="Or upload cover">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    onUpload(e.target.files?.[0] ?? null, "cover")
                  }
                  style={{ fontSize: "0.75rem", color: "#a8a4bf" }}
                />
              </GhField>
            </Box>

            {/* Avatar / logo */}
            <Box>
              <HStack gap="2" mb="phi2">
                <Users size={14} color="var(--gh-colors-brand-fg)" />
                <Text
                  fontFamily="heading"
                  fontSize="2xs"
                  fontWeight="bold"
                  letterSpacing="0.1em"
                  textTransform="uppercase"
                  color="fg.subtle"
                >
                  Team logo / profile image
                </Text>
              </HStack>
              <HStack gap="2" mb="2" flexWrap="wrap">
                {TEAM_AVATAR_OPTIONS.map((c) => (
                  <Box
                    key={c.id}
                    as="button"
                    onClick={() => setAvatarUrl(c.url)}
                    w="14"
                    h="14"
                    borderRadius="xl"
                    overflow="hidden"
                    borderWidth="2px"
                    borderColor={
                      avatarUrl === c.url ? "border.brand" : "border.default"
                    }
                    cursor="pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.url}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                ))}
              </HStack>
              <GhField label="Or upload logo">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    onUpload(e.target.files?.[0] ?? null, "avatar")
                  }
                  style={{ fontSize: "0.75rem", color: "#a8a4bf" }}
                />
              </GhField>
            </Box>

            <HStack gap="phi2">
              <GhButton
                variant="primary"
                onClick={createTeam}
                leftIcon={<Plus size={16} />}
              >
                Create team
              </GhButton>
              <GhButton variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </GhButton>
            </HStack>
          </VStack>
        </GhSurface>
      ) : null}

      <Grid templateColumns={{ base: "1fr", lg: "1fr 1.1fr" }} gap="phi4">
        {/* Your teams */}
        <Box>
          <Text
            fontFamily="heading"
            fontWeight="extrabold"
            fontSize="md"
            mb="phi3"
          >
            Your teams
          </Text>
          {teams.length === 0 ? (
            <GhEmptyState
              icon={Users}
              title="No teams yet"
              description="Create a squad to enter team challenges and tournaments."
              action={
                <GhButton
                  size="sm"
                  variant="primary"
                  onClick={() => setCreateOpen(true)}
                >
                  Create team
                </GhButton>
              }
            />
          ) : (
            <VStack align="stretch" gap="phi2">
              {teams.map((t) => {
                const active = t.id === manageId;
                return (
                  <GhSurface
                    key={t.id}
                    variant={active ? "brand" : "glass"}
                    p="0"
                    overflow="hidden"
                    borderColor={active ? "border.brand" : undefined}
                  >
                    <Box position="relative" h="4rem">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={t.coverUrl}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          filter: "brightness(0.45)",
                        }}
                      />
                    </Box>
                    <Box p="phi3">
                      <HStack gap="phi2" align="center" mb="phi2">
                        <Box
                          w="12"
                          h="12"
                          borderRadius="xl"
                          overflow="hidden"
                          borderWidth="2px"
                          borderColor="border.brand"
                          mt="-2rem"
                          bg="bg.elevated"
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
                        <Box minW="0" flex="1" pt="1">
                          <HStack gap="2" flexWrap="wrap">
                            <GhBadge tone="brand">[{t.tag}]</GhBadge>
                            <GhBadge tone="live">{t.console}</GhBadge>
                          </HStack>
                          <Text
                            fontFamily="heading"
                            fontWeight="extrabold"
                            fontSize="sm"
                            lineClamp={1}
                          >
                            {t.name}
                          </Text>
                          <Text fontSize="2xs" color="fg.muted">
                            {t.game} · {teamRecordLabel(t)} ·{" "}
                            {t.members.length} members
                          </Text>
                        </Box>
                      </HStack>
                      <HStack gap="2" flexWrap="wrap">
                        <Link href={`/teams/${t.id}`}>
                          <GhButton
                            size="sm"
                            variant="primary"
                            rightIcon={<ArrowRight size={14} />}
                          >
                            View team
                          </GhButton>
                        </Link>
                        <GhButton
                          size="sm"
                          variant={active ? "soft" : "outline"}
                          onClick={() => setManageId(t.id)}
                        >
                          {active ? "Managing" : "Manage"}
                        </GhButton>
                      </HStack>
                    </Box>
                  </GhSurface>
                );
              })}
            </VStack>
          )}
        </Box>

        {/* Manage roster */}
        <Box>
          <Text
            fontFamily="heading"
            fontWeight="extrabold"
            fontSize="md"
            mb="phi3"
          >
            Manage roster
          </Text>
          {!managing ? (
            <GhEmptyState
              icon={Shield}
              title="Select a team"
              description="Pick a team to invite members and set win splits."
            />
          ) : (
            <GhSurface variant="elevated" p="phi4">
              <HStack
                justify="space-between"
                mb="phi3"
                flexWrap="wrap"
                gap="2"
              >
                <Box>
                  <Text fontFamily="heading" fontWeight="extrabold">
                    [{managing.tag}] {managing.name}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {managing.game} · {managing.console} · splits total{" "}
                    {totalSplit(managing.members)}%
                  </Text>
                </Box>
                <Link href={`/teams/${managing.id}`}>
                  <GhButton size="sm" variant="outline" rightIcon={<ArrowRight size={14} />}>
                    Full page
                  </GhButton>
                </Link>
              </HStack>

              <VStack align="stretch" gap="2" mb="phi4">
                {managing.members.map((m) => (
                  <HStack
                    key={m.id}
                    justify="space-between"
                    p="phi2"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="border.default"
                    bg="blackAlpha.400"
                    align="center"
                    gap="phi2"
                  >
                    <HStack gap="phi2" minW="0">
                      <GhAvatar name={m.username} size="sm" />
                      <Box minW="0">
                        <HStack gap="1" flexWrap="wrap">
                          <Text
                            fontFamily="heading"
                            fontSize="sm"
                            fontWeight="bold"
                          >
                            {m.username}
                          </Text>
                          {m.role === "captain" ? (
                            <GhBadge tone="prize">Captain</GhBadge>
                          ) : null}
                        </HStack>
                        <Text fontSize="2xs" color="fg.subtle">
                          {m.winSplitPct}% winnings · {m.earningsIcp.toFixed(1)}{" "}
                          ICP earned
                        </Text>
                      </Box>
                    </HStack>
                    <HStack gap="1" flexShrink={0}>
                      <Link href={`/profile?u=${encodeURIComponent(m.username)}`}>
                        <GhButton size="sm" variant="ghost">
                          Profile
                        </GhButton>
                      </Link>
                      {m.role !== "captain" ? (
                        <GhButton
                          size="sm"
                          variant="ghost"
                          leftIcon={<UserMinus size={14} />}
                          onClick={() => removeMember(m.id)}
                        >
                          Remove
                        </GhButton>
                      ) : null}
                    </HStack>
                  </HStack>
                ))}
              </VStack>

              <VStack align="stretch" gap="phi2">
                <GhField
                  label="Invite player"
                  helperText="Username or principal"
                >
                  <GhInput
                    value={invite}
                    onChange={(e) => setInvite(e.target.value)}
                    placeholder="frag_queen"
                  />
                </GhField>
                <GhField
                  label="Win split (%)"
                  helperText="Share of team prize pool for this member"
                >
                  <GhInput
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={inviteSplit}
                    onChange={(e) => setInviteSplit(e.target.value)}
                    tone="prize"
                  />
                </GhField>
                <GhButton
                  variant="primary"
                  leftIcon={<UserPlus size={14} />}
                  onClick={inviteMember}
                >
                  Invite with split
                </GhButton>
              </VStack>
            </GhSurface>
          )}
        </Box>
      </Grid>
    </VStack>
  );
}

function ImagePick({
  url,
  active,
  onClick,
}: {
  url: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      as="button"
      onClick={onClick}
      borderRadius="xl"
      overflow="hidden"
      borderWidth="2px"
      borderColor={active ? "border.brand" : "border.default"}
      position="relative"
      aspectRatio="16/10"
      cursor="pointer"
      opacity={active ? 1 : 0.75}
      _hover={{ opacity: 1 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {active ? (
        <Box
          position="absolute"
          inset="0"
          bg="rgba(163,255,61,0.2)"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Check size={14} color="#a3ff3d" />
        </Box>
      ) : null}
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
