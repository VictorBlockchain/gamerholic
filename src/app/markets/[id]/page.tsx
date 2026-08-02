"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { ArrowLeft, ChartCandlestick, Swords, Trophy } from "lucide-react";
import {
  GhBadge,
  GhButton,
  GhEmptyState,
  GhSurface,
} from "@/components/ui";

/**
 * Market detail — no mock books; surface coming soon.
 * Client params for static export deep links.
 */
export default function MarketDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

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
      </HStack>

      <GhSurface
        variant="elevated"
        p={{ base: "phi4", md: "phi5" }}
        borderColor="prize.solid"
        boxShadow="glow-prize"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          inset="0"
          backgroundImage="
            radial-gradient(ellipse 50% 70% at 100% 0%, rgba(244,63,168,0.16), transparent 55%)
          "
          pointerEvents="none"
        />
        <Box position="relative">
          <HStack gap="2" mb="phi2" flexWrap="wrap">
            <Box
              w="10"
              h="10"
              borderRadius="xl"
              bg="prize.muted"
              color="prize.fg"
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderWidth="1px"
              borderColor="prize.solid"
            >
              <ChartCandlestick size={20} />
            </Box>
            <Box>
              <Text
                fontFamily="heading"
                fontWeight="extrabold"
                fontSize="lg"
                letterSpacing="0.02em"
              >
                Prediction markets for esports
              </Text>
              <Text fontSize="xs" color="fg.subtle">
                Market id · {id || "—"}
              </Text>
            </Box>
          </HStack>
          <Text fontSize="sm" color="fg.muted" lineHeight="1.6" maxW="36rem">
            Individual market pages will open here when betable books go live.
            No demo odds or mock volume are shown.
          </Text>
        </Box>
      </GhSurface>

      <GhEmptyState
        icon={ChartCandlestick}
        title="Market not available yet"
        description="Prediction markets are coming soon. Browse heads-up and tournaments in the meantime — books will attach to live events."
        action={
          <HStack gap="2" flexWrap="wrap" justify="center">
            <Link href="/markets">
              <GhButton variant="outline">Markets hub</GhButton>
            </Link>
            <Link href="/challenges">
              <GhButton variant="primary" leftIcon={<Swords size={16} />}>
                Challenges
              </GhButton>
            </Link>
            <Link href="/tournaments">
              <GhButton variant="prize" leftIcon={<Trophy size={16} />}>
                Tournaments
              </GhButton>
            </Link>
          </HStack>
        }
      />
    </VStack>
  );
}
