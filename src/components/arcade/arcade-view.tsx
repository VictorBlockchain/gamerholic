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
  FlaskConical,
  Gamepad2,
  Joystick,
  Plus,
  Sparkles,
  ThumbsUp,
  Timer,
  Trophy,
  Wallet,
  X,
} from "lucide-react";
import { ModeHeader } from "@/components/spectacle/mode-header";
import {
  GhBadge,
  GhButton,
  GhEmptyState,
  GhSurface,
  SectionDivider,
  ghToast,
} from "@/components/ui";
import { useSession } from "@/components/providers/session-context";
import {
  ARCADE_LIVE_UPVOTE_THRESHOLD,
  formatPlayFee,
  getPlayBalances,
  listArcadeGamesAsync,
  type ArcadeGame,
} from "@/lib/arcade/store";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { AddGamePanel } from "./add-game-panel";
import { ArcadeAiPromptSection } from "./arcade-ai-prompt-section";

type CatalogFilter = "all" | "testing" | "live";

/** Approval steps — same icon-tile language as visitor home value strip */
const APPROVAL_STRIP = [
  {
    icon: FlaskConical,
    t: "Test with real coins",
    d: "New cabinets enter testing. Insert the real play fee so scores hit the board and bugs surface before go-live.",
    tone: "attr" as const,
  },
  {
    icon: ThumbsUp,
    t: `${ARCADE_LIVE_UPVOTE_THRESHOLD} upvotes → live`,
    d: "Testers upvote cabinets that work. At 10 unique votes the game goes live — tester scores stay on the board.",
    tone: "prize" as const,
  },
  {
    icon: Sparkles,
    t: "Creator edits while testing",
    d: "While status is testing, the creator can update CSS and gameCode. Code locks after go-live.",
    tone: "brand" as const,
  },
] as const;

/**
 * High Score Arcade hub — visitor-home visual language (glass strips, kickers, cards).
 * New games enter **testing** (real coins + board); 10 upvotes → **live**.
 */
export function ArcadeView() {
  const { isLoggedIn, loginDemo, profile } = useSession();
  const [games, setGames] = useState<ArcadeGame[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [balances, setBalances] = useState({ icp: 0, gamer: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CatalogFilter>("all");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listArcadeGamesAsync();
      setGames(list);
      setBalances(getPlayBalances());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const testingCount = useMemo(
    () => games.filter((g) => g.status === "testing").length,
    [games],
  );
  const liveCount = useMemo(
    () => games.filter((g) => g.status === "live").length,
    [games],
  );
  const visible = useMemo(() => {
    if (filter === "testing") return games.filter((g) => g.status === "testing");
    if (filter === "live") return games.filter((g) => g.status === "live");
    return games;
  }, [games, filter]);

  const onAdded = (g: ArcadeGame, storedOn?: "supabase" | "local") => {
    void refresh();
    setAddOpen(false);
    setFilter("testing");
    ghToast({
      title: "Submitted for testing",
      description:
        storedOn === "supabase"
          ? `${g.title} · Supabase (css + gameCode) · ${ARCADE_LIVE_UPVOTE_THRESHOLD} upvotes to go live`
          : `${g.title} · not saved (Supabase required)`,
      type: storedOn === "supabase" ? "success" : "error",
    });
  };

  const openAddForm = () => {
    setAddOpen(true);
    requestAnimationFrame(() => {
      document
        .getElementById("add-arcade-game")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <VStack align="stretch" gap="0" className="gh-stack-phi-lg" pb="phi5">
      <ModeHeader
        mode="arcade"
        icon={Joystick}
        title="High Score Arcade"
        description="Submit Phaser 3 cabinets for community testing. Real insert coins rank on the board; 10 upvotes promote a game to live. Content is off-chain (Supabase / browser) — ICP holds fees and escrow."
        badge={
          isSupabaseConfigured()
            ? "Phaser 3 · Supabase catalog"
            : "Phaser 3 · local catalog"
        }
        action={
          <HStack gap="2" flexWrap="wrap">
            {isLoggedIn ? (
              <GhButton
                variant={addOpen ? "outline" : "attr"}
                size="lg"
                leftIcon={addOpen ? <X size={18} /> : <Plus size={18} />}
                onClick={() => {
                  if (addOpen) setAddOpen(false);
                  else openAddForm();
                }}
              >
                {addOpen ? "Hide form" : "Add Game"}
              </GhButton>
            ) : (
              <GhButton variant="primary" size="lg" onClick={loginDemo}>
                Sign in to add / play ranked
              </GhButton>
            )}
          </HStack>
        }
      />

      <AddGamePanel
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={onAdded}
      />

      {/* Approval value strip — same glass grid language as visitor home */}
      <Box>
        <Text
          fontFamily="heading"
          fontSize="2xs"
          fontWeight="bold"
          letterSpacing="0.2em"
          textTransform="uppercase"
          color="attr.fg"
          mb="phi2"
        >
          Community approval
        </Text>
        <Box
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="border.default"
          bg="bg.glass"
          backdropFilter="blur(16px)"
          overflow="hidden"
        >
          <Grid
            templateColumns={{
              base: "1fr",
              md: "repeat(3, 1fr)",
            }}
          >
            {APPROVAL_STRIP.map(({ icon: Icon, t, d, tone }, i) => (
              <Flex
                key={t}
                gap="phi2"
                p="phi3"
                align="flex-start"
                borderTopWidth={{ base: i > 0 ? "1px" : "0", md: "0" }}
                borderLeftWidth={{
                  base: "0",
                  md: i > 0 ? "1px" : "0",
                }}
                borderColor="border.default"
              >
                <Box
                  w="9"
                  h="9"
                  borderRadius="xl"
                  bg={
                    tone === "prize"
                      ? "prize.muted"
                      : tone === "brand"
                        ? "brand.muted"
                        : "attr.muted"
                  }
                  color={
                    tone === "prize"
                      ? "prize.fg"
                      : tone === "brand"
                        ? "brand.fg"
                        : "attr.fg"
                  }
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Icon size={16} strokeWidth={2} />
                </Box>
                <Box minW="0">
                  <Text
                    fontFamily="heading"
                    fontWeight="bold"
                    fontSize="sm"
                    letterSpacing="0.02em"
                  >
                    {t}
                  </Text>
                  <Text fontSize="xs" color="fg.muted" mt="1" lineHeight="1.45">
                    {d}
                  </Text>
                </Box>
              </Flex>
            ))}
          </Grid>
        </Box>
      </Box>

      {isLoggedIn ? (
        <GhSurface variant="glass" p="phi3">
          <Flex
            justify="space-between"
            align={{ base: "stretch", sm: "center" }}
            gap="phi3"
            direction={{ base: "column", sm: "row" }}
            flexWrap="wrap"
          >
            <HStack gap="2" flexWrap="wrap">
              <Box
                w="9"
                h="9"
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="brand.muted"
                color="brand.fg"
                borderWidth="1px"
                borderColor="border.brand"
              >
                <Wallet size={16} />
              </Box>
              <Box>
                <Text
                  fontSize="2xs"
                  fontWeight="bold"
                  letterSpacing="0.1em"
                  textTransform="uppercase"
                  color="fg.subtle"
                >
                  Play subaccount
                </Text>
                <Text
                  fontFamily="heading"
                  fontWeight="bold"
                  fontSize="sm"
                  mt="0.5"
                >
                  {profile?.username}
                </Text>
              </Box>
            </HStack>
            <HStack gap="2" flexWrap="wrap">
              <GhBadge tone="brand">{balances.icp.toFixed(4)} ICP</GhBadge>
              <GhBadge tone="attr">{balances.gamer} GAMER</GhBadge>
            </HStack>
          </Flex>
        </GhSurface>
      ) : null}

      <SectionDivider label="Cabinets" tone="attr" my="0" />

      {/* Section header — home “Live board” pattern */}
      <Flex
        justify="space-between"
        align="flex-end"
        gap="phi2"
        flexWrap="wrap"
      >
        <Box>
          <Text
            fontFamily="heading"
            fontSize="2xs"
            fontWeight="bold"
            letterSpacing="0.2em"
            textTransform="uppercase"
            color="attr.fg"
            mb="phi1"
          >
            Catalog
          </Text>
          <Heading
            as="h2"
            fontFamily="heading"
            fontSize={{ base: "lg", md: "xl" }}
            fontWeight="extrabold"
            letterSpacing="0.02em"
          >
            Pick a cabinet
          </Heading>
          <Text fontSize="sm" color="fg.muted" mt="phi1" maxW="32rem">
            Testing cabinets need real inserts and upvotes. Live games are open
            to everyone — board history includes playtest scores.
          </Text>
        </Box>
        <HStack gap="phi2" flexWrap="wrap">
          {(
            [
              {
                id: "all" as const,
                label: `All (${games.length})`,
                variant: "soft" as const,
              },
              {
                id: "testing" as const,
                label: `Testing (${testingCount})`,
                variant: "prize" as const,
              },
              {
                id: "live" as const,
                label: `Live (${liveCount})`,
                variant: "live" as const,
              },
            ] as const
          ).map((tab) => (
            <GhButton
              key={tab.id}
              size="sm"
              variant={filter === tab.id ? tab.variant : "soft"}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </GhButton>
          ))}
          {isLoggedIn ? (
            <GhButton
              size="sm"
              variant="attr"
              leftIcon={addOpen ? <X size={14} /> : <Plus size={14} />}
              onClick={() => {
                if (addOpen) setAddOpen(false);
                else openAddForm();
              }}
            >
              {addOpen ? "Hide form" : "Add Game"}
            </GhButton>
          ) : null}
        </HStack>
      </Flex>

      {loading ? (
        <Text fontSize="sm" color="fg.muted" py="phi4" textAlign="center">
          Loading cabinets…
        </Text>
      ) : games.length === 0 ? (
        <GhEmptyState
          icon={Gamepad2}
          title="No cabinets yet"
          description="No mock games — submit the first Phaser cabinet for testing. Real inserts rank scores; 10 upvotes makes it live."
          action={
            isLoggedIn ? (
              <GhButton variant="attr" onClick={openAddForm}>
                Add Game
              </GhButton>
            ) : (
              <GhButton variant="primary" onClick={loginDemo}>
                Sign in to submit
              </GhButton>
            )
          }
        />
      ) : visible.length === 0 ? (
        <GhEmptyState
          icon={filter === "testing" ? FlaskConical : Gamepad2}
          title={
            filter === "testing"
              ? "No cabinets in testing"
              : "No live cabinets yet"
          }
          description={
            filter === "testing"
              ? "Submit a game or switch to All / Live."
              : "Playtest cabinets and upvote — 10 votes promote a game to live."
          }
        />
      ) : (
        <Grid
          templateColumns={{
            base: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
            xl: "repeat(4, 1fr)",
          }}
          gap="phi3"
          alignItems="stretch"
          pt="2"
        >
          {visible.map((g) => (
            <ArcadeGameCard key={g.id} game={g} />
          ))}
        </Grid>
      )}

      <ArcadeAiPromptSection />
    </VStack>
  );
}

function ArcadeGameCard({ game }: { game: ArcadeGame }) {
  const fee = formatPlayFee(game.playFee, game.playFeeToken);
  const mins = Math.max(1, Math.round(game.playTimeSec / 60));
  const testing = game.status === "testing";
  const votes = game.upvotes ?? 0;

  return (
    <Link
      href={`/arcade/play/${encodeURIComponent(game.id)}/`}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <Box
        borderRadius="3xl"
        borderWidth="1px"
        borderColor={testing ? "prize.solid" : "border.default"}
        overflow="hidden"
        bg="bg.glass"
        backdropFilter="blur(16px)"
        transition="transform 0.15s, box-shadow 0.15s, border-color 0.15s"
        _hover={{
          transform: "translateY(-3px)",
          boxShadow: testing ? "glow-prize" : "glow-attr",
          borderColor: testing ? "prize.fg" : "attr.solid",
        }}
        h="100%"
        display="flex"
        flexDirection="column"
      >
        <Box position="relative" aspectRatio="16/11" bg="blackAlpha.600">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={game.imageUrl || "/art/arcade-cabinet.jpg"}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "saturate(1.1) brightness(0.85)",
            }}
          />
          <Box
            position="absolute"
            inset="0"
            bg="linear-gradient(180deg, transparent 40%, rgba(11,14,20,0.95) 100%)"
          />
          <HStack position="absolute" top="2" left="2" gap="1" flexWrap="wrap">
            {testing ? (
              <GhBadge tone="prize" pulse>
                Testing · {votes}/{ARCADE_LIVE_UPVOTE_THRESHOLD}
              </GhBadge>
            ) : (
              <GhBadge tone="live">Live</GhBadge>
            )}
            <GhBadge tone="attr">
              <Timer size={10} style={{ display: "inline", marginRight: 4 }} />
              {mins} min
            </GhBadge>
            {game.acceptedGameAssets.length > 0 ? (
              <GhBadge tone="brand">
                {game.acceptedGameAssets.length} assets
              </GhBadge>
            ) : null}
          </HStack>
          <Box position="absolute" bottom="2" left="3" right="3">
            <Heading
              as="h3"
              fontFamily="heading"
              fontSize="md"
              fontWeight="extrabold"
              letterSpacing="0.02em"
              lineClamp={2}
            >
              {game.title}
            </Heading>
          </Box>
        </Box>
        <VStack align="stretch" gap="2" p="phi3" flex="1">
          <Text fontSize="xs" color="fg.muted" lineClamp={2} lineHeight="1.45">
            {game.description}
          </Text>
          <HStack justify="space-between" mt="auto" flexWrap="wrap" gap="2">
            <Box>
              <Text
                fontSize="2xs"
                color="fg.subtle"
                textTransform="uppercase"
                letterSpacing="0.08em"
                fontWeight="bold"
              >
                Insert
              </Text>
              <Text
                fontFamily="heading"
                fontWeight="extrabold"
                fontSize="sm"
                color="prize.fg"
              >
                {fee}
              </Text>
            </Box>
            <VStack align="flex-end" gap="0">
              <HStack gap="1">
                <Trophy size={12} color="var(--gh-colors-attr-fg)" />
                <Text fontSize="xs" color="fg.muted">
                  {game.highScore > 0 ? game.highScore.toLocaleString() : "—"}
                </Text>
              </HStack>
              {testing ? (
                <HStack gap="1">
                  <ThumbsUp size={10} color="var(--gh-colors-prize-fg)" />
                  <Text fontSize="2xs" color="prize.fg" fontWeight="bold">
                    {votes}/{ARCADE_LIVE_UPVOTE_THRESHOLD} upvotes
                  </Text>
                </HStack>
              ) : (
                <Text fontSize="2xs" color="fg.subtle">
                  Top {game.payoutTopN ?? 3} payout
                </Text>
              )}
            </VStack>
          </HStack>
          <GhButton
            variant={testing ? "prize" : "attr"}
            size="sm"
            leftIcon={
              testing ? <FlaskConical size={14} /> : <Joystick size={14} />
            }
          >
            {testing ? "Playtest" : "Play"}
          </GhButton>
        </VStack>
      </Box>
    </Link>
  );
}
