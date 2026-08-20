"use client";

/**
 * Styled low-balance callout for stakes, arcade insert, tournament entry.
 * Prefer this (and toastLowBalance) over raw canister InsufficientFunds.
 */

import Link from "next/link";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { AlertTriangle, Wallet } from "lucide-react";
import { formatIcpShort } from "@/lib/ic/gamer-service";
import { GhButton } from "./gh-button";
import { ghToast } from "./gh-toast";

export type LowBalanceAlertProps = {
  /** What the user is trying to do (e.g. "insert coins", "accept this challenge") */
  action: string;
  needIcp: number;
  balanceIcp: number;
  /** Optional override of full message */
  message?: string;
  compact?: boolean;
  /** Hide deposit CTA */
  hideCta?: boolean;
};

export function LowBalanceAlert({
  action,
  needIcp,
  balanceIcp,
  message,
  compact = false,
  hideCta = false,
}: LowBalanceAlertProps) {
  const shortfall = Math.max(0, needIcp - balanceIcp);
  const body =
    message ||
    `Need ${formatIcpShort(needIcp)} ICP to ${action} · have ${formatIcpShort(balanceIcp)} ICP · short ${formatIcpShort(shortfall)} ICP.`;

  if (compact) {
    return (
      <HStack
        gap="2"
        p="phi2"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="danger.solid"
        bg="rgba(244, 63, 94, 0.12)"
        align="flex-start"
      >
        <Box color="danger.solid" mt="0.5" flexShrink={0}>
          <AlertTriangle size={14} />
        </Box>
        <Text fontSize="xs" color="fg.default" lineHeight="1.45" fontWeight="medium">
          <Text as="span" color="danger.solid" fontWeight="extrabold">
            Low balance
          </Text>
          {" · "}
          {body}
        </Text>
      </HStack>
    );
  }

  return (
    <Box
      p="phi3"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="danger.solid"
      bg="rgba(244, 63, 94, 0.12)"
      boxShadow="0 0 24px rgba(244, 63, 94, 0.12)"
    >
      <HStack gap="2" mb="phi2" color="danger.solid">
        <Wallet size={16} />
        <Text
          fontFamily="heading"
          fontSize="2xs"
          fontWeight="extrabold"
          letterSpacing="0.1em"
          textTransform="uppercase"
        >
          Low balance
        </Text>
      </HStack>
      <VStack align="stretch" gap="2">
        <Text fontSize="sm" color="fg.default" lineHeight="1.5" fontWeight="medium">
          {body}
        </Text>
        <HStack
          justify="space-between"
          gap="2"
          fontSize="xs"
          pt="1"
          borderTopWidth="1px"
          borderColor="whiteAlpha.200"
          flexWrap="wrap"
        >
          <Text color="fg.muted">
            Have{" "}
            <Text as="span" fontWeight="extrabold" color="fg.default">
              {formatIcpShort(balanceIcp)} ICP
            </Text>
          </Text>
          <Text color="fg.muted">
            Need{" "}
            <Text as="span" fontWeight="extrabold" className="gh-text-prize">
              {formatIcpShort(needIcp)} ICP
            </Text>
          </Text>
          <Text color="danger.solid" fontWeight="extrabold">
            Short {formatIcpShort(shortfall)} ICP
          </Text>
        </HStack>
        {!hideCta ? (
          <Link href="/wallet" style={{ textDecoration: "none", width: "100%" }}>
            <GhButton variant="prize" size="sm" w="100%" leftIcon={<Wallet size={14} />}>
              Deposit to play subaccount
            </GhButton>
          </Link>
        ) : null}
      </VStack>
    </Box>
  );
}

/** Toast when play-sub ICP is too low — use instead of waiting on canister errors. */
export function toastLowBalance(opts: {
  action: string;
  needIcp: number;
  balanceIcp: number;
  description?: string;
}) {
  const shortfall = Math.max(0, opts.needIcp - opts.balanceIcp);
  return ghToast({
    title: "Low balance",
    description:
      opts.description ||
      `Need ${formatIcpShort(opts.needIcp)} ICP to ${opts.action} · have ${formatIcpShort(opts.balanceIcp)} · short ${formatIcpShort(shortfall)}. Deposit on Wallet.`,
    type: "warning",
    duration: 6500,
    action: {
      label: "Open wallet",
      onClick: () => {
        if (typeof window !== "undefined") {
          window.location.assign("/wallet");
        }
      },
    },
  });
}
