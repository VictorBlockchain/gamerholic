"use client";

import Link from "next/link";
import { Box, Flex, Grid, Heading, HStack, Text } from "@chakra-ui/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { ATTRIBUTES } from "@/lib/attributes";
import { ART } from "@/lib/art";
import { GhButton } from "@/components/ui";

/** Soft art cycle behind attribute tiles */
const BG_CYCLE = [
  ART.battle,
  ART.arcadeFriends,
  ART.headsUp,
  ART.teamWin,
  ART.teamHighfive,
  ART.hero,
  ART.gear,
  ART.arcade,
] as const;

/**
 * “Assets As Attributes” — gaming currency row with per-tile background art.
 */
export function AttributesCurrencyRow() {
  return (
    <Box className="gh-home-section">
      <Flex
        justify="space-between"
        align="flex-end"
        mb="phi3"
        gap="phi2"
        flexWrap="wrap"
      >
        <Box maxW="36rem">
          <Text
            fontFamily="heading"
            fontSize="2xs"
            fontWeight="bold"
            letterSpacing="0.2em"
            textTransform="uppercase"
            color="attr.fg"
            mb="phi1"
          >
            Gaming currency
          </Text>
          <Heading
            as="h2"
            fontFamily="heading"
            fontSize={{ base: "xl", md: "2xl" }}
            fontWeight="extrabold"
            letterSpacing="0.03em"
            textTransform="uppercase"
            lineHeight="1.15"
          >
            Assets As{" "}
            <Text as="span" className="gh-text-attr">
              Attributes
            </Text>
          </Heading>
          <Text fontSize="sm" color="fg.muted" mt="phi2" lineHeight="1.6">
            Equip Power, Speed, Attack, Defense and more onto Dexsta XFTs —
            tradeable attribute tokens that power battles and loadouts.
          </Text>
        </Box>
        <Link href="/attributes">
          <GhButton
            variant="attr"
            size="sm"
            leftIcon={<Sparkles size={14} />}
            rightIcon={<ArrowRight size={14} />}
          >
            Full catalog
          </GhButton>
        </Link>
      </Flex>

      <Grid
        templateColumns={{
          base: "repeat(2, 1fr)",
          sm: "repeat(4, 1fr)",
          lg: "repeat(8, 1fr)",
        }}
        gap="phi2"
      >
        {ATTRIBUTES.map((a, i) => {
          const bg = BG_CYCLE[i % BG_CYCLE.length];
          return (
            <Box
              key={a.id}
              position="relative"
              overflow="hidden"
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={`${a.color}55`}
              minH="7.5rem"
              transition="transform 0.15s, box-shadow 0.15s"
              _hover={{
                transform: "translateY(-3px)",
                boxShadow: `0 0 0 1px ${a.color}88, 0 12px 32px -12px ${a.color}66`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bg}
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "brightness(0.35) saturate(1.15)",
                }}
              />
              <Box
                position="absolute"
                inset="0"
                bg={`linear-gradient(160deg, ${a.color}33 0%, rgba(7,6,18,0.85) 70%)`}
              />
              <Flex
                position="relative"
                direction="column"
                align="center"
                justify="center"
                h="100%"
                p="phi2"
                textAlign="center"
                gap="1"
              >
                <Box
                  w="9"
                  h="9"
                  borderRadius="lg"
                  borderWidth="2px"
                  borderColor={a.color}
                  bg={`${a.color}22`}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow={`0 0 16px ${a.color}44`}
                >
                  <Text
                    fontFamily="heading"
                    fontSize="2xs"
                    fontWeight="extrabold"
                    color={a.color}
                  >
                    {a.short}
                  </Text>
                </Box>
                <Text
                  fontFamily="heading"
                  fontWeight="extrabold"
                  fontSize="xs"
                  letterSpacing="0.04em"
                >
                  {a.name}
                </Text>
                <Text fontSize="2xs" color="fg.subtle" lineClamp={1}>
                  Token
                </Text>
              </Flex>
            </Box>
          );
        })}
      </Grid>
    </Box>
  );
}
