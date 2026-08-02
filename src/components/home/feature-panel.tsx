"use client";

import Link from "next/link";
import { Box, Flex, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { GhBadge, GhButton } from "@/components/ui";

type Tone = "brand" | "prize" | "attr" | "live";

/**
 * Full-bleed game “level select” panel — image + clear selling copy.
 */
export function FeaturePanel({
  image,
  tone,
  kicker,
  title,
  sell,
  points,
  href,
  cta,
  icon: Icon,
  reverse,
}: {
  image: string;
  tone: Tone;
  kicker: string;
  title: string;
  sell: string;
  points: string[];
  href: string;
  cta: string;
  icon: LucideIcon;
  reverse?: boolean;
}) {
  const accent =
    tone === "prize"
      ? "prize.fg"
      : tone === "attr"
        ? "attr.fg"
        : tone === "live"
          ? "live.fg"
          : "brand.fg";
  const btn =
    tone === "prize"
      ? "prize"
      : tone === "attr"
        ? "attr"
        : tone === "live"
          ? "live"
          : "primary";

  return (
    <Box
      borderRadius="3xl"
      overflow="hidden"
      borderWidth="1px"
      borderColor="border.default"
      bg="bg.glass"
      backdropFilter="blur(16px)"
      className="gh-game-panel"
      mb="phi2"
    >
      <Flex
        direction={{
          base: "column",
          lg: reverse ? "row-reverse" : "row",
        }}
        minH={{ lg: "22rem" }}
      >
        {/* Art */}
        <Box
          position="relative"
          flex={{ lg: "1.15" }}
          minH={{ base: "14rem", sm: "18rem", lg: "auto" }}
          overflow="hidden"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <Box
            position="absolute"
            inset="0"
            bg={
              reverse
                ? "linear-gradient(90deg, transparent 40%, rgba(11,14,20,0.92) 100%)"
                : "linear-gradient(270deg, transparent 40%, rgba(11,14,20,0.92) 100%)"
            }
            display={{ base: "none", lg: "block" }}
          />
          <Box
            position="absolute"
            inset="0"
            bg="linear-gradient(180deg, transparent 45%, rgba(11,14,20,0.88) 100%)"
            display={{ base: "block", lg: "none" }}
          />
          {/* Corner HUD frame */}
          <Box
            position="absolute"
            top="3"
            left="3"
            w="10"
            h="10"
            borderTopWidth="2px"
            borderLeftWidth="2px"
            borderColor={accent}
            opacity={0.8}
          />
          <Box
            position="absolute"
            bottom="3"
            right="3"
            w="10"
            h="10"
            borderBottomWidth="2px"
            borderRightWidth="2px"
            borderColor={accent}
            opacity={0.8}
          />
        </Box>

        {/* Copy */}
        <VStack
          align="flex-start"
          justify="center"
          flex="1"
          p={{ base: "phi3", md: "phi4", lg: "phi5" }}
          gap="phi3"
        >
          <HStack gap="2">
            <Box
              w="9"
              h="9"
              borderRadius="lg"
              bg="blackAlpha.500"
              borderWidth="1px"
              borderColor="border.default"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color={accent}
            >
              <Icon size={18} />
            </Box>
            <GhBadge tone={tone}>{kicker}</GhBadge>
          </HStack>
          <Heading
            as="h2"
            fontFamily="heading"
            fontSize={{ base: "xl", md: "2xl" }}
            fontWeight="extrabold"
            letterSpacing="0.03em"
            lineHeight="1.15"
          >
            {title}
          </Heading>
          <Text fontSize="md" color="fg.muted" lineHeight="1.65" maxW="md">
            {sell}
          </Text>
          <VStack align="stretch" gap="phi2" w="100%">
            {points.map((p) => (
              <HStack key={p} gap="phi2" align="flex-start">
                <Box
                  mt="1.5"
                  w="1.5"
                  h="1.5"
                  borderRadius="sm"
                  transform="rotate(45deg)"
                  bg={accent}
                  flexShrink={0}
                />
                <Text fontSize="sm" color="fg.default" lineHeight="1.5">
                  {p}
                </Text>
              </HStack>
            ))}
          </VStack>
          <Link href={href}>
            <GhButton
              variant={btn as "primary" | "prize" | "attr" | "live"}
              size="lg"
              rightIcon={<ArrowRight size={18} />}
              leftIcon={<Icon size={18} />}
            >
              {cta}
            </GhButton>
          </Link>
        </VStack>
      </Flex>
    </Box>
  );
}
