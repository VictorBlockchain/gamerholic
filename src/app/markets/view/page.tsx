"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HStack, Text, VStack } from "@chakra-ui/react";
import { ArrowLeft, ChartCandlestick, Swords, Trophy } from "lucide-react";
import {
  GhBadge,
  GhButton,
  GhEmptyState,
  GhSurface,
} from "@/components/ui";

function MarketViewInner() {
  const search = useSearchParams();
  const id = useMemo(() => (search?.get("id") || "").trim(), [search]);

  return (
    <VStack align="stretch" gap="phi4" pb="phi5">
      <HStack gap="2" flexWrap="wrap">
        <Link href="/markets">
          <GhButton size="sm" variant="ghost" leftIcon={<ArrowLeft size={14} />}>
            All markets
          </GhButton>
        </Link>
        <GhBadge tone="muted" letterSpacing="0.08em" textTransform="uppercase">
          Coming soon
        </GhBadge>
        {id ? (
          <GhBadge tone="prize" fontFamily="mono" fontSize="2xs">
            {id}
          </GhBadge>
        ) : null}
      </HStack>

      <GhSurface
        variant="elevated"
        p={{ base: "phi4", md: "phi5" }}
        borderColor="prize.solid"
        boxShadow="glow-prize"
      >
        <GhEmptyState
          icon={ChartCandlestick}
          title="Betable markets coming soon"
          description={
            id
              ? `Market ${id} will open here when the books go live.`
              : "Moneyline books for challenges and tournaments."
          }
        />
        <HStack gap="2" mt="phi4" flexWrap="wrap" justify="center">
          <Link href="/challenges">
            <GhButton size="sm" variant="soft" leftIcon={<Swords size={14} />}>
              Challenges
            </GhButton>
          </Link>
          <Link href="/tournaments">
            <GhButton size="sm" variant="soft" leftIcon={<Trophy size={14} />}>
              Tournaments
            </GhButton>
          </Link>
        </HStack>
      </GhSurface>
    </VStack>
  );
}

export default function MarketViewQueryPage() {
  return (
    <Suspense fallback={<Text color="fg.muted">Loading market…</Text>}>
      <MarketViewInner />
    </Suspense>
  );
}
