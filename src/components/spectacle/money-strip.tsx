"use client";

import { Box, Flex, Grid, HStack, Text, VStack } from "@chakra-ui/react";
import { CountUp } from "@/components/spectacle/count-up";
import { GhBadge } from "@/components/ui";
import type { LucideIcon } from "lucide-react";
import { Calculator, Crown, TrendingUp } from "lucide-react";

/** Host bank spectacle — count-up + pot / cut breakdown */
export function HostMoneyStrip({
  bankIcp = 48.2,
  weekIcp = 2.4,
  openPots = 3,
  estCut = 1.8,
}: {
  bankIcp?: number;
  weekIcp?: number;
  openPots?: number;
  estCut?: number;
}) {
  return (
    <Box
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="prize.solid"
      bg="prize.muted"
      p={{ base: "phi3", md: "phi4" }}
      boxShadow="glow-prize"
      mb="phi4"
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        gap="phi4"
        align={{ md: "center" }}
        justify="space-between"
      >
        <Box>
          <Text
            fontFamily="heading"
            fontSize="2xs"
            fontWeight="bold"
            letterSpacing="0.18em"
            textTransform="uppercase"
            color="prize.fg"
            mb="1"
          >
            Host bank
          </Text>
          <HStack align="baseline" gap="2">
            <CountUp
              value={bankIcp}
              decimals={1}
              suffix=" ICP"
              fontFamily="heading"
              fontSize={{ base: "3xl", md: "4xl" }}
              fontWeight="extrabold"
              className="gh-text-prize"
              lineHeight="1"
            />
            <GhBadge tone="prize" pulse>
              +{weekIcp} this week
            </GhBadge>
          </HStack>
          <Text fontSize="xs" color="fg.muted" mt="phi2" maxW="sm" lineHeight="1.5">
            Your cut when tournaments and rooms settle — separate from player prizes.
          </Text>
        </Box>
        <Grid templateColumns="repeat(2, 1fr)" gap="phi2" minW={{ md: "16rem" }}>
          <StatCell label="Open pots" value={String(openPots)} />
          <StatCell label="Est. cut" value={`~${estCut} ICP`} />
        </Grid>
      </Flex>
    </Box>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <Box
      p="phi2"
      borderRadius="xl"
      bg="blackAlpha.400"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
    >
      <Text fontFamily="heading" fontWeight="bold" fontSize="md">
        {value}
      </Text>
      <Text fontSize="2xs" color="fg.muted">
        {label}
      </Text>
    </Box>
  );
}

/** Arcade formula strip: FAILS × FEE = BANK */
export function ArcadeFormulaStrip({
  fails = 14,
  feeIcp = 0.15,
  bankIcp,
}: {
  fails?: number;
  feeIcp?: number;
  bankIcp?: number;
}) {
  const bank = bankIcp ?? fails * feeIcp;

  return (
    <Box
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="attr.solid"
      bg="attr.muted"
      p={{ base: "phi3", md: "phi4" }}
      boxShadow="glow-attr"
      mb="phi4"
      className="gh-crt-frame"
    >
      <HStack gap="2" mb="phi3" flexWrap="wrap">
        <Crown size={16} className="gh-crown-glow" color="var(--gh-colors-attr-fg)" />
        <Text
          fontFamily="heading"
          fontSize="2xs"
          fontWeight="bold"
          letterSpacing="0.16em"
          textTransform="uppercase"
          color="attr.fg"
        >
          Defend the crown · fail = income
        </Text>
      </HStack>

      <Flex
        align="center"
        justify="center"
        gap={{ base: 2, sm: 3, md: 4 }}
        flexWrap="wrap"
        fontFamily="heading"
      >
        <FormulaBlock
          icon={TrendingUp}
          label="Fails"
          value={<CountUp value={fails} decimals={0} fontSize="2xl" fontWeight="extrabold" />}
        />
        <Text fontSize="xl" color="fg.subtle" fontWeight="bold">
          ×
        </Text>
        <FormulaBlock
          icon={Calculator}
          label="Try fee"
          value={
            <Text fontSize="2xl" fontWeight="extrabold">
              {feeIcp} ICP
            </Text>
          }
        />
        <Text fontSize="xl" color="fg.subtle" fontWeight="bold">
          =
        </Text>
        <FormulaBlock
          highlight
          icon={Crown}
          label="Your bank"
          value={
            <CountUp
              value={bank}
              decimals={2}
              suffix=" ICP"
              fontSize="2xl"
              fontWeight="extrabold"
              className="gh-text-attr"
            />
          }
        />
      </Flex>
    </Box>
  );
}

function FormulaBlock({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  highlight?: boolean;
}) {
  return (
    <VStack
      gap="1"
      px="phi3"
      py="phi2"
      borderRadius="xl"
      bg={highlight ? "blackAlpha.500" : "blackAlpha.300"}
      borderWidth="1px"
      borderColor={highlight ? "attr.solid" : "border.default"}
      minW="6.5rem"
    >
      <HStack gap="1" color="fg.subtle">
        <Icon size={12} />
        <Text fontSize="2xs" fontWeight="bold" letterSpacing="0.12em" textTransform="uppercase">
          {label}
        </Text>
      </HStack>
      {value}
    </VStack>
  );
}
