"use client";

import { useState } from "react";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { Bot, Check, Copy, Hammer, Sparkles } from "lucide-react";
import {
  GhBadge,
  GhButton,
  GhSurface,
  SectionDivider,
  ghToast,
} from "@/components/ui";
import {
  GAME_ASSET_INTEGRATION_BLURB,
  GAMERHOLIC_ARCADE_AI_PROMPT,
} from "@/lib/arcade/ai-prompt";
import { PHASER_ENGINE } from "@/lib/arcade/engine";

/**
 * Detailed Grok/AI integration guide + copyable system prompt.
 * Text is high-contrast white for readability on dark / attr surfaces.
 */
export function ArcadeAiPromptSection() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(GAMERHOLIC_ARCADE_AI_PROMPT);
      setCopied(true);
      ghToast({ title: "Prompt copied — paste into Grok", type: "success" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      ghToast({ title: "Copy failed", type: "error" });
    }
  };

  return (
    <VStack align="stretch" gap="phi4" mt="phi2">
      <SectionDivider label="Build with AI" tone="attr" my="0" />

      <GhSurface
        variant="attr"
        p={{ base: "phi3", md: "phi4" }}
        color="white"
        borderColor="whiteAlpha.300"
      >
        <HStack gap="2" mb="phi2" flexWrap="wrap">
          <Bot size={18} color="#fff" />
          <Text
            fontFamily="heading"
            fontWeight="extrabold"
            fontSize="md"
            letterSpacing="0.04em"
            color="white"
          >
            Gamerholic game integration prompt
          </Text>
          <GhBadge tone="attr">Recommended: Grok</GhBadge>
        </HStack>
        <Text fontSize="sm" color="white" lineHeight="1.65" mb="phi3" opacity={0.95}>
          Use <strong style={{ color: "#fff" }}>Grok</strong> with the shared{" "}
          <strong style={{ color: "#a3ff3d" }}>
            {PHASER_ENGINE.name} {PHASER_ENGINE.version}
          </strong>{" "}
          engine. Do <strong style={{ color: "#fff" }}>not</strong> generate a full HTML
          document — that conflicts with the app. Output{" "}
          <code style={{ color: "#a3ff3d" }}>CSS</code> +{" "}
          <code style={{ color: "#a3ff3d" }}>gameCode</code> only, then paste into{" "}
          <strong style={{ color: "#fff" }}>Add Game</strong>.
        </Text>

        <VStack align="stretch" gap="phi2" mb="phi3">
          {[
            `Standard engine: ${PHASER_ENGINE.name} — host loads Phaser; games never ship their own <html>.`,
            "Register window.GamerholicArcadeGame.boot(Phaser, bridge, parentEl).",
            "Host tells the game when to start and stop (timer, leave, crash).",
            "Game reports score via bridge; host records only if insert fee was paid.",
            "Host injects game-asset XFTs (including wraps + bag Power tokens).",
            "Mobile full-bleed — host draws SCORE + TIME top-left; leave that zone free.",
          ].map((line) => (
            <HStack key={line} gap="2" align="flex-start">
              <Sparkles size={14} color="#a3ff3d" style={{ flexShrink: 0, marginTop: 2 }} />
              <Text fontSize="sm" color="white" lineHeight="1.55" opacity={0.95}>
                {line}
              </Text>
            </HStack>
          ))}
        </VStack>

        <GhButton
          variant="attr"
          leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}
          onClick={() => void copy()}
          mb="phi3"
        >
          {copied ? "Copied" : "Copy full Grok prompt"}
        </GhButton>

        <Box
          as="pre"
          fontFamily="mono"
          fontSize="xs"
          p="phi3"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="whiteAlpha.300"
          bg="blackAlpha.700"
          maxH="16rem"
          overflow="auto"
          whiteSpace="pre-wrap"
          color="white"
          lineHeight="1.5"
          opacity={0.95}
        >
          {GAMERHOLIC_ARCADE_AI_PROMPT.slice(0, 1800)}
          {"\n\n… (full prompt copied to clipboard)"}
        </Box>
      </GhSurface>

      <GhSurface
        variant="elevated"
        p={{ base: "phi3", md: "phi4" }}
        color="white"
        bg="bg.elevated"
      >
        <HStack gap="2" mb="phi2">
          <Hammer size={18} color="#f43fa8" />
          <Text
            fontFamily="heading"
            fontWeight="extrabold"
            fontSize="sm"
            color="white"
          >
            Game-asset XFTs in your title
          </Text>
        </HStack>
        <Text fontSize="sm" color="white" lineHeight="1.65" mb="phi3" opacity={0.92}>
          {GAME_ASSET_INTEGRATION_BLURB}
        </Text>
        <Box
          borderRadius="xl"
          borderWidth="1px"
          borderColor="whiteAlpha.250"
          p="phi3"
          bg="blackAlpha.500"
          fontSize="sm"
          color="white"
          lineHeight="1.65"
        >
          <Text fontWeight="bold" color="white" mb="1">
            Example accepted list
          </Text>
          <Text color="white" opacity={0.92}>
            • <code style={{ color: "#a3ff3d" }}>#45</code> Iron Hammer — limited
            edition print (many players), role{" "}
            <code style={{ color: "#a3ff3d" }}>weapon</code>
          </Text>
          <Text color="white" opacity={0.92}>
            • <code style={{ color: "#a3ff3d" }}>#46</code> Neon Hammer — alt print,
            same role, different look
          </Text>
          <Text color="white" opacity={0.92}>
            • <code style={{ color: "#a3ff3d" }}>#76</code> Pilot Hat — role{" "}
            <code style={{ color: "#a3ff3d" }}>hat</code>
          </Text>
          <Text mt="2" color="white" opacity={0.92}>
            Player owns <code style={{ color: "#a3ff3d" }}>#99</code>, a{" "}
            <strong>wrap</strong> of <code style={{ color: "#a3ff3d" }}>#45</code>,
            with <strong>1,000 Power tokens</strong> in the bag → host sends{" "}
            <code style={{ color: "#a3ff3d", wordBreak: "break-all" }}>
              {`{ tokenId: 99, wrapsTokenId: 45, bagPowerTokens: 1000, effectivePower: 1120 }`}
            </code>
            . Your game must treat this hammer as stronger than bare #45.
          </Text>
        </Box>
      </GhSurface>
    </VStack>
  );
}
