"use client";

import Link from "next/link";
import {
  Box,
  Flex,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Gamepad2,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Swords,
  Wallet,
} from "lucide-react";
import { GhBadge } from "@/components/ui/gh-badge";
import { GhButton } from "@/components/ui/gh-button";
import { GhSurface } from "@/components/ui/gh-surface";

const TOC = [
  { id: "ii", label: "Internet Identity" },
  { id: "devices", label: "Devices" },
  { id: "approvals", label: "Approvals" },
  { id: "play", label: "Stakes & arenas" },
  { id: "backup", label: "Backup" },
] as const;

const QUICK_GUARDS: { icon: typeof Lock; title: string }[] = [
  { icon: KeyRound, title: "Never paste II recovery into apps" },
  { icon: Smartphone, title: "Register a second passkey" },
  { icon: Mail, title: "Email recovery only on identity.ic0.app" },
  { icon: Lock, title: "Double-check entry stakes & withdrawals" },
  { icon: Swords, title: "Know challenge vs tournament pots" },
  { icon: Wallet, title: "Only withdraw to principals you control" },
  { icon: Sparkles, title: "Bookmark gamerholic.fun + identity.ic0.app" },
];

export default function SecurityTipsPage() {
  return (
    <VStack
      align="stretch"
      gap={{ base: 6, sm: 8 }}
      maxW="56rem"
      mx="auto"
      w="100%"
      px={{ base: "phi3", md: "phi4" }}
      pb={{ base: "6rem", md: "phi5" }}
      pt={{ base: "phi4", md: "phi5" }}
    >
      <Box>
        <Text
          fontSize="2xs"
          fontFamily="heading"
          fontWeight="bold"
          letterSpacing="0.14em"
          textTransform="uppercase"
          color="brand.fg"
          mb="2"
        >
          Security
        </Text>
        <Text
          as="h1"
          fontFamily="heading"
          fontSize={{ base: "2xl", sm: "3xl" }}
          fontWeight="semibold"
          letterSpacing="tight"
          color="fg.default"
        >
          Keep your ICP account safe
        </Text>
        <Text
          mt="2"
          fontSize={{ base: "sm", sm: "md" }}
          color="fg.muted"
          lineHeight="relaxed"
          maxW="40rem"
        >
          Best practices for Internet Identity, device recovery, and protecting
          your Gamerholic wallet, stakes, and prize pots.
        </Text>
      </Box>

      <GhSurface variant="live" p="0" overflow="hidden" borderRadius="3xl">
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="0" alignItems="stretch">
          <VStack
            align="stretch"
            gap="4"
            p={{ base: 5, sm: 7 }}
            justify="center"
          >
            <GhBadge tone="live" alignSelf="flex-start">
              Gamerholic · account defender
            </GhBadge>
            <Text
              as="h2"
              fontFamily="heading"
              fontSize={{ base: "xl", sm: "2xl" }}
              fontWeight="semibold"
              color="fg.default"
              letterSpacing="tight"
            >
              Passkeys protect you — recovery keeps you in.
            </Text>
            <Text fontSize="sm" color="fg.muted" lineHeight="relaxed">
              Gamerholic never holds your Internet Identity credentials. Sign-in
              uses{" "}
              <Text as="strong" color="fg.default">
                passkeys
              </Text>{" "}
              (device biometrics / PIN) — not a crypto wallet seed you paste into
              websites. Recovery is separate: backup passkeys, an optional
              recovery phrase from II, and/or email recovery when enabled on
              identity.ic0.app.
            </Text>
            <HStack gap="2" flexWrap="wrap" pt="1">
              <a
                href="https://identity.ic0.app/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GhButton size="sm" variant="primary">
                  Manage Internet Identity
                </GhButton>
              </a>
              <Link href="/wallet">
                <GhButton size="sm" variant="outline">
                  Open wallet
                </GhButton>
              </Link>
            </HStack>
          </VStack>
          <Box
            position="relative"
            minH={{ base: "14rem", md: "18rem" }}
            bg="bg.muted"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Gamepad2 size={96} color="var(--gh-colors-brand-fg)" opacity={0.45} />
          </Box>
        </SimpleGrid>
      </GhSurface>

      <Flex
        as="nav"
        aria-label="On this page"
        gap="2"
        flexWrap="wrap"
        overflowX="auto"
        pb="1"
        css={{ scrollbarWidth: "none" }}
      >
        {TOC.map((item) => (
          <a key={item.id} href={`#${item.id}`}>
            <Box
              px="3"
              py="1.5"
              borderRadius="full"
              borderWidth="1px"
              borderColor="border.default"
              bg="bg.surface"
              fontSize="xs"
              fontWeight="semibold"
              color="fg.muted"
              whiteSpace="nowrap"
              _hover={{
                borderColor: "brand.solid",
                color: "brand.fg",
                bg: "brand.muted",
              }}
            >
              {item.label}
            </Box>
          </a>
        ))}
      </Flex>

      <SimpleGrid
        gap={{ base: 5, lg: 6 }}
        templateColumns={{ base: "1fr", lg: "1.15fr 0.85fr" }}
        alignItems="start"
      >
        <VStack align="stretch" gap="5">
          <TipSection
            id="ii"
            step={1}
            title="Internet Identity (not a seed wallet)"
            variant="live"
          >
            <BulletList
              items={[
                <>
                  <strong>Passkeys</strong> sign you in with Face ID, Touch ID,
                  Windows Hello, or a security key. The private key stays on the
                  authenticator — Gamerholic never sees it.
                </>,
                <>
                  Add <strong>more than one</strong> passkey/device in the II
                  manage page so one lost phone doesn&apos;t lock you out.
                </>,
                <>
                  Optional <strong>recovery phrase</strong> from Internet
                  Identity is a <em>backup authenticator</em> — write it
                  offline. It is <em>not</em> an ICP ledger seed, and you should
                  never paste it into Gamerholic or any random site.
                </>,
                <>
                  <strong>Email recovery</strong> (when registered on II) can
                  help from a new device via a one-time code — still treat email
                  as phishable; pair it with passkeys.
                </>,
                <>
                  Bookmark{" "}
                  <a
                    href="https://identity.ic0.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--gh-colors-brand-fg)",
                      fontWeight: 600,
                      textDecoration: "underline",
                    }}
                  >
                    identity.ic0.app
                  </a>{" "}
                  and{" "}
                  <Text as="strong" color="fg.default">
                    gamerholic.fun
                  </Text>
                  . Fake II popups are a common attack.
                </>,
              ]}
            />
          </TipSection>

          <TipSection
            id="devices"
            step={2}
            title="Devices & sessions"
            variant="prize"
          >
            <BulletList
              items={[
                <>
                  Prefer signing in from devices you control. Log out of shared
                  computers when you&apos;re done.
                </>,
                <>
                  If a phone or laptop is lost, remove that passkey from{" "}
                  <a
                    href="https://identity.ic0.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--gh-colors-brand-fg)",
                      fontWeight: 600,
                      textDecoration: "underline",
                    }}
                  >
                    identity.ic0.app
                  </a>{" "}
                  using a device you still have.
                </>,
                <>
                  Don&apos;t share recovery material between people. Your
                  principal owns your wallet balance and wins.
                </>,
              ]}
            />
          </TipSection>

          <TipSection
            id="approvals"
            step={3}
            title="Approvals & spends"
            variant="attr"
          >
            <BulletList
              items={[
                <>
                  Check entry stake, host fee, and pot size before you join a
                  challenge, tournament, or room.
                </>,
                <>
                  Review ICRC allowances if you deposit from an external wallet.
                  Don&apos;t approve unlimited spends to unknown principals.
                </>,
                <>
                  Withdrawals go to a principal you choose — double-check the
                  destination before confirming.
                </>,
              ]}
            />
          </TipSection>

          <TipSection
            id="play"
            step={4}
            title="Stakes, arenas & prizes"
            variant="brand"
          >
            <BulletList
              items={[
                <>
                  <strong>Arcade / free play</strong> is not the same as a
                  staked challenge or tournament pot — know which mode
                  you&apos;re in.
                </>,
                <>
                  Host fees and Betable market splits settle to escrow
                  principals — confirm amounts in Wallet before staking.
                </>,
                <>
                  Claim prizes only through official Gamerholic flows. We will
                  never ask for your II recovery phrase.
                </>,
                <>
                  Report stuck matches or suspicious prompts via{" "}
                  <a href="mailto:support@gamerholic.fun">
                    <Text
                      as="span"
                      color="brand.fg"
                      fontWeight="semibold"
                      textDecoration="underline"
                    >
                      support@gamerholic.fun
                    </Text>
                  </a>
                  .
                </>,
              ]}
            />
          </TipSection>

          <TipSection
            id="backup"
            step={5}
            title="Backup checklist"
            variant="elevated"
          >
            <BulletList
              items={[
                <>At least two passkeys / devices on your II.</>,
                <>
                  Recovery phrase (if you created one) written offline in two
                  places — never in screenshots or chat.
                </>,
                <>
                  Email recovery registered only if you control that inbox.
                </>,
                <>
                  Know which principal holds your Gamerholic wallet and
                  unclaimed wins.
                </>,
                <>
                  Keep{" "}
                  <Text as="strong" color="fg.default">
                    gamerholic.fun
                  </Text>{" "}
                  bookmarked — phishing clones are common around play-to-earn.
                </>,
              ]}
            />
          </TipSection>
        </VStack>

        <VStack
          align="stretch"
          gap="4"
          position={{ lg: "sticky" }}
          top={{ lg: "6rem" }}
        >
          <GhSurface variant="elevated" p="0" overflow="hidden" borderRadius="2xl">
            <Box
              position="relative"
              aspectRatio="1"
              bg="bg.muted"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Swords size={72} color="var(--gh-colors-prize-fg)" opacity={0.5} />
            </Box>
            <VStack align="stretch" gap="2" p="4">
              <Text
                fontSize="sm"
                fontFamily="heading"
                fontWeight="semibold"
                color="fg.default"
              >
                Recovery lives with you
              </Text>
              <Text fontSize="xs" color="fg.muted" lineHeight="relaxed">
                If you lose every passkey and every recovery method, neither
                Gamerholic nor DFINITY support can “reset” your identity. Plan
                backups before you need them.
              </Text>
            </VStack>
          </GhSurface>

          <GhSurface variant="prize" borderRadius="2xl" p="4">
            <Text
              fontSize="2xs"
              fontFamily="heading"
              fontWeight="bold"
              letterSpacing="0.12em"
              textTransform="uppercase"
              color="prize.fg"
              mb="3"
            >
              Quick guards
            </Text>
            <VStack as="ul" align="stretch" gap="3" m="0" p="0" listStyleType="none">
              {QUICK_GUARDS.map(({ icon: Icon, title }) => (
                <HStack as="li" key={title} align="flex-start" gap="2.5">
                  <Flex
                    mt="0.5"
                    h="7"
                    w="7"
                    flexShrink={0}
                    align="center"
                    justify="center"
                    borderRadius="lg"
                    bg="bg.surface"
                    color="prize.fg"
                    borderWidth="1px"
                    borderColor="prize.solid"
                  >
                    <Icon size={14} />
                  </Flex>
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="fg.default"
                    lineHeight="snug"
                  >
                    {title}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </GhSurface>

          <Flex justify="center" pt="1">
            <HStack gap="2" color="fg.muted" fontSize="xs">
              <ShieldCheck size={14} />
              <Text>Play hard — but back up harder.</Text>
            </HStack>
          </Flex>
        </VStack>
      </SimpleGrid>
    </VStack>
  );
}

function TipSection({
  id,
  step,
  title,
  variant,
  children,
}: {
  id: string;
  step: number;
  title: string;
  variant: "live" | "prize" | "attr" | "brand" | "elevated";
  children: React.ReactNode;
}) {
  return (
    <GhSurface
      id={id}
      variant={variant}
      borderRadius="2xl"
      scrollMarginTop="6rem"
      p={{ base: 4, sm: 5 }}
    >
      <HStack gap="3" mb="3" align="flex-start">
        <Flex
          h="8"
          w="8"
          flexShrink={0}
          align="center"
          justify="center"
          borderRadius="lg"
          bg="bg.surface"
          borderWidth="1px"
          borderColor="border.default"
          fontSize="xs"
          fontFamily="mono"
          fontWeight="bold"
          color="fg.default"
        >
          {step}
        </Flex>
        <Text
          as="h2"
          fontFamily="heading"
          fontSize={{ base: "md", sm: "lg" }}
          fontWeight="semibold"
          color="fg.default"
          letterSpacing="tight"
        >
          {title}
        </Text>
      </HStack>
      {children}
    </GhSurface>
  );
}

function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <VStack
      as="ul"
      align="stretch"
      gap="2.5"
      pl="5"
      m="0"
      style={{ listStyleType: "disc" }}
    >
      {items.map((item, i) => (
        <Text
          as="li"
          key={i}
          fontSize="sm"
          color="fg.muted"
          lineHeight="relaxed"
          css={{
            "& strong": {
              color: "var(--chakra-colors-fg-default)",
              fontWeight: 600,
            },
            "& em": { fontStyle: "italic" },
          }}
        >
          {item}
        </Text>
      ))}
    </VStack>
  );
}
