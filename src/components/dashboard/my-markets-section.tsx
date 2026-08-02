"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Box, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import { ArrowRight, ChartCandlestick } from "lucide-react";
import { GhBadge, GhButton, GhEmptyState, GhSpinner, GhSurface } from "@/components/ui";
import { getSupabase } from "@/lib/supabase/client";
import { GH_TABLES } from "@/lib/supabase/tables";
import { useSession } from "@/components/providers/session-context";
import { useGhEventStream } from "@/hooks/use-gh-event-stream";

type MarketRow = {
  id: string;
  title: string;
  game: string;
  kind: string;
  status: string;
  volume_e8s?: number;
};

/**
 * Dashboard block — betable markets from Supabase mirror (user wagers + open markets).
 */
export function MyMarketsSection() {
  const { principal, user } = useSession();
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const sb = getSupabase();
      if (!sb) {
        setMarkets([]);
        return;
      }
      const addr = principal || user?.id || "";
      let ids: string[] = [];
      if (addr) {
        const { data: wagers } = await sb
          .from(GH_TABLES.marketWagers)
          .select("market_id")
          .eq("principal", addr)
          .limit(50);
        ids = [...new Set((wagers || []).map((w) => String(w.market_id)))];
      }
      let q = sb
        .from(GH_TABLES.markets)
        .select("id,title,game,kind,status,volume_e8s")
        .order("updated_at", { ascending: false })
        .limit(12);
      if (ids.length) {
        q = q.in("id", ids);
      }
      const { data } = await q;
      setMarkets((data as MarketRow[]) || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [principal, user?.id]);

  useGhEventStream({
    channel: "gh-my-markets",
    table: GH_TABLES.markets,
    onChange: () => {
      void load();
    },
  });

  const liveCount = markets.filter(
    (m) => m.status === "live" || m.status === "active" || m.status === "open",
  ).length;

  return (
    <Box
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="border.default"
      bg="bg.glass"
      backdropFilter="blur(16px)"
      p={{ base: "phi3", md: "phi4" }}
    >
      <Flex
        justify="space-between"
        align={{ base: "flex-start", sm: "center" }}
        mb="phi3"
        gap="phi2"
        direction={{ base: "column", sm: "row" }}
      >
        <HStack gap="2" align="flex-start">
          <Box
            w="9"
            h="9"
            borderRadius="lg"
            bg="prize.muted"
            color="prize.fg"
            borderWidth="1px"
            borderColor="prize.solid"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <ChartCandlestick size={16} />
          </Box>
          <Box>
            <HStack gap="2" mb="0.5" flexWrap="wrap">
              <Text fontFamily="heading" fontWeight="extrabold" fontSize="md">
                My betable markets
              </Text>
              {liveCount > 0 ? (
                <GhBadge tone="live" pulse>
                  {liveCount} live
                </GhBadge>
              ) : null}
            </HStack>
            <Text fontSize="xs" color="fg.muted">
              Your wagers &amp; open books · Realtime
            </Text>
          </Box>
        </HStack>
        <Link href="/markets">
          <GhButton size="sm" variant="prize" rightIcon={<ArrowRight size={14} />}>
            All markets
          </GhButton>
        </Link>
      </Flex>

      {loading ? (
        <HStack py="phi4" justify="center">
          <GhSpinner />
        </HStack>
      ) : markets.length === 0 ? (
        <GhEmptyState
          icon={ChartCandlestick}
          title="No markets yet"
          description="Stake on a challenge or tournament market — it shows up here."
        />
      ) : (
        <VStack align="stretch" gap="2">
          {markets.map((m) => (
            <Link
              key={m.id}
              href={`/markets/${encodeURIComponent(m.id)}`}
              style={{ textDecoration: "none" }}
            >
              <GhSurface
                variant="elevated"
                p="phi3"
                _hover={{ borderColor: "prize.solid", boxShadow: "glow-prize" }}
                transition="all 0.15s ease"
              >
                <HStack justify="space-between" gap="2" flexWrap="wrap">
                  <Box minW="0">
                    <HStack gap="2" mb="0.5">
                      <GhBadge tone="muted">{m.kind || "market"}</GhBadge>
                      <GhBadge
                        tone={
                          m.status === "resolved"
                            ? "success"
                            : m.status === "closed"
                              ? "muted"
                              : "live"
                        }
                      >
                        {m.status}
                      </GhBadge>
                    </HStack>
                    <Text
                      fontFamily="heading"
                      fontWeight="bold"
                      fontSize="sm"
                      lineClamp={1}
                    >
                      {m.title || m.id}
                    </Text>
                    <Text fontSize="2xs" color="fg.subtle">
                      {m.game || "—"}
                      {m.volume_e8s != null
                        ? ` · vol ${(Number(m.volume_e8s) / 1e8).toFixed(2)} ICP`
                        : ""}
                    </Text>
                  </Box>
                  <ChartCandlestick size={16} color="var(--gh-colors-prize-fg)" />
                </HStack>
              </GhSurface>
            </Link>
          ))}
        </VStack>
      )}
    </Box>
  );
}
