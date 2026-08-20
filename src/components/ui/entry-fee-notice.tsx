"use client";

/**
 * Fee disclosure when stake / entry / buy-in > 0.
 * Debit = amount + ledger transfer fee from play subaccount → escrow.
 */

import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { Coins, Info } from "lucide-react";
import { ICP_TRANSFER_FEE, requiredIcpForChallengeEntry } from "@/lib/ic/gamer-service";
import { PAYOUT_POLICY } from "@/lib/ic/settlement-service";

export type EntryFeeKind = "challenge" | "tournament" | "room_game";

function formatIcpAmt(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 ICP";
  const s =
    n < 0.01
      ? n.toFixed(4)
      : n < 1
        ? n.toFixed(3)
        : n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return `${s.replace(/\.?0+$/, "")} ICP`;
}

function kindLabel(kind: EntryFeeKind): string {
  if (kind === "tournament") return "Entry fee";
  if (kind === "room_game") return "Buy-in";
  return "Wager / stake";
}

function settleNote(kind: EntryFeeKind): string {
  const { hostBps, modBps, headsUpPlatformBps, tournamentPlatformBps, vaultBps } =
    PAYOUT_POLICY;
  const hostPct = hostBps / 100;
  const modPct = modBps / 100;
  const huPlatPct = headsUpPlatformBps / 100;
  const tPlatPct = tournamentPlatformBps / 100;
  const vaultPct = vaultBps / 100;
  if (kind === "challenge") {
    return `On claim: winner gets remainder after platform ~${huPlatPct}% · vault ${vaultPct}% · monitor ${modPct}% (if assigned). Credits go to play subaccounts. Live rates are admin-set.`;
  }
  if (kind === "tournament") {
    return `On claim: winner remainder · host ~${hostPct}% · platform ~${tPlatPct}% · vault ${vaultPct}% · mod ${modPct}% if set. Live rates are admin-set.`;
  }
  return `On claim: winner remainder · room host ~${hostPct}% · platform ~${tPlatPct}% · vault ${vaultPct}% · mod ${modPct}% if set. Live rates are admin-set.`;
}

export type EntryFeeNoticeProps = {
  /** Stake / entry / buy-in in ICP */
  amountIcp: number;
  kind: EntryFeeKind;
  /** Compact single-line for buttons / tight spaces */
  compact?: boolean;
  /** Hide settle-split note */
  hideSettleNote?: boolean;
};

/**
 * Renders nothing when amount is 0 or invalid (free entry).
 */
export function EntryFeeNotice({
  amountIcp,
  kind,
  compact = false,
  hideSettleNote = false,
}: EntryFeeNoticeProps) {
  const n = Number(amountIcp);
  if (!Number.isFinite(n) || n <= 0) return null;

  const total = requiredIcpForChallengeEntry(n);
  const label = kindLabel(kind);

  if (compact) {
    return (
      <Text fontSize="2xs" color="prize.fg" fontWeight="bold">
        {label} {formatIcpAmt(n)} · +{formatIcpAmt(ICP_TRANSFER_FEE)} ledger ·
        total {formatIcpAmt(total)} from play sub
      </Text>
    );
  }

  return (
    <Box
      p="phi3"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="prize.solid"
      bg="prize.muted"
    >
      <HStack gap="2" mb="phi2" color="prize.fg">
        <Coins size={14} />
        <Text
          fontFamily="heading"
          fontSize="2xs"
          fontWeight="extrabold"
          letterSpacing="0.1em"
          textTransform="uppercase"
        >
          Fees · wager &gt; 0
        </Text>
      </HStack>
      <VStack align="stretch" gap="1.5" fontSize="xs">
        <HStack justify="space-between" gap="2">
          <Text color="fg.muted">{label}</Text>
          <Text fontWeight="bold" fontVariantNumeric="tabular-nums">
            {formatIcpAmt(n)}
          </Text>
        </HStack>
        <HStack justify="space-between" gap="2">
          <Text color="fg.muted">ICP ledger transfer fee</Text>
          <Text fontWeight="bold" fontVariantNumeric="tabular-nums">
            {formatIcpAmt(ICP_TRANSFER_FEE)}
          </Text>
        </HStack>
        <HStack
          justify="space-between"
          gap="2"
          pt="1.5"
          borderTopWidth="1px"
          borderColor="whiteAlpha.200"
        >
          <Text fontWeight="extrabold" color="prize.fg">
            Debited from play subaccount
          </Text>
          <Text
            fontFamily="heading"
            fontWeight="extrabold"
            className="gh-text-prize"
            fontVariantNumeric="tabular-nums"
          >
            {formatIcpAmt(total)}
          </Text>
        </HStack>
        {!hideSettleNote ? (
          <HStack gap="1.5" align="flex-start" mt="1" color="fg.subtle">
            <Info size={12} style={{ marginTop: 2, flexShrink: 0 }} />
            <Text fontSize="2xs" lineHeight="1.45">
              {settleNote(kind)}
            </Text>
          </HStack>
        ) : null}
      </VStack>
    </Box>
  );
}
