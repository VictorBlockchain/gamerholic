"use client";

import { useState } from "react";
import {
  Box,
  Code,
  Flex,
  Grid,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Swords,
  Trophy,
  Plus,
  Joystick,
  Sparkles,
  Wallet,
  ExternalLink,
  Share2,
  Search,
  Bell,
  Crosshair,
  ChartCandlestick,
  Info,
  Gamepad2,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import {
  GhBadge,
  GhButton,
  GhSurface,
  SectionDivider,
  GhTooltip,
  GhModal,
  GhModalActions,
  GhTabs,
  ghToast,
  GhInput,
  GhTextarea,
  GhField,
  GhInputShell,
  GhAlert,
  GhProgress,
  GhMeter,
  GhSwitch,
  GhCheckbox,
  GhAvatar,
  GhAvatarGroup,
  GhSkeleton,
  GhSkeletonCard,
  GhKbd,
  GhSpinner,
  GhStat,
  GhEmptyState,
} from "@/components/ui";
import { MatchCard } from "@/components/cards/match-card";
import { SPACE, PHI } from "@/theme/gamerholic-system";

export default function UiKitPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [prizeModal, setPrizeModal] = useState(false);
  const [switchOn, setSwitchOn] = useState(true);
  const [checked, setChecked] = useState(true);
  const [tab, setTab] = useState("play");

  return (
    <VStack align="stretch" gap="phi5">
      <PageHeader
        kicker="Design system"
        title="UI kit"
        description="Orbitron · Rajdhani · Share Tech Mono · volt / prize magenta / attribute violet · φ spacing · 84rem content. Glass arena, not neon candy."
      />

      {/* ── TOC ── */}
      <GhSurface variant="glass" p="phi3">
        <Text
          fontFamily="heading"
          fontSize="2xs"
          fontWeight="bold"
          letterSpacing="0.16em"
          textTransform="uppercase"
          color="brand.fg"
          mb="phi2"
        >
          On this page
        </Text>
        <HStack gap="2" flexWrap="wrap">
          {[
            "Typography",
            "Color",
            "Spacing",
            "Buttons",
            "Badges",
            "Surfaces",
            "Forms",
            "Tabs",
            "Modal",
            "Tooltip",
            "Toast",
            "Alert",
            "Progress",
            "Switch",
            "Avatar",
            "Skeleton",
            "Spinner",
            "Stat",
            "Kbd",
            "Empty",
            "Cards",
          ].map((t) => (
            <GhBadge key={t} tone="muted">
              {t}
            </GhBadge>
          ))}
        </HStack>
      </GhSurface>

      {/* ── Typography ── */}
      <Section
        id="typography"
        title="Typography"
        sub="Display Orbitron · body Rajdhani · mono Share Tech Mono"
      >
        <VStack align="stretch" gap="phi3">
          <Box>
            <Text fontSize="2xs" color="fg.subtle" mb="1" fontFamily="heading" letterSpacing="0.12em" textTransform="uppercase">
              Display / heading
            </Text>
            <Heading
              fontFamily="heading"
              fontSize={{ base: "2xl", md: "4xl" }}
              fontWeight="extrabold"
              className="gh-text-brand"
              letterSpacing="0.06em"
              textTransform="uppercase"
              lineHeight="1.05"
            >
              Gamerholic
            </Heading>
            <Heading
              fontFamily="heading"
              fontSize={{ base: "lg", md: "2xl" }}
              fontWeight="bold"
              mt="phi2"
              letterSpacing="0.03em"
            >
              Host the night. Bank the cut.
            </Heading>
          </Box>

          <Box>
            <Text fontSize="2xs" color="fg.subtle" mb="1" fontFamily="heading" letterSpacing="0.12em" textTransform="uppercase">
              Body · Rajdhani
            </Text>
            <Text fontSize="md" color="fg.default" maxW="34rem" lineHeight="1.65">
              Body UI uses Rajdhani for a geometric esports feel — denser than system
              sans, still legible at small sizes. Prefer short HUD labels over long
              paragraphs on cards.
            </Text>
            <Text fontSize="sm" color="fg.muted" mt="phi2" maxW="34rem" lineHeight="1.6">
              Muted secondary copy explains policy, fees, and vault rules without
              competing with headings.
            </Text>
          </Box>

          <Box>
            <Text fontSize="2xs" color="fg.subtle" mb="1" fontFamily="heading" letterSpacing="0.12em" textTransform="uppercase">
              Mono · principals / ICP
            </Text>
            <Text fontFamily="mono" fontSize="sm" color="fg.muted">
              rdmx6-…-cai · 12.50 ICP · 0xA3FF3D
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 2, md: 4 }} gap="phi2">
            {(
              [
                ["2xs", "0.6875rem", "Meta / kicker"],
                ["xs", "0.75rem", "Badges / helper"],
                ["sm", "0.875rem", "UI default"],
                ["md", "1rem", "Body"],
                ["lg", "1.125rem", "Emphasis"],
                ["xl", "1.3125rem", "Card title"],
                ["2xl", "1.75rem", "Section"],
                ["3xl", "2.25rem", "Hero"],
              ] as const
            ).map(([token, rem, use]) => (
              <GhSurface key={token} variant="muted" p="phi2">
                <Text fontFamily="heading" fontSize={token} fontWeight="bold">
                  Aa {token}
                </Text>
                <Text fontSize="2xs" color="fg.subtle" mt="1" fontFamily="mono">
                  {rem}
                </Text>
                <Text fontSize="2xs" color="fg.muted">
                  {use}
                </Text>
              </GhSurface>
            ))}
          </SimpleGrid>
        </VStack>
      </Section>

      <SectionDivider label="Color" tone="brand" />

      {/* ── Color ── */}
      <Section
        id="color"
        title="Product color roles"
        sub="Volt brand · prize magenta · attribute violet · live cyan"
      >
        <HStack gap="phi2" flexWrap="wrap" mb="phi3">
          <Swatch label="brand / volt" bg="brand.solid" />
          <Swatch label="prize / magenta" bg="prize.solid" />
          <Swatch label="attr / violet" bg="attr.solid" />
          <Swatch label="live / cyan" bg="live.solid" />
          <Swatch label="success" bg="success.solid" />
          <Swatch label="danger" bg="danger.solid" />
          <Swatch label="bg.canvas" bg="bg.canvas" border />
          <Swatch label="bg.elevated" bg="bg.elevated" border />
          <Swatch label="bg.glass" bg="bg.glass" border />
        </HStack>
        <HStack gap="phi4" flexWrap="wrap" mb="phi3">
          <Heading size="lg" className="gh-text-brand">
            Volt play
          </Heading>
          <Heading size="lg" className="gh-text-prize">
            Prize $$
          </Heading>
          <Heading size="lg" className="gh-text-attr">
            Attributes
          </Heading>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="phi2">
          <RoleCard
            title="brand"
            body="Play, primary CTAs, 1v1 challenges, wallet connect."
          />
          <RoleCard
            title="prize"
            body="Host earn, prize pots, betable markets, tournament chrome."
          />
          <RoleCard
            title="attr"
            body="Attribute tokens, Multi Pass, violet battle loadouts."
          />
          <RoleCard
            title="live"
            body="Live status, rooms, consoles, real-time ticker accents."
          />
        </SimpleGrid>
      </Section>

      <SectionDivider label="Spacing" tone="attr" />

      {/* ── Spacing ── */}
      <Section
        id="spacing"
        title="φ spacing ladder"
        sub={`Base 8px · golden ratio ${PHI} → phi1…phi6`}
      >
        <VStack align="stretch" gap="phi2">
          {(
            Object.entries(SPACE) as [string, string][]
          ).map(([k, v]) => (
            <HStack key={k} gap="phi3" align="center">
              <Text
                fontFamily="mono"
                fontSize="xs"
                color="fg.subtle"
                w="10"
                flexShrink={0}
              >
                phi{k}
              </Text>
              <Box
                h="3"
                w={v}
                maxW="100%"
                borderRadius="sm"
                bg="brand.solid"
                opacity={0.85}
              />
              <Text fontFamily="mono" fontSize="2xs" color="fg.muted">
                {v}
              </Text>
            </HStack>
          ))}
        </VStack>
        <Text fontSize="sm" color="fg.muted" mt="phi3">
          Use token names in Chakra props:{" "}
          <Code color="brand.fg">gap=&quot;phi3&quot;</Code>{" "}
          <Code color="brand.fg">p=&quot;phi4&quot;</Code>. Content max{" "}
          <Code color="brand.fg">84rem</Code> (wider storefront, not full bleed).
        </Text>
      </Section>

      <SectionDivider label="Controls" tone="neutral" />

      {/* ── Buttons ── */}
      <Section id="buttons" title="Buttons" sub="GhButton · leftIcon / rightIcon · product variants">
        <Text fontSize="xs" color="fg.subtle" mb="phi2" fontFamily="heading" letterSpacing="0.1em" textTransform="uppercase">
          Variants
        </Text>
        <HStack gap="phi2" flexWrap="wrap" mb="phi3">
          <GhButton variant="primary" leftIcon={<Swords size={16} />}>
            Primary
          </GhButton>
          <GhButton variant="prize" leftIcon={<Trophy size={16} />}>
            Host earn
          </GhButton>
          <GhButton variant="attr" leftIcon={<Sparkles size={16} />}>
            Attributes
          </GhButton>
          <GhButton variant="live" leftIcon={<Joystick size={16} />}>
            Live
          </GhButton>
          <GhButton variant="outline" leftIcon={<Share2 size={16} />}>
            Outline
          </GhButton>
          <GhButton variant="soft" leftIcon={<Wallet size={16} />}>
            Soft
          </GhButton>
          <GhButton variant="ghost">Ghost</GhButton>
          <GhButton variant="danger">Danger</GhButton>
        </HStack>
        <Text fontSize="xs" color="fg.subtle" mb="phi2" fontFamily="heading" letterSpacing="0.1em" textTransform="uppercase">
          Sizes
        </Text>
        <HStack gap="phi2" flexWrap="wrap" align="center">
          <GhButton variant="primary" size="xs" leftIcon={<Plus size={12} />}>
            XS
          </GhButton>
          <GhButton variant="primary" size="sm" leftIcon={<Plus size={14} />}>
            Small
          </GhButton>
          <GhButton variant="primary" size="md" leftIcon={<Plus size={16} />}>
            Medium
          </GhButton>
          <GhButton variant="primary" size="lg" leftIcon={<Plus size={18} />}>
            Large
          </GhButton>
          <GhTooltip content="Open external arena link">
            <GhButton variant="outline" size="sm" rightIcon={<ExternalLink size={14} />}>
              With tooltip
            </GhButton>
          </GhTooltip>
        </HStack>
      </Section>

      {/* ── Badges ── */}
      <Section id="badges" title="Badges" sub="Status + product tones · optional pulse for live">
        <HStack gap="2" flexWrap="wrap">
          <GhBadge tone="brand">Brand</GhBadge>
          <GhBadge tone="prize">Host earn</GhBadge>
          <GhBadge tone="attr">Attribute</GhBadge>
          <GhBadge tone="live" pulse>
            Live
          </GhBadge>
          <GhBadge tone="success">Settled</GhBadge>
          <GhBadge tone="danger">Disputed</GhBadge>
          <GhBadge tone="muted">Muted</GhBadge>
          <GhBadge tone="default">Default</GhBadge>
          <GhBadge tone="prize">
            <ChartCandlestick size={11} /> Betable
          </GhBadge>
        </HStack>
      </Section>

      {/* ── Surfaces ── */}
      <Section id="surfaces" title="Surfaces" sub="GhSurface — solid panels and glass cards">
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, xl: 4 }} gap="3">
          {(
            [
              "panel",
              "elevated",
              "muted",
              "glass",
              "brand",
              "prize",
              "attr",
              "live",
            ] as const
          ).map((v) => (
            <GhSurface key={v} variant={v}>
              <Text fontWeight="bold" fontSize="sm" textTransform="capitalize" fontFamily="heading">
                {v}
              </Text>
              <Text fontSize="xs" color="fg.muted" mt="1">
                Container
              </Text>
            </GhSurface>
          ))}
        </SimpleGrid>
      </Section>

      <SectionDivider label="Forms" tone="brand" />

      {/* ── Forms ── */}
      <Section id="forms" title="Forms" sub="GhField · GhInput · GhTextarea · checkbox · switch">
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="phi4">
          <VStack align="stretch" gap="phi3">
            <GhField label="Display name" helperText="Shown on challenge cards" required>
              <GhInput placeholder="frag_queen" />
            </GhField>
            <GhField label="Entry stake (ICP)">
              <GhInput type="number" placeholder="2.5" tone="prize" />
            </GhField>
            <GhField label="Search games">
              <GhInputShell left={<Search size={16} />}>
                <GhInput placeholder="Street Fighter, Apex…" pl="10" />
              </GhInputShell>
            </GhField>
            <GhField label="Rules / notes" errorText="Required for open challenges">
              <GhTextarea placeholder="Bo3, no characters banned…" />
            </GhField>
          </VStack>
          <VStack align="stretch" gap="phi3">
            <GhSurface variant="glass">
              <Text fontFamily="heading" fontSize="xs" fontWeight="bold" mb="phi3" letterSpacing="0.1em" textTransform="uppercase" color="fg.subtle">
                Toggles
              </Text>
              <VStack align="stretch" gap="phi3">
                <GhSwitch
                  label="Public lobby"
                  checked={switchOn}
                  onCheckedChange={setSwitchOn}
                />
                <GhSwitch label="Prize tone" tone="prize" defaultChecked />
                <GhSwitch label="Attr tone" tone="attr" size="sm" />
                <GhCheckbox
                  label="I accept escrow rules"
                  checked={checked}
                  onCheckedChange={(c) => setChecked(c === true)}
                />
                <GhCheckbox label="Enable betable market" tone="prize" />
              </VStack>
            </GhSurface>
          </VStack>
        </Grid>
      </Section>

      <SectionDivider label="Navigation" tone="live" />

      {/* ── Tabs ── */}
      <Section id="tabs" title="Tabs" sub="GhTabs — segmented list with product tones">
        <GhTabs
          value={tab}
          onValueChange={setTab}
          tone="brand"
          items={[
            {
              value: "play",
              label: "Play",
              icon: <Swords size={14} />,
              content: (
                <GhSurface variant="muted">
                  <Text fontSize="sm" color="fg.muted">
                    Heads-up escrow matches and open seats. Tab value:{" "}
                    <Code color="brand.fg">{tab}</Code>
                  </Text>
                </GhSurface>
              ),
            },
            {
              value: "host",
              label: "Host",
              icon: <Trophy size={14} />,
              content: (
                <GhSurface variant="prize">
                  <Text fontSize="sm">Host fee bps · room take · vault requests</Text>
                </GhSurface>
              ),
            },
            {
              value: "arcade",
              label: "Arcade",
              icon: <Joystick size={14} />,
              content: (
                <GhSurface variant="attr">
                  <Text fontSize="sm">High scores · try fees · fail bank</Text>
                </GhSurface>
              ),
            },
            {
              value: "markets",
              label: "Markets",
              icon: <ChartCandlestick size={14} />,
              content: (
                <GhSurface variant="live">
                  <Text fontSize="sm">Esports betable markets linked to events</Text>
                </GhSurface>
              ),
            },
          ]}
        />
        <Box mt="phi4">
          <Text fontSize="xs" color="fg.subtle" mb="phi2" fontFamily="heading" letterSpacing="0.1em" textTransform="uppercase">
            Fitted · prize tone · sm
          </Text>
          <GhTabs
            tone="prize"
            fitted
            size="sm"
            defaultValue="a"
            items={[
              { value: "a", label: "Overview", content: <Text fontSize="sm" color="fg.muted">Bracket overview</Text> },
              { value: "b", label: "Entrants", content: <Text fontSize="sm" color="fg.muted">32 registered</Text> },
              { value: "c", label: "Payouts", content: <Text fontSize="sm" color="fg.muted">Host 2.5% · pot 14 ICP</Text> },
            ]}
          />
        </Box>
      </Section>

      <SectionDivider label="Overlays" tone="prize" />

      {/* ── Modal ── */}
      <Section id="modal" title="Modal" sub="GhModal — glass dialog with tone rail">
        <HStack gap="phi2" flexWrap="wrap">
          <GhButton variant="primary" onClick={() => setModalOpen(true)}>
            Open modal
          </GhButton>
          <GhButton variant="prize" onClick={() => setPrizeModal(true)}>
            Prize modal
          </GhButton>
          <GhButton variant="danger" onClick={() => setConfirmOpen(true)}>
            Confirm dialog
          </GhButton>
        </HStack>
        <Text fontSize="xs" color="fg.subtle" mt="phi2">
          Also see mobile Create sheet (FAB) for bottom-sheet pattern.
        </Text>

        <GhModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          title="Create challenge"
          description="Lock stake, pick game, wait for a challenger. Escrow holds both deposits."
          tone="brand"
          footer={
            <GhModalActions
              onCancel={() => setModalOpen(false)}
              onConfirm={() => {
                setModalOpen(false);
                ghToast({
                  title: "Challenge drafted",
                  description: "Connect wallet to publish on-chain.",
                  type: "success",
                });
              }}
              confirmLabel="Continue"
            />
          }
        >
          <VStack align="stretch" gap="phi3">
            <GhField label="Game">
              <GhInput placeholder="Apex Legends" />
            </GhField>
            <GhField label="Stake">
              <GhInput placeholder="2.5 ICP" />
            </GhField>
          </VStack>
        </GhModal>

        <GhModal
          open={prizeModal}
          onOpenChange={setPrizeModal}
          title="Host fee preview"
          description="Your cut settles when the bracket finalizes."
          tone="prize"
          size="sm"
          footer={
            <GhButton variant="prize" onClick={() => setPrizeModal(false)}>
              Got it
            </GhButton>
          }
        >
          <GhStat label="Est. host earn" value="3.2 ICP" tone="prize" hint="2.5% of 128 ICP pot" />
        </GhModal>

        <GhModal
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Cancel match?"
          description="Mutual cancel returns both stakes. This cannot be undone."
          tone="brand"
          size="sm"
          footer={
            <GhModalActions
              onCancel={() => setConfirmOpen(false)}
              onConfirm={() => {
                setConfirmOpen(false);
                ghToast({ title: "Match cancelled", type: "warning" });
              }}
              confirmLabel="Cancel match"
              confirmVariant="danger"
              cancelLabel="Keep open"
            />
          }
        />
      </Section>

      {/* ── Tooltip ── */}
      <Section id="tooltip" title="Tooltip" sub="GhTooltip — glass HUD hints">
        <HStack gap="phi3" flexWrap="wrap">
          <GhTooltip content="Winner takes the escrow pot">
            <GhButton variant="soft" size="sm">
              Hover me
            </GhButton>
          </GhTooltip>
          <GhTooltip content="Host fee bps apply on finalize" placement="bottom">
            <GhBadge tone="prize">Host earn</GhBadge>
          </GhTooltip>
          <GhTooltip content="Opens esports prediction market">
            <Box as="span" display="inline-flex" color="prize.fg" cursor="help">
              <ChartCandlestick size={20} />
            </Box>
          </GhTooltip>
          <GhTooltip content="Internet Identity principal">
            <Text fontFamily="mono" fontSize="sm" color="fg.muted" borderBottomWidth="1px" borderStyle="dashed" borderColor="border.brand">
              rdmx6-…-cai
            </Text>
          </GhTooltip>
        </HStack>
      </Section>

      {/* ── Toast ── */}
      <Section id="toast" title="Toast" sub="ghToast / toaster — mounted app-wide via GhToaster">
        <HStack gap="phi2" flexWrap="wrap">
          <GhButton
            variant="primary"
            size="sm"
            onClick={() =>
              ghToast({
                title: "Wallet connected",
                description: "You can host and enter stakes.",
                type: "success",
              })
            }
          >
            Success toast
          </GhButton>
          <GhButton
            variant="prize"
            size="sm"
            onClick={() =>
              ghToast({
                title: "Host fee credited",
                description: "+2.4 ICP settled to your principal.",
                type: "info",
              })
            }
          >
            Info toast
          </GhButton>
          <GhButton
            variant="outline"
            size="sm"
            onClick={() =>
              ghToast({
                title: "Report pending",
                description: "Waiting on opponent confirmation.",
                type: "warning",
              })
            }
          >
            Warning toast
          </GhButton>
          <GhButton
            variant="danger"
            size="sm"
            onClick={() =>
              ghToast({
                title: "Deposit failed",
                description: "Insufficient ICP for entry stake.",
                type: "error",
              })
            }
          >
            Error toast
          </GhButton>
          <GhButton
            variant="soft"
            size="sm"
            onClick={() =>
              ghToast({
                title: "Market opened",
                description: "Esports moneyline is live.",
                type: "success",
                action: {
                  label: "View market",
                  onClick: () => {
                    window.location.href = "/markets";
                  },
                },
              })
            }
          >
            Toast + action
          </GhButton>
        </HStack>
        <Text fontSize="xs" color="fg.muted" mt="phi2" fontFamily="mono">
          import {"{"} ghToast {"}"} from &quot;@/components/ui&quot;
        </Text>
      </Section>

      <SectionDivider label="Feedback" tone="attr" />

      {/* ── Alert ── */}
      <Section id="alert" title="Alert" sub="Inline banners for policy, errors, vault notes">
        <VStack align="stretch" gap="phi2">
          <GhAlert tone="brand" title="Non-custodial">
            Escrow subaccounts hold stakes until report or mutual cancel. Gamerholic never holds your bag.
          </GhAlert>
          <GhAlert tone="prize" title="Host fee preview">
            2.5% of prize pot settles to the host principal on finalize.
          </GhAlert>
          <GhAlert tone="attr" title="Multi Tournament Pass">
            Up to 10 free vault-funded brackets per month.
          </GhAlert>
          <GhAlert tone="success" title="Settled">
            Winner claimed 4.75 ICP from escrow.
          </GhAlert>
          <GhAlert tone="error" title="Disputed">
            Both parties reported different winners — moderator queue.
          </GhAlert>
          <GhAlert tone="live" title="Live bracket" icon={<Bell size={18} />}>
            Round of 16 starts in 12 minutes.
          </GhAlert>
        </VStack>
      </Section>

      {/* ── Progress ── */}
      <Section id="progress" title="Progress" sub="GhProgress · GhMeter for banks and fills">
        <VStack align="stretch" gap="phi3" maxW="28rem">
          <GhProgress value={72} label="Bracket fill" tone="prize" />
          <GhProgress value={41} label="Arcade defenses" tone="attr" size="sm" />
          <GhProgress value={88} label="Vault allocation" tone="live" size="lg" />
          <Box>
            <Text fontSize="2xs" color="fg.subtle" mb="1" fontFamily="heading" letterSpacing="0.1em" textTransform="uppercase">
              Compact meters
            </Text>
            <VStack align="stretch" gap="2">
              <GhMeter value={60} tone="brand" />
              <GhMeter value={35} tone="prize" />
              <GhMeter value={90} tone="attr" h="3" />
            </VStack>
          </Box>
        </VStack>
      </Section>

      {/* ── Avatar ── */}
      <Section id="avatar" title="Avatar" sub="GhAvatar · status dots · groups">
        <HStack gap="phi3" flexWrap="wrap" align="center" mb="phi3">
          <GhAvatar name="frag queen" size="xs" />
          <GhAvatar name="ace host" size="sm" status="online" />
          <GhAvatar name="neon crown" size="md" tone="attr" status="live" />
          <GhAvatar name="lobby king" size="lg" tone="live" />
          <GhAvatar name="smash ops" size="xl" tone="prize" status="online" />
        </HStack>
        <GhAvatarGroup
          names={["ace host", "ryu main", "frag queen", "drop shot", "iron fist", "neon"]}
          max={4}
          size="md"
        />
      </Section>

      {/* ── Skeleton ── */}
      <Section id="skeleton" title="Skeleton" sub="Loading bones for cards and lists">
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="phi3">
          <GhSkeletonCard />
          <VStack align="stretch" gap="phi2">
            <GhSkeleton h="8" />
            <GhSkeleton h="4" w="80%" />
            <GhSkeleton h="4" w="55%" />
            <HStack gap="2">
              <GhSkeleton circle w="10" />
              <GhSkeleton h="10" flex="1" />
            </HStack>
          </VStack>
          <GhSurface variant="muted">
            <GhSkeleton h="3" w="30%" mb="phi2" />
            <GhSkeleton h="20" borderRadius="xl" />
          </GhSurface>
        </SimpleGrid>
      </Section>

      {/* ── Spinner ── */}
      <Section id="spinner" title="Spinner" sub="Async states — settle, deposit, report">
        <HStack gap="phi5" flexWrap="wrap" align="flex-end">
          <GhSpinner size="sm" label="sm" />
          <GhSpinner size="md" tone="prize" label="Settling…" />
          <GhSpinner size="lg" tone="attr" label="Loading XFT" />
          <GhSpinner size="md" tone="live" />
        </HStack>
      </Section>

      {/* ── Stat ── */}
      <Section id="stat" title="Stat tiles" sub="GhStat — banks, volume, host cut">
        <SimpleGrid columns={{ base: 2, md: 4 }} gap="phi2">
          <GhStat label="Host bank" value="48.2 ICP" tone="prize" hint="Demo cumulative" />
          <GhStat label="Arcade bank" value="2.1 ICP" tone="attr" hint="14 fails × fee" />
          <GhStat label="Market vol" value="42.8 ICP" tone="live" hint="SF6 Friday" />
          <GhStat label="Open seats" value="12" tone="brand" hint="Live board" />
        </SimpleGrid>
      </Section>

      {/* ── Kbd ── */}
      <Section id="kbd" title="Keyboard" sub="GhKbd — shortcut hints">
        <HStack gap="2" flexWrap="wrap" align="center">
          <GhKbd>⌘</GhKbd>
          <Text fontSize="sm" color="fg.muted">
            +
          </Text>
          <GhKbd>K</GhKbd>
          <Text fontSize="sm" color="fg.muted" mx="2">
            command palette
          </Text>
          <GhKbd>Esc</GhKbd>
          <Text fontSize="sm" color="fg.muted" mx="2">
            close modal
          </Text>
          <GhKbd>↵</GhKbd>
          <Text fontSize="sm" color="fg.muted">
            confirm
          </Text>
        </HStack>
      </Section>

      {/* ── Empty ── */}
      <Section id="empty" title="Empty state" sub="GhEmptyState — zero data boards">
        <GhEmptyState
          icon={Gamepad2}
          title="No open challenges"
          description="Host a 1v1 or browse tournaments. Empty seats show Open slot placeholders on cards."
          action={
            <GhButton variant="primary" size="sm" leftIcon={<Plus size={14} />}>
              New challenge
            </GhButton>
          }
        />
      </Section>

      <SectionDivider label="Product cards" tone="prize" />

      {/* ── Cards ── */}
      <Section
        id="cards"
        title="Match cards"
        sub="Kind-differentiated · challenger placeholders · optional betable market chip"
      >
        <SimpleGrid
          columns={{ base: 1, md: 2, xl: 3 }}
          gap="phi3"
          alignItems="stretch"
          pt="2"
          pr="1"
        >
          <MatchCard
            kind="challenge"
            title="1v1 sample"
            game="Apex Legends"
            console="PC"
            entryFee="2.5 ICP"
            prizePot="4.75 ICP"
            status="open"
            players="1/2"
            username="frag_queen"
            record="48–21"
            challengers={[{ username: "frag_queen", record: "48–21" }]}
            betable
            market={{
              id: "apex-frag-queen-1v1",
              category: "esports",
              label: "Moneyline",
            }}
          />
          <MatchCard
            kind="tournament"
            title="Host bracket"
            game="Street Fighter 6"
            console="PS5"
            entryFee="0.5 ICP"
            prizePot="14 ICP"
            status="live"
            players="24/32"
            hostEarn="2.5% · ~3 ICP"
            username="ace_host"
            record="18–3"
            betable
            market={{
              id: "sf6-friday-night",
              category: "esports",
              label: "Winner",
            }}
          />
          <MatchCard
            kind="arcade"
            title="High score board"
            game="Time Attack"
            console="PC"
            entryFee="0.15 ICP / try"
            prizePot="2.1 ICP bank"
            status="open"
            meta="Fails bank"
            username="neon_crown"
            record="41–0"
            challengers={[{ username: "neon_crown", record: "41–0" }]}
          />
        </SimpleGrid>
      </Section>

      <SectionDivider label="Chrome" tone="live" />

      {/* ── Chrome ── */}
      <Section id="chrome" title="App chrome" sub="Mobile app shell · 84rem desktop max">
        <GhSurface variant="panel">
          <VStack align="stretch" gap="phi2" fontSize="sm" color="fg.muted">
            <Text>
              <Code color="brand.fg">content max</Code> — <strong>84rem</strong> · φ
              padding ladder · glass cards on night canvas
            </Text>
            <Text>
              <Code color="brand.fg">Bottom nav</Code> — Play · Host · Create · Arcade
              · You (+ center FAB)
            </Text>
            <Text>
              <Code color="brand.fg">SectionDivider</Code> — gem + gradient rails
              (volt / prize / attr / live)
            </Text>
            <Text>
              <Code color="brand.fg">Toaster</Code> — top-end via{" "}
              <Code>GhToaster</Code> in provider
            </Text>
            <Text>
              <Code color="brand.fg">Icons</Code> — Lucide · pass through{" "}
              <Code>leftIcon</Code> / <Code>rightIcon</Code>
            </Text>
            <HStack gap="2" pt="phi1" flexWrap="wrap">
              <GhBadge tone="brand">
                <Crosshair size={11} /> Heads-up
              </GhBadge>
              <GhBadge tone="prize">
                <Trophy size={11} /> Tournament
              </GhBadge>
              <GhBadge tone="attr">
                <Layers size={11} /> Attributes
              </GhBadge>
              <GhBadge tone="live">
                <Info size={11} /> Live
              </GhBadge>
            </HStack>
          </VStack>
        </GhSurface>
      </Section>

      <Box pb="phi4">
        <GhAlert tone="attr" title="Design notes">
          Full theme rationale lives in{" "}
          <Code color="attr.fg">notes/design/ui-theme.md</Code> and{" "}
          <Code color="attr.fg">notes/design/design-system.md</Code>.
        </GhAlert>
      </Box>
    </VStack>
  );
}

function Section({
  id,
  title,
  sub,
  children,
}: {
  id?: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <Box id={id} scrollMarginTop="5rem">
      <Heading as="h2" size="md" fontWeight="bold" mb="0.5" fontFamily="heading">
        {title}
      </Heading>
      {sub ? (
        <Text fontSize="sm" color="fg.subtle" mb="phi3" lineHeight="1.55">
          {sub}
        </Text>
      ) : (
        <Box mb="phi3" />
      )}
      {children}
    </Box>
  );
}

function Swatch({
  label,
  bg,
  border,
}: {
  label: string;
  bg: string;
  border?: boolean;
}) {
  return (
    <VStack gap="1">
      <Box
        w="14"
        h="14"
        borderRadius="xl"
        bg={bg}
        borderWidth={border ? "1px" : "0"}
        borderColor="border.default"
        boxShadow="card"
      />
      <Text fontSize="2xs" color="fg.subtle" textAlign="center" maxW="16">
        {label}
      </Text>
    </VStack>
  );
}

function RoleCard({ title, body }: { title: string; body: string }) {
  return (
    <GhSurface variant="muted" p="phi3">
      <Text fontFamily="heading" fontWeight="bold" fontSize="sm" color="brand.fg" mb="1">
        {title}
      </Text>
      <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
        {body}
      </Text>
    </GhSurface>
  );
}
