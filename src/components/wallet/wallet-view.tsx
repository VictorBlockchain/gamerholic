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
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Copy,
  QrCode,
  Send,
  Shield,
  Sparkles,
  Wallet,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  GhAlert,
  GhBadge,
  GhButton,
  GhField,
  GhInput,
  GhModal,
  GhSurface,
  ghToast,
} from "@/components/ui";
import { useSession } from "@/components/providers/session-context";
import {
  DEMO_WALLET,
  DEMO_WALLET_TX,
  formatWhen,
  getAttributeBalanceRows,
  shortAccount,
  totalAttributeUnits,
} from "@/lib/wallet";

/**
 * Wallet — single play subaccount (ICP) + Assets As Attributes tokens.
 * Challenges & tournaments: ICP and/or Attribute tokens only.
 */
export function WalletView() {
  const { isLoggedIn, loginDemo, profile } = useSession();
  const [depositOpen, setDepositOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [toAddr, setToAddr] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  const depositAddress = DEMO_WALLET.subaccountAccount;
  const icpBalance = DEMO_WALLET.subaccountIcp;

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      ghToast({ title: "Copied", description: label, type: "success" });
    } catch {
      ghToast({ title: "Copy failed", type: "error" });
    }
  };

  const submitTransfer = () => {
    const n = parseFloat(amount);
    if (!toAddr.trim()) {
      ghToast({ title: "Recipient required", type: "error" });
      return;
    }
    if (!Number.isFinite(n) || n <= 0) {
      ghToast({ title: "Valid amount required", type: "error" });
      return;
    }
    if (n > icpBalance) {
      ghToast({
        title: "Insufficient balance",
        description: `Available ${icpBalance.toFixed(2)} ICP`,
        type: "error",
      });
      return;
    }
    ghToast({
      title: "Transfer drafted",
      description: `${n} ICP → ${shortAccount(toAddr)} (demo · II next)`,
      type: "success",
    });
    setTransferOpen(false);
    setToAddr("");
    setAmount("");
    setMemo("");
  };

  if (!isLoggedIn) {
    return (
      <VStack align="stretch" gap="phi4" pb="phi4">
        <GhSurface variant="glass" p="phi5">
          <VStack align="flex-start" gap="phi3" maxW="28rem">
            <GhBadge tone="brand">
              <Wallet size={11} /> Wallet
            </GhBadge>
            <Heading fontFamily="heading" fontSize="2xl" fontWeight="extrabold">
              Play balance
            </Heading>
            <Text color="fg.muted" fontSize="sm" lineHeight="1.6">
              One ICP subaccount for challenges and tournaments, plus Assets As
              Attributes tokens for battle loadouts. No multi-wallet clutter.
            </Text>
            <GhButton
              variant="primary"
              onClick={loginDemo}
              leftIcon={<Wallet size={16} />}
            >
              Enter demo wallet
            </GhButton>
          </VStack>
        </GhSurface>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" gap={{ base: "phi4", md: "phi5" }} pb="phi4">
      {/* Single ICP subaccount hero */}
      <Box
        position="relative"
        borderRadius="3xl"
        borderWidth="1px"
        borderColor="border.brand"
        overflow="hidden"
        boxShadow="glow"
      >
        <Box
          position="absolute"
          inset="0"
          bg="linear-gradient(125deg, rgba(163,255,61,0.18) 0%, rgba(13,11,26,0.94) 50%, rgba(139,92,246,0.12) 100%)"
        />
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          h="1.5"
          bg="linear-gradient(90deg, #a3ff3d, #8b5cf6)"
        />
        <Box position="relative" p={{ base: "phi4", md: "phi5" }}>
          <HStack justify="space-between" mb="phi3" flexWrap="wrap" gap="2">
            <HStack gap="2">
              <Box
                w="10"
                h="10"
                borderRadius="xl"
                bg="brand.muted"
                color="brand.fg"
                borderWidth="1px"
                borderColor="border.brand"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Wallet size={18} />
              </Box>
              <Box>
                <Text
                  fontFamily="heading"
                  fontSize="2xs"
                  fontWeight="bold"
                  letterSpacing="0.14em"
                  textTransform="uppercase"
                  color="brand.fg"
                >
                  Play subaccount · ICP
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {profile?.username ?? "you"} · challenges & tournaments
                </Text>
              </Box>
            </HStack>
            <GhBadge tone="live" pulse>
              Connected
            </GhBadge>
          </HStack>

          <HStack align="baseline" gap="2" mb="phi1">
            <Text
              fontFamily="heading"
              fontSize={{ base: "3xl", md: "4xl" }}
              fontWeight="extrabold"
              className="gh-text-volt"
              lineHeight="1"
              fontVariantNumeric="tabular-nums"
            >
              {icpBalance.toFixed(2)}
            </Text>
            <Text
              fontFamily="heading"
              fontWeight="bold"
              color="brand.fg"
              fontSize="lg"
            >
              ICP
            </Text>
          </HStack>
          <Text fontSize="sm" color="fg.muted" mb="phi2" maxW="28rem" lineHeight="1.5">
            Your only ICP balance for Gamerholic. Deposit here to stake
            challenges and tournament entries. Attribute tokens are listed below.
          </Text>
          <Text
            fontFamily="mono"
            fontSize="2xs"
            color="fg.subtle"
            mb="phi4"
            wordBreak="break-all"
          >
            {shortAccount(depositAddress, 16, 12)}
          </Text>

          <HStack gap="phi2" flexWrap="wrap">
            <GhButton
              variant="primary"
              leftIcon={<QrCode size={16} />}
              onClick={() => setDepositOpen(true)}
            >
              Deposit ICP
            </GhButton>
            <GhButton
              variant="outline"
              leftIcon={<Send size={16} />}
              onClick={() => setTransferOpen((v) => !v)}
              rightIcon={
                transferOpen ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )
              }
            >
              Transfer
            </GhButton>
            <GhButton
              variant="soft"
              size="sm"
              leftIcon={<Copy size={14} />}
              onClick={() =>
                copy(depositAddress, "Play subaccount address copied")
              }
            >
              Copy address
            </GhButton>
          </HStack>
        </Box>
      </Box>

      {/* Transfer show/hide */}
      {transferOpen ? (
        <GhSurface variant="elevated" p="phi4" id="gh-wallet-transfer">
          <HStack justify="space-between" mb="phi3" flexWrap="wrap" gap="2">
            <HStack gap="2">
              <Send size={16} color="var(--gh-colors-brand-fg)" />
              <Text fontFamily="heading" fontWeight="extrabold" fontSize="sm">
                Transfer ICP
              </Text>
            </HStack>
            <GhButton
              size="sm"
              variant="ghost"
              onClick={() => setTransferOpen(false)}
            >
              Hide
            </GhButton>
          </HStack>
          <VStack align="stretch" gap="phi3">
            <Text fontSize="xs" color="fg.muted">
              From play subaccount · available{" "}
              <strong style={{ color: "var(--gh-colors-brand-fg)" }}>
                {icpBalance.toFixed(2)} ICP
              </strong>
            </Text>
            <GhField label="To principal / account" required>
              <GhInput
                value={toAddr}
                onChange={(e) => setToAddr(e.target.value)}
                placeholder="Recipient principal or account"
                fontFamily="mono"
                fontSize="sm"
              />
            </GhField>
            <HStack gap="phi2" flexWrap="wrap" align="flex-start">
              <Box flex="1" minW="8rem">
                <GhField label="Amount (ICP)" required>
                  <GhInput
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    tone="brand"
                  />
                </GhField>
              </Box>
              <Box flex="1" minW="8rem">
                <GhField label="Memo (optional)">
                  <GhInput
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="Note"
                  />
                </GhField>
              </Box>
            </HStack>
            <GhAlert tone="brand" title="Demo transfer">
              Signing with Internet Identity attaches here. On-page form so II
              opens cleanly (not inside a modal).
            </GhAlert>
            <HStack gap="phi2">
              <GhButton
                variant="primary"
                leftIcon={<ArrowUpRight size={16} />}
                onClick={submitTransfer}
              >
                Send ICP
              </GhButton>
              <GhButton variant="ghost" onClick={() => setTransferOpen(false)}>
                Cancel
              </GhButton>
            </HStack>
          </VStack>
        </GhSurface>
      ) : null}

      {/* Assets As Attributes */}
      <AttributeBalancesSection />

      {/* Activity */}
      <Box>
        <Text
          fontFamily="heading"
          fontSize="2xs"
          fontWeight="bold"
          letterSpacing="0.14em"
          textTransform="uppercase"
          color="fg.subtle"
          mb="phi2"
        >
          Recent activity
        </Text>
        <VStack align="stretch" gap="phi2">
          {DEMO_WALLET_TX.map((tx) => (
            <GhSurface key={tx.id} variant="glass" p="phi3">
              <Flex justify="space-between" align="center" gap="phi2">
                <HStack gap="phi2" minW="0">
                  <Box
                    w="9"
                    h="9"
                    borderRadius="lg"
                    bg={
                      tx.amount.startsWith("+")
                        ? "brand.muted"
                        : "blackAlpha.400"
                    }
                    color={
                      tx.amount.startsWith("+") ? "brand.fg" : "fg.muted"
                    }
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    {tx.amount.startsWith("+") ? (
                      <ArrowDownLeft size={16} />
                    ) : (
                      <ArrowUpRight size={16} />
                    )}
                  </Box>
                  <Box minW="0">
                    <Text
                      fontFamily="heading"
                      fontWeight="bold"
                      fontSize="sm"
                      lineClamp={1}
                    >
                      {tx.label}
                    </Text>
                    <Text fontSize="2xs" color="fg.subtle">
                      {formatWhen(tx.at)} · {tx.status}
                    </Text>
                  </Box>
                </HStack>
                <Text
                  fontFamily="heading"
                  fontWeight="extrabold"
                  fontSize="sm"
                  color={
                    tx.amount.startsWith("+") ? "brand.fg" : "fg.default"
                  }
                  flexShrink={0}
                >
                  {tx.amount}
                </Text>
              </Flex>
            </GhSurface>
          ))}
        </VStack>
      </Box>

      <GhAlert tone="attr" title="What you can stake">
        Challenges and tournaments accept{" "}
        <strong>ICP</strong> and/or{" "}
        <strong>Assets As Attributes</strong> tokens only. Deposit ICP to this
        subaccount before entering pots.
      </GhAlert>

      {/* Deposit QR modal — subaccount only */}
      <GhModal
        open={depositOpen}
        onOpenChange={setDepositOpen}
        title="Deposit ICP"
        description="Send ICP to your play subaccount. Used for challenges and tournaments."
        tone="brand"
        size="md"
        footer={
          <GhButton variant="primary" onClick={() => setDepositOpen(false)}>
            Done
          </GhButton>
        }
      >
        <VStack align="stretch" gap="phi3">
          <Box
            mx="auto"
            p="phi3"
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="border.brand"
            bg="white"
            boxShadow="glow"
          >
            <QRCodeSVG
              value={depositAddress}
              size={200}
              level="M"
              includeMargin
              bgColor="#ffffff"
              fgColor="#0d0b1a"
            />
          </Box>

          <Box
            p="phi3"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.default"
            bg="blackAlpha.400"
          >
            <Text
              fontSize="2xs"
              color="fg.subtle"
              fontFamily="heading"
              letterSpacing="0.1em"
              textTransform="uppercase"
              mb="1"
            >
              {DEMO_WALLET.subaccountLabel}
            </Text>
            <Text
              fontFamily="mono"
              fontSize="xs"
              color="fg.default"
              wordBreak="break-all"
              lineHeight="1.5"
            >
              {depositAddress}
            </Text>
            <HStack gap="2" mt="phi2">
              <GhButton
                size="sm"
                variant="soft"
                leftIcon={<Copy size={14} />}
                onClick={() =>
                  copy(depositAddress, "Play subaccount address copied")
                }
              >
                Copy address
              </GhButton>
            </HStack>
          </Box>

          <HStack gap="2" color="fg.muted" fontSize="xs" align="flex-start">
            <Shield size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <Text>
              Send only ICP. Attribute tokens are separate ICRC assets — they
              show under Assets As Attributes after on-chain sync.
            </Text>
          </HStack>
        </VStack>
      </GhModal>
    </VStack>
  );
}

function AttributeBalancesSection() {
  const rows = getAttributeBalanceRows();
  const total = totalAttributeUnits();

  return (
    <Box
      borderRadius="3xl"
      borderWidth="1px"
      borderColor="attr.solid"
      overflow="hidden"
      boxShadow="glow-attr"
    >
      <Box h="1.5" bg="linear-gradient(90deg, #8b5cf6, #a3ff3d, #f43fa8)" />
      <Box p={{ base: "phi3", md: "phi4" }}>
        <Flex
          justify="space-between"
          align={{ base: "flex-start", sm: "center" }}
          gap="phi2"
          mb="phi3"
          direction={{ base: "column", sm: "row" }}
        >
          <Box>
            <HStack gap="2" mb="1" flexWrap="wrap">
              <Sparkles size={16} color="var(--gh-colors-attr-fg)" />
              <Text fontFamily="heading" fontWeight="extrabold" fontSize="md">
                Assets As Attributes
              </Text>
              <GhBadge tone="attr">On-chain</GhBadge>
              <GhBadge tone="muted">DB sync</GhBadge>
            </HStack>
            <Text fontSize="xs" color="fg.muted" maxW="28rem" lineHeight="1.5">
              Stake or equip in battles. Can also be used as challenge/tournament
              stakes alongside ICP. Mirrored in{" "}
              <Text as="span" fontFamily="mono" color="attr.fg">
                gh_attribute_balances
              </Text>
              .
            </Text>
          </Box>
          <VStack align={{ base: "flex-start", sm: "flex-end" }} gap="0">
            <Text
              fontFamily="heading"
              fontSize="2xs"
              fontWeight="bold"
              letterSpacing="0.1em"
              textTransform="uppercase"
              color="attr.fg"
            >
              Total units
            </Text>
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              fontSize="xl"
              color="attr.fg"
              fontVariantNumeric="tabular-nums"
            >
              {total.toLocaleString()}
            </Text>
          </VStack>
        </Flex>

        <Grid
          templateColumns={{
            base: "1fr 1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          }}
          gap="phi2"
        >
          {rows.map((row) => (
            <Box
              key={row.id}
              p="phi3"
              borderRadius="xl"
              borderWidth="1px"
              borderColor={`${row.color}55`}
              bg="blackAlpha.400"
              transition="transform 0.15s, box-shadow 0.15s"
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: `0 0 0 1px ${row.color}66, 0 12px 28px -12px ${row.color}55`,
              }}
            >
              <HStack gap="phi2" mb="phi2">
                <Box
                  w="10"
                  h="10"
                  borderRadius="lg"
                  overflow="hidden"
                  borderWidth="1px"
                  borderColor={`${row.color}88`}
                  flexShrink={0}
                  bg="blackAlpha.500"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={row.icon}
                    alt=""
                    width={40}
                    height={40}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>
                <Box minW="0">
                  <Text
                    fontFamily="heading"
                    fontWeight="extrabold"
                    fontSize="sm"
                    lineClamp={1}
                  >
                    {row.name}
                  </Text>
                  <Text fontSize="2xs" color="fg.subtle" fontFamily="mono">
                    {row.symbol}
                  </Text>
                </Box>
              </HStack>
              <Text
                fontFamily="heading"
                fontWeight="extrabold"
                fontSize="lg"
                style={{ color: row.color }}
                fontVariantNumeric="tabular-nums"
                lineHeight="1.1"
              >
                {row.balance.toLocaleString()}
              </Text>
              <Text fontSize="2xs" color="fg.subtle" mt="1" lineClamp={2}>
                {row.blurb}
              </Text>
            </Box>
          ))}
        </Grid>

        <HStack mt="phi3" gap="phi2" flexWrap="wrap">
          <Link href="/attributes">
            <GhButton
              size="sm"
              variant="attr"
              rightIcon={<Sparkles size={14} />}
            >
              Attribute catalog
            </GhButton>
          </Link>
          <Link href="/battle">
            <GhButton size="sm" variant="outline">
              Equip & battle
            </GhButton>
          </Link>
        </HStack>
      </Box>
    </Box>
  );
}
