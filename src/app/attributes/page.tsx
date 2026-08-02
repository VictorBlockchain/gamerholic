"use client";

import Link from "next/link";
import { Box, Grid, Text, VStack, HStack, SimpleGrid } from "@chakra-ui/react";
import { ModeHeader } from "@/components/spectacle/mode-header";
import { LoadoutRing } from "@/components/spectacle/loadout-ring";
import { GhBadge, GhButton, GhSurface, SectionDivider } from "@/components/ui";
import { ATTRIBUTES } from "@/lib/attributes";
import { Crosshair, Sparkles } from "lucide-react";

export default function AttributesPage() {
  return (
    <VStack align="stretch" gap="0">
      <ModeHeader
        mode="battle"
        icon={Sparkles}
        title="Attributes as assets"
        description="Power, Speed, Attack, Defense, Luck, Focus, Vitality, Crit — equip onto Dexsta XFTs and mint battle-ready fighters."
        badge="Token loadout"
        action={
          <Link href="/battle">
            <GhButton variant="attr" size="lg" leftIcon={<Crosshair size={18} />}>
              Enter battle
            </GhButton>
          </Link>
        }
      />

      <Grid
        templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
        gap="phi4"
        alignItems="center"
        mb="phi4"
      >
        <GhSurface variant="attr" p={{ base: "phi3", md: "phi4" }}>
          <HStack gap="2" mb="phi3" flexWrap="wrap">
            <GhBadge tone="attr">Loadout board</GhBadge>
            <GhBadge tone="brand">Dexsta XFT</GhBadge>
            <GhBadge tone="prize">Battleable</GhBadge>
          </HStack>
          <Text fontFamily="heading" fontWeight="extrabold" fontSize="lg" mb="phi2">
            Collectible → fighter
          </Text>
          <Text fontSize="sm" color="fg.muted" lineHeight="1.65" mb="phi3">
            Drop Attribute orbs onto a Dexsta XFT. Stats are tokens you own and
            re-equip — not just cosmetic traits. Build a kit, then challenge.
          </Text>
          {[
            "Pick Dexsta XFT",
            "Attach Attribute tokens",
            "Set element / moveset",
            "Enter Battle arena",
          ].map((s, i) => (
            <HStack
              key={s}
              gap="phi2"
              py="phi2"
              borderTopWidth={i ? "1px" : "0"}
              borderColor="whiteAlpha.100"
            >
              <GhBadge tone="attr">{i + 1}</GhBadge>
              <Text fontSize="sm" fontWeight="medium" fontFamily="heading">
                {s}
              </Text>
            </HStack>
          ))}
        </GhSurface>

        <Box py="phi3">
          <LoadoutRing
            xftName="Neon Fang"
            xftSub="Dexsta Lead · AURORA"
            equipped={{
              power: 72,
              speed: 88,
              attack: 81,
              defense: 54,
              luck: 40,
              vitality: 65,
            }}
          />
          <Text
            textAlign="center"
            fontSize="xs"
            color="fg.subtle"
            mt="phi3"
            fontFamily="heading"
          >
            Active orbs glow · empty slots wait for tokens
          </Text>
        </Box>
      </Grid>

      <SectionDivider label="Catalog" tone="attr" my="0" />

      <Text fontFamily="heading" fontWeight="bold" mb="phi3" mt="phi3">
        Attribute catalog
      </Text>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="phi3" mb="phi4">
        {ATTRIBUTES.map((a) => (
          <GhSurface key={a.id} variant="elevated" p="phi3">
            <HStack gap="phi2" mb="phi2">
              <Box
                w="10"
                h="10"
                borderRadius="xl"
                bg={`${a.color}22`}
                borderWidth="1px"
                borderColor={`${a.color}55`}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text
                  fontFamily="heading"
                  fontSize="xs"
                  fontWeight="extrabold"
                  color={a.color}
                >
                  {a.short}
                </Text>
              </Box>
              <Box>
                <Text fontFamily="heading" fontWeight="bold">
                  {a.name}
                </Text>
                <Text fontSize="2xs" color="fg.subtle">
                  Token · equippable
                </Text>
              </Box>
            </HStack>
            <Text fontSize="xs" color="fg.muted" mb="phi2" lineHeight="1.5">
              {a.blurb}
            </Text>
            <Text fontSize="xs" color="attr.fg" fontWeight="semibold">
              {a.battle}
            </Text>
            <Box mt="phi2" h="1.5" bg="bg.muted" borderRadius="full" overflow="hidden">
              <Box
                h="100%"
                borderRadius="full"
                style={{
                  width: `${55 + (a.name.length % 5) * 8}%`,
                  background: `linear-gradient(90deg, ${a.color}88, ${a.color})`,
                }}
              />
            </Box>
          </GhSurface>
        ))}
      </SimpleGrid>

      <HStack gap="phi2" flexWrap="wrap">
        <GhButton variant="attr" leftIcon={<Sparkles size={16} />}>
          Mint attributes (soon)
        </GhButton>
        <Link href="/battle">
          <GhButton variant="outline" leftIcon={<Crosshair size={16} />}>
            See fighters
          </GhButton>
        </Link>
      </HStack>
    </VStack>
  );
}
