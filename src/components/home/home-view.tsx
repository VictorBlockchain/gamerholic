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
  ArrowRight,
  CheckCircle2,
  Crosshair,
  DollarSign,
  Eye,
  Gamepad2,
  Joystick,
  Shield,
  Sparkles,
  Swords,
  Ticket,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { HeroSlider } from "@/components/home/hero-slider";
import { FeaturePanel } from "@/components/home/feature-panel";
import { FreeTournamentVault } from "@/components/home/free-tournament-vault";
import { BetableMarketsSection } from "@/components/home/betable-markets-section";
import { AttributesCurrencyRow } from "@/components/home/attributes-currency-row";
import { GhBadge, GhButton, GhSurface, SectionDivider } from "@/components/ui";
import { MatchCard } from "@/components/cards/match-card";
import { LiveTicker } from "@/components/spectacle/live-ticker";
import { CountUp } from "@/components/spectacle/count-up";
import { ART } from "@/lib/art";

/** Dexsta-style value strip — get the product in 5 seconds */
const VALUE_STRIP = [
  {
    icon: DollarSign,
    t: "Hosts earn ICP",
    d: "Tournament fees & room takes when events settle.",
  },
  {
    icon: Eye,
    t: "Monitor challenges · earn $$",
    d: "Watch matches, report scores, settle disputes — get paid.",
  },
  {
    icon: Joystick,
    t: "Arcade bank",
    d: "Post a score. Get paid when challengers fail.",
  },
  {
    icon: Crosshair,
    t: "XFTs that fight",
    d: "Attribute tokens turn Dexsta collectibles into battlers.",
  },
  {
    icon: Swords,
    t: "Heads-up stakes",
    d: "1v1 escrow matches — deposit, play, claim.",
  },
  {
    icon: Shield,
    t: "Non-custodial",
    d: "ICP on Internet Computer. Wallet is your ID.",
  },
] as const;

/** Three “why this is different” pillars — Dexsta home pattern */
const PRODUCT_PILLARS = [
  {
    id: "host",
    icon: Trophy,
    kicker: "Operator economy",
    title: "The house can be you",
    body: "Most platforms extract. Gamerholic pays the person who runs the night — host fee bps on brackets, room takes on group pots.",
    points: ["Host fee on finalize", "Room take on settle", "Policy-bounded cuts"],
    href: "/host",
    cta: "Host hub",
    tone: "prize" as const,
    image: ART.teamWin,
  },
  {
    id: "arcade",
    icon: Joystick,
    kicker: "Skill as product",
    title: "High scores print money",
    body: "Your grind is content. Challengers pay a try fee. Failures stack into your bank. Beat the crown — take the throne.",
    points: ["Fails × fee = bank", "Defend or dethrone", "Any game mode"],
    href: "/arcade",
    cta: "Arcade",
    tone: "attr" as const,
    image: ART.arcadeFriends,
  },
  {
    id: "battle",
    icon: Sparkles,
    kicker: "Dexsta bridge",
    title: "Collectibles with stats",
    body: "Power, Speed, Attack, Defense and more equip onto Dexsta XFTs. Same art, battle loadouts, optional stakes.",
    points: ["Attribute tokens", "Loadout board", "VS radar duels"],
    href: "/battle",
    cta: "Battle",
    tone: "brand" as const,
    image: ART.battle,
  },
] as const;

const STEPS = [
  {
    n: "01",
    t: "Connect wallet",
    d: "Internet Identity — your principal is your gamer ID.",
  },
  {
    n: "02",
    t: "Host or play",
    d: "Spin a tournament / room, post a high score, or enter a 1v1.",
  },
  {
    n: "03",
    t: "Settle on-chain",
    d: "Escrow releases prizes, host cuts, and arcade banks in ICP.",
  },
  {
    n: "04",
    t: "Equip & battle",
    d: "Load Attributes onto Dexsta XFTs and enter the arena.",
  },
] as const;

const FEED = [
  {
    kind: "tournament" as const,
    title: "Friday Night Bracket",
    game: "Street Fighter 6",
    console: "PS5",
    entryFee: "0.5 ICP",
    prizePot: "14 ICP",
    status: "live" as const,
    players: "24/32",
    meta: "Single elim",
    hostEarn: "2.5% · ~3 ICP est.",
    username: "ace_host",
    record: "18–3",
    recordLabel: "Host W–L",
    seats: 2,
    challengers: [
      { username: "ace_host", record: "18–3" },
      { username: "ryu_main", record: "11–6" },
    ],
    // Esports prediction market on this bracket
    betable: true,
    market: {
      id: "sf6-friday-night",
      category: "esports" as const,
      label: "Winner · SF6 Fri",
    },
  },
  {
    kind: "room" as const,
    title: "Warzone customs",
    game: "Call of Duty",
    console: "PC",
    entryFee: "1.5 ICP",
    prizePot: "12 ICP",
    status: "open" as const,
    players: "2/4",
    meta: "Squads",
    hostEarn: "Room cut 5%",
    username: "lobby_king",
    record: "9–2",
    recordLabel: "Room W–L",
    seats: 4,
    challengers: [
      { username: "lobby_king", record: "9–2" },
      { username: "drop_shot", record: "4–1" },
    ],
  },
  {
    kind: "arcade" as const,
    title: "Neon Track · WR 01:12.4",
    game: "Time Attack",
    console: "PC",
    entryFee: "0.15 ICP / try",
    prizePot: "2.1 ICP bank",
    status: "open" as const,
    meta: "14 fails banked",
    username: "neon_crown",
    record: "41–0",
    recordLabel: "Defenses",
    seats: 2,
    challengers: [{ username: "neon_crown", record: "41–0" }],
  },
  {
    kind: "challenge" as const,
    title: "Ranked 1v1 — Apex",
    game: "Apex Legends",
    console: "PC",
    entryFee: "2.5 ICP",
    prizePot: "4.75 ICP",
    status: "open" as const,
    players: "1/2",
    username: "frag_queen",
    record: "48–21",
    recordLabel: "Apex W–L",
    seats: 2,
    challengers: [{ username: "frag_queen", record: "48–21" }],
    betable: true,
    market: {
      id: "apex-frag-queen-1v1",
      category: "esports" as const,
      label: "Moneyline · Apex",
    },
  },
  {
    kind: "challenge" as const,
    title: "Bo3 Tekken — Money Match",
    game: "Tekken 8",
    console: "PS5",
    entryFee: "3 ICP",
    prizePot: "5.7 ICP",
    status: "open" as const,
    players: "0/2",
    username: "iron_fist",
    record: "22–9",
    recordLabel: "Tekken W–L",
    seats: 2,
    challengers: [],
  },
  {
    kind: "tournament" as const,
    title: "Sunday Smash Invitational",
    game: "Smash Ultimate",
    console: "Switch",
    entryFee: "Free",
    prizePot: "8 ICP vault",
    status: "open" as const,
    players: "8/16",
    meta: "Double elim",
    hostEarn: "Vault sponsored",
    username: "smash_ops",
    record: "6–1",
    recordLabel: "Host W–L",
    seats: 2,
    challengers: [{ username: "smash_ops", record: "6–1" }],
    betable: true,
    market: {
      id: "smash-sunday-invite",
      category: "esports" as const,
      label: "Outright · Smash",
    },
  },
] as const;

const FEED_CHALLENGES = FEED.filter((m) => m.kind === "challenge");
const FEED_TOURNAMENTS = FEED.filter((m) => m.kind === "tournament");
const FEED_OTHER = FEED.filter(
  (m) => m.kind !== "challenge" && m.kind !== "tournament",
);

/**
 * Logged-out home — Dexsta-inspired structure:
 * hero slider → value strip → why pillars → deep dives → how it works → live → CTA
 */
export function HomeView() {
  return (
    <VStack align="stretch" gap="0" className="gh-stack-phi-lg">
      {/* ── Hero product slider ── */}
      <Box className="gh-home-section">
        <HeroSlider />
      </Box>

      {/* ── Value strip (immediate differentiators) ── */}
      <Box
        className="gh-home-section"
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
            sm: "1fr 1fr",
            lg: "repeat(3, 1fr)",
            xl: "repeat(6, 1fr)",
          }}
        >
          {VALUE_STRIP.map(({ icon: Icon, t, d }, i) => (
            <Flex
              key={t}
              gap="phi2"
              p="phi3"
              align="flex-start"
              borderTopWidth={{ base: i > 0 ? "1px" : "0", sm: "0" }}
              borderLeftWidth={{
                base: "0",
                sm: i % 2 === 1 ? "1px" : "0",
                lg: i > 0 ? "1px" : "0",
              }}
              borderColor="border.default"
            >
              <Box
                w="9"
                h="9"
                borderRadius="xl"
                bg="brand.muted"
                color="brand.fg"
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

      <Box className="gh-home-section">
        <LiveTicker />
      </Box>

      {/* ── Free Tournament + Community Vault (before Why) ── */}
      <Box id="free-tournaments" className="gh-home-section" scrollMarginTop="6rem">
        <FreeTournamentVault />
      </Box>

      {/* ── Why Gamerholic (3 pillars) ── */}
      <Box id="why" className="gh-home-section" scrollMarginTop="6rem">
        <Text
          fontFamily="heading"
          fontSize="2xs"
          fontWeight="bold"
          letterSpacing="0.2em"
          textTransform="uppercase"
          color="brand.fg"
          mb="phi2"
        >
          Why Gamerholic
        </Text>
        <Heading
          as="h2"
          fontFamily="heading"
          fontSize={{ base: "xl", md: "2xl", lg: "3xl" }}
          fontWeight="extrabold"
          letterSpacing="0.02em"
          lineHeight="1.15"
          maxW="36rem"
          mb="phi2"
        >
          Not another stake site.{" "}
          <Text as="span" color="fg.muted" fontWeight="bold">
            An operator economy.
          </Text>
        </Heading>
        <Text
          color="fg.muted"
          fontSize="md"
          maxW="34rem"
          lineHeight="1.65"
          mb="phi4"
        >
          Three innovations in one shell — host-to-earn arenas, skill-as-content
          arcade, and Attribute-powered XFT battles on Internet Computer.
        </Text>

        <Grid
          templateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }}
          gap="phi3"
          alignItems="stretch"
        >
          {PRODUCT_PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <Box
                key={p.id}
                borderRadius="3xl"
                overflow="hidden"
                borderWidth="1px"
                borderColor="border.default"
                bg="bg.glass"
                backdropFilter="blur(16px)"
                display="flex"
                flexDirection="column"
                transition="transform 0.15s, box-shadow 0.15s"
                _hover={{
                  transform: "translateY(-3px)",
                  boxShadow:
                    p.tone === "prize"
                      ? "glow-prize"
                      : p.tone === "attr"
                        ? "glow-attr"
                        : "glow",
                }}
              >
                <Box position="relative" h="10rem" overflow="hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <Box
                    position="absolute"
                    inset="0"
                    bg="linear-gradient(180deg, transparent 30%, rgba(11,14,20,0.95) 100%)"
                  />
                  <Box
                    position="absolute"
                    left="phi3"
                    bottom="phi3"
                    w="10"
                    h="10"
                    borderRadius="xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg={
                      p.tone === "prize"
                        ? "prize.muted"
                        : p.tone === "attr"
                          ? "attr.muted"
                          : "brand.muted"
                    }
                    color={
                      p.tone === "prize"
                        ? "prize.fg"
                        : p.tone === "attr"
                          ? "attr.fg"
                          : "brand.fg"
                    }
                    borderWidth="1px"
                    borderColor="border.default"
                  >
                    <Icon size={20} />
                  </Box>
                </Box>
                <VStack align="flex-start" gap="phi2" p="phi3" flex="1">
                  <Text
                    fontFamily="heading"
                    fontSize="2xs"
                    fontWeight="bold"
                    letterSpacing="0.16em"
                    textTransform="uppercase"
                    color="fg.subtle"
                  >
                    {p.kicker}
                  </Text>
                  <Text
                    fontFamily="heading"
                    fontWeight="extrabold"
                    fontSize="lg"
                    letterSpacing="0.02em"
                  >
                    {p.title}
                  </Text>
                  <Text fontSize="sm" color="fg.muted" lineHeight="1.55" flex="1">
                    {p.body}
                  </Text>
                  <VStack align="stretch" gap="1.5" w="100%">
                    {p.points.map((pt) => (
                      <HStack key={pt} gap="2" align="flex-start">
                        <Box
                          color={
                            p.tone === "prize"
                              ? "prize.fg"
                              : p.tone === "attr"
                                ? "attr.fg"
                                : "brand.fg"
                          }
                          mt="0.5"
                          flexShrink={0}
                        >
                          <CheckCircle2 size={14} />
                        </Box>
                        <Text fontSize="xs" color="fg.default">
                          {pt}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                  <Link href={p.href}>
                    <HStack
                      gap="1"
                      color={
                        p.tone === "prize"
                          ? "prize.fg"
                          : p.tone === "attr"
                            ? "attr.fg"
                            : "brand.fg"
                      }
                      fontFamily="heading"
                      fontSize="sm"
                      fontWeight="bold"
                      pt="phi1"
                    >
                      <Text>{p.cta}</Text>
                      <ArrowRight size={14} />
                    </HStack>
                  </Link>
                </VStack>
              </Box>
            );
          })}
        </Grid>
      </Box>

      {/* ── Art intro strip (Dexsta “art first”) ── */}
      <Box className="gh-home-section">
        <Flex
          justify="space-between"
          align="flex-end"
          mb="phi3"
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
              color="brand.fg"
              mb="phi1"
            >
              The vibe
            </Text>
            <Heading
              as="h2"
              fontFamily="heading"
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="extrabold"
              letterSpacing="0.03em"
            >
              Competitive. Social. On-chain.
            </Heading>
          </Box>
          <Link href="/challenges">
            <GhButton variant="soft" size="sm" rightIcon={<ArrowRight size={14} />}>
              Enter arena
            </GhButton>
          </Link>
        </Flex>
        <Grid
          templateColumns={{ base: "1fr 1fr", md: "repeat(4, 1fr)" }}
          gap="phi3"
        >
          {[
            { src: ART.headsUp, cap: "Heads-up", href: "/challenges" },
            { src: ART.teamHighfive, cap: "Teams", href: "/teams" },
            { src: ART.arcadeFriends, cap: "Arcade", href: "/arcade" },
            { src: ART.teamWin, cap: "Tournaments", href: "/tournaments" },
          ].map((c) => (
            <Link key={c.cap} href={c.href} style={{ textDecoration: "none" }}>
              <Box
                borderRadius="2xl"
                overflow="hidden"
                borderWidth="1px"
                borderColor="border.default"
                position="relative"
                aspectRatio="4/5"
                transition="transform 0.15s"
                _hover={{ transform: "translateY(-3px)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.src}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <Box
                  position="absolute"
                  inset="0"
                  bg="linear-gradient(180deg, transparent 50%, rgba(7,9,13,0.9) 100%)"
                />
                <Text
                  position="absolute"
                  bottom="3"
                  left="3"
                  right="3"
                  fontFamily="heading"
                  fontWeight="bold"
                  fontSize="sm"
                  letterSpacing="0.04em"
                >
                  {c.cap}
                </Text>
              </Box>
            </Link>
          ))}
        </Grid>
      </Box>

      <Box className="gh-home-section" py="phi2">
        <SectionDivider label="Deep dive" tone="prize" my="0" />
      </Box>

      {/* ── Host deep ── */}
      <Box className="gh-home-section">
        <FeaturePanel
          image={ART.teamWin}
          tone="prize"
          kicker="01 · Host-to-earn"
          title="Run the night. Take your cut."
          sell="Community operators are first-class. Set host fee bps, fill brackets and rooms, settle on ICP — your earnings are on-chain policy."
          points={[
            "Tournament host fee on finalize",
            "Room take when group pots settle",
            "Director tools: pots, brackets, SLA",
            "Non-custodial — you claim, we don't hold bags",
          ]}
          href="/host"
          cta="Open host booth"
          icon={Trophy}
        />
      </Box>

      {/* ── Multi Tournament Pass ── */}
      <Box className="gh-home-section">
        <FeaturePanel
          image={ART.teamHighfive}
          tone="attr"
          kicker="02 · Multi Tournament Pass"
          title="One NFT. Ten free brackets a month."
          sell="The Multi Tournament Pass is an XFT that unlocks up to 10 free tournament entries every month — priority seats in community-vault funded events, plus member-only free nights."
          points={[
            "Up to 10 free tournament entries / month",
            "Priority allocation from Free Tournament Fund",
            "Tradeable XFT — transfer or list anytime",
            "Stacks with paid hosts when you want bigger pots",
          ]}
          href="/create?type=tournament"
          cta="Get the pass"
          icon={Ticket}
          reverse
        />
      </Box>

      {/* ── Monitor / referee earn ── */}
      <Box className="gh-home-section">
        <FeaturePanel
          image={ART.headsUp}
          tone="live"
          kicker="03 · Monitor challenges · earn $$"
          title="Watch the match. Cash the call."
          sell="Monitors (referees) watch heads-up and bracket matches, report the score, and settle disputes when players disagree — earn a fee for fair outcomes. Same role as legacy Gamerholic BaseReferee, first-class on the dashboard."
          points={[
            "Assigned to live challenges as a trusted observer",
            "Report scores when both players finish",
            "Settle disputes with evidence — earn monitor fees",
            "Build reputation · get more high-stakes assignments",
          ]}
          href="/moderator"
          cta="Become a monitor"
          icon={Eye}
        />
      </Box>

      {/* ── Monetize AI games via Arcade API ── */}
      <Box className="gh-home-section">
        <FeaturePanel
          image={ART.arcadeFriends}
          tone="live"
          kicker="04 · High Score Arcade API"
          title="Monetize your AI-created games"
          sell="Ship a mini-game with AI, plug the High Score Arcade API, and turn every failed attempt into revenue. Your scoreboard is a product — try fees, fail bank, crown transfers."
          points={[
            "Drop-in Arcade API for score submit + try fee",
            "Players pay to challenge your AI game boards",
            "Fails bank to the board owner automatically",
            "Perfect for generative games & indie tools",
          ]}
          href="/arcade"
          cta="Explore Arcade API"
          icon={Joystick}
        />
      </Box>

      <Box className="gh-home-section">
        <FeaturePanel
          image={ART.headsUp}
          tone="brand"
          kicker="05 · Heads-up"
          title="Money matches. Tonight."
          sell="1v1 escrow: deposit, play, report, claim. For a stake tonight — not next quarter's roadmap."
          points={[
            "Deterministic escrow subaccounts",
            "Mutual cancel & report winner",
            "ICP / ICRC stakes",
            "Wallet = gamer ID",
          ]}
          href="/challenges"
          cta="Find a match"
          icon={Swords}
          reverse
        />
      </Box>

      {/* ── How it works ── */}
      <Box className="gh-home-section">
        <Text
          fontFamily="heading"
          fontSize="2xs"
          fontWeight="bold"
          letterSpacing="0.2em"
          textTransform="uppercase"
          color="brand.fg"
          mb="phi2"
        >
          How it works
        </Text>
        <Heading
          as="h2"
          fontFamily="heading"
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight="extrabold"
          mb="phi4"
          letterSpacing="0.02em"
        >
          Four steps into the arena
        </Heading>
        <Grid
          templateColumns={{ base: "1fr 1fr", lg: "repeat(4, 1fr)" }}
          gap="phi3"
        >
          {STEPS.map((s, i) => (
            <Box key={s.n} position="relative">
              {i < STEPS.length - 1 && (
                <Box
                  display={{ base: "none", lg: "block" }}
                  position="absolute"
                  top="1.25rem"
                  left="calc(50% + 1.5rem)"
                  w="calc(100% - 1.5rem)"
                  h="1px"
                  bg="linear-gradient(90deg, rgba(59,130,246,0.4), transparent)"
                />
              )}
              <Text
                fontFamily="heading"
                fontSize="2xl"
                fontWeight="extrabold"
                color="brand.fg"
                opacity={0.7}
                mb="phi2"
              >
                {s.n}
              </Text>
              <Text
                fontFamily="heading"
                fontWeight="bold"
                fontSize="md"
                mb="phi1"
              >
                {s.t}
              </Text>
              <Text fontSize="sm" color="fg.muted" lineHeight="1.5">
                {s.d}
              </Text>
            </Box>
          ))}
        </Grid>
      </Box>

      {/* ── Betable markets (before Attributes) ── */}
      <BetableMarketsSection />

      {/* ── Assets As Attributes gaming currency ── */}
      <AttributesCurrencyRow />

      {/* ── Live board — heads-up vs tournaments (differentiated) ── */}
      <Box className="gh-home-section">
        <Flex
          justify="space-between"
          align="flex-end"
          mb="phi3"
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
              color="brand.fg"
              mb="phi1"
            >
              Live board
            </Text>
            <Heading
              as="h2"
              fontFamily="heading"
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="extrabold"
            >
              Open pots & scores
            </Heading>
            <Text fontSize="sm" color="fg.muted" mt="phi1" maxW="32rem">
              Heads-up escrow matches and host-run brackets, side by side.
              Floating{" "}
              <Text as="span" color="prize.fg" fontWeight="bold">
                Betable
              </Text>{" "}
              chips open the esports market for that event.
            </Text>
          </Box>
          <HStack gap="phi2" flexWrap="wrap">
            <Link href="/challenges">
              <GhButton variant="soft" size="sm" leftIcon={<Swords size={14} />}>
                All 1v1
              </GhButton>
            </Link>
            <Link href="/tournaments">
              <GhButton variant="prize" size="sm" leftIcon={<Trophy size={14} />}>
                All brackets
              </GhButton>
            </Link>
            <Link href="/markets">
              <GhButton variant="outline" size="sm" rightIcon={<ArrowRight size={14} />}>
                Esports markets
              </GhButton>
            </Link>
          </HStack>
        </Flex>

        {/* Heads-up challenges */}
        <Flex justify="space-between" align="center" mb="phi2" gap="phi2" flexWrap="wrap">
          <HStack gap="2">
            <Box
              w="8"
              h="8"
              borderRadius="lg"
              bg="brand.muted"
              color="brand.fg"
              borderWidth="1px"
              borderColor="border.brand"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Swords size={15} />
            </Box>
            <Box>
              <Text
                fontFamily="heading"
                fontWeight="extrabold"
                fontSize="md"
                letterSpacing="0.02em"
              >
                Heads-up challenges
              </Text>
              <Text fontSize="xs" color="fg.muted">
                1v1 escrow · both deposit · winner takes pot
              </Text>
            </Box>
          </HStack>
          <Link href="/challenges">
            <Text
              fontFamily="heading"
              fontSize="xs"
              fontWeight="bold"
              color="brand.fg"
            >
              View all →
            </Text>
          </Link>
        </Flex>
        <Grid
          templateColumns={{
            base: "1fr",
            md: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          }}
          gap="phi3"
          alignItems="stretch"
          mb="phi5"
          pt="2"
          pr="1"
        >
          {FEED_CHALLENGES.map((m) => (
            <MatchCard key={m.title} {...m} mock />
          ))}
        </Grid>

        {/* Tournaments */}
        <Flex justify="space-between" align="center" mb="phi2" gap="phi2" flexWrap="wrap">
          <HStack gap="2">
            <Box
              w="8"
              h="8"
              borderRadius="lg"
              bg="prize.muted"
              color="prize.fg"
              borderWidth="1px"
              borderColor="prize.solid"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Trophy size={15} />
            </Box>
            <Box>
              <Text
                fontFamily="heading"
                fontWeight="extrabold"
                fontSize="md"
                letterSpacing="0.02em"
              >
                Tournaments
              </Text>
              <Text fontSize="xs" color="fg.muted">
                Brackets · entry fees · host cut on settle
              </Text>
            </Box>
          </HStack>
          <Link href="/tournaments">
            <Text
              fontFamily="heading"
              fontSize="xs"
              fontWeight="bold"
              color="prize.fg"
            >
              View all →
            </Text>
          </Link>
        </Flex>
        <Grid
          templateColumns={{
            base: "1fr",
            md: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          }}
          gap="phi3"
          alignItems="stretch"
          mb="phi5"
          pt="2"
          pr="1"
        >
          {FEED_TOURNAMENTS.map((m) => (
            <MatchCard key={m.title} {...m} mock />
          ))}
        </Grid>

        {/* Rooms & arcade */}
        {FEED_OTHER.length > 0 ? (
          <>
            <Flex
              justify="space-between"
              align="center"
              mb="phi2"
              gap="phi2"
              flexWrap="wrap"
            >
              <HStack gap="2">
                <Box
                  w="8"
                  h="8"
                  borderRadius="lg"
                  bg="live.muted"
                  color="live.fg"
                  borderWidth="1px"
                  borderColor="live.solid"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Joystick size={15} />
                </Box>
                <Box>
                  <Text
                    fontFamily="heading"
                    fontWeight="extrabold"
                    fontSize="md"
                    letterSpacing="0.02em"
                  >
                    Rooms & arcade
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    Custom lobbies and high-score banks
                  </Text>
                </Box>
              </HStack>
            </Flex>
            <Grid
              templateColumns={{
                base: "1fr",
                md: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              }}
              gap="phi3"
              alignItems="stretch"
            >
              {FEED_OTHER.map((m) => (
                <MatchCard key={m.title} {...m} mock />
              ))}
            </Grid>
          </>
        ) : null}
      </Box>

      {/* ── Stack strip ── */}
      <Box className="gh-home-section">
        <SimpleGrid columns={{ base: 2, md: 4 }} gap="phi3">
          {[
            { icon: Wallet, t: "II wallet", d: "ICP · ICRC · identity" },
            { icon: Trophy, t: "Host tools", d: "Brackets · rooms · fees" },
            { icon: Gamepad2, t: "Play surfaces", d: "1v1 · arcade · battle" },
            { icon: Users, t: "Teams", d: "Squads · roster · entries" },
          ].map((x) => {
            const Icon = x.icon;
            return (
              <GhSurface key={x.t} variant="muted" p="phi3">
                <Box color="brand.fg" mb="phi2">
                  <Icon size={20} />
                </Box>
                <Text fontFamily="heading" fontWeight="bold" fontSize="sm">
                  {x.t}
                </Text>
                <Text fontSize="xs" color="fg.muted" mt="1">
                  {x.d}
                </Text>
              </GhSurface>
            );
          })}
        </SimpleGrid>
      </Box>

      {/* ── Final CTA ── */}
      <Box
        className="gh-home-section"
        position="relative"
        borderRadius="3xl"
        overflow="hidden"
        borderWidth="1px"
        borderColor="prize.solid"
        minH="15rem"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ART.teamHighfive}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.28)",
          }}
        />
        <Flex
          position="relative"
          direction={{ base: "column", md: "row" }}
          align={{ md: "center" }}
          justify="space-between"
          gap="phi4"
          p={{ base: "phi4", md: "phi5" }}
        >
          <Box maxW="lg">
            <GhBadge tone="prize" mb="phi2">
              Ready player host
            </GhBadge>
            <Heading
              fontFamily="heading"
              fontSize={{ base: "xl", md: "2xl" }}
              fontWeight="extrabold"
              letterSpacing="0.03em"
              mb="phi2"
            >
              Your cut starts with a room
            </Heading>
            <Text fontSize="sm" color="fg.muted" lineHeight="1.6">
              Operators already banking{" "}
              <CountUp
                value={48.2}
                decimals={1}
                suffix=" ICP"
                fontWeight="bold"
                color="prize.fg"
              />{" "}
              in host fees (demo). Be next.
            </Text>
          </Box>
          <HStack gap="phi2" flexWrap="wrap">
            <Link href="/host">
              <GhButton
                variant="prize"
                size="lg"
                leftIcon={<DollarSign size={18} />}
              >
                Take your cut
              </GhButton>
            </Link>
            <Link href="/wallet">
              <GhButton variant="outline" size="lg" leftIcon={<Wallet size={18} />}>
                Connect wallet
              </GhButton>
            </Link>
          </HStack>
        </Flex>
      </Box>
    </VStack>
  );
}
