"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import { Check, Plus, X } from "lucide-react";
import { GhButton } from "@/components/ui/gh-button";
import { GhInput } from "@/components/ui/gh-field";
import {
  DEMO_GAMES,
  addCustomGame,
  mergeGameOptions,
  toggleGameSelection,
} from "@/lib/profile";

export type GameChipPickerProps = {
  selected: string[];
  onChange: (games: string[]) => void;
  /** Preset chips; defaults to DEMO_GAMES */
  catalog?: readonly string[];
  tone?: "brand" | "live" | "prize";
  /** Placeholder for custom add input */
  placeholder?: string;
  /** Optional helper under the add row */
  helperText?: string;
  /** Highlight chips when parent form validation fails */
  invalid?: boolean;
};

const TONE_STYLES = {
  brand: {
    onBorder: "border.brand",
    onBg: "brand.muted",
    onColor: "brand.fg",
  },
  live: {
    onBorder: "live.solid",
    onBg: "live.muted",
    onColor: "live.fg",
  },
  prize: {
    onBorder: "prize.solid",
    onBg: "prize.muted",
    onColor: "prize.fg",
  },
} as const;

/**
 * Selectable game chips + free-text “add other game” for profile & moderators.
 */
export function GameChipPicker({
  selected,
  onChange,
  catalog = DEMO_GAMES,
  tone = "brand",
  placeholder = "Add another game…",
  helperText = "Pick presets or type a title that isn’t listed yet.",
  invalid = false,
}: GameChipPickerProps) {
  const [custom, setCustom] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const styles = TONE_STYLES[tone];
  const options = mergeGameOptions(selected, catalog);
  const customKeys = new Set(
    selected
      .filter((g) => !catalog.some((c) => c.toLowerCase() === g.toLowerCase()))
      .map((g) => g.toLowerCase()),
  );

  const toggle = (g: string) => {
    setHint(null);
    onChange(toggleGameSelection(selected, g, catalog));
  };

  const submitCustom = () => {
    const result = addCustomGame(selected, custom, catalog);
    if (!result.added) {
      if (result.reason === "empty") {
        setHint("Enter a game name");
      } else if (result.reason === "duplicate") {
        setHint("Already in your list");
      } else if (result.reason === "too_long") {
        setHint("Keep it under 48 characters");
      }
      return;
    }
    onChange(result.games);
    setCustom("");
    setHint(null);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitCustom();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitCustom();
    }
  };

  return (
    <Box
      borderRadius="xl"
      borderWidth={invalid ? "1px" : "0"}
      borderColor={invalid ? "danger.solid" : undefined}
      p={invalid ? "2" : "0"}
    >
      <Flex gap="2" flexWrap="wrap">
        {options.map((g) => {
          const on = selected.some(
            (s) => s.toLowerCase() === g.toLowerCase(),
          );
          const isCustom = customKeys.has(g.toLowerCase());
          return (
            <Box
              key={g}
              as="button"
              onClick={() => toggle(g)}
              px="3"
              py="1.5"
              borderRadius="full"
              borderWidth="1px"
              borderColor={
                on
                  ? styles.onBorder
                  : invalid
                    ? "danger.solid"
                    : "border.default"
              }
              bg={on ? styles.onBg : "blackAlpha.400"}
              color={on ? styles.onColor : "fg.muted"}
              fontFamily="heading"
              fontSize="xs"
              fontWeight="bold"
              cursor="pointer"
              display="inline-flex"
              alignItems="center"
              gap="1"
              transition="all 0.12s ease"
              _hover={{
                borderColor: on ? styles.onBorder : "border.strong",
                color: on ? styles.onColor : "fg.default",
              }}
            >
              {on ? <Check size={12} /> : <Plus size={12} />}
              {g}
              {isCustom && on ? (
                <Box
                  as="span"
                  ml="0.5"
                  opacity={0.7}
                  display="inline-flex"
                  aria-label="Remove custom game"
                >
                  <X size={11} />
                </Box>
              ) : null}
            </Box>
          );
        })}
      </Flex>

      <Box
        as="form"
        onSubmit={onSubmit}
        mt="phi3"
        p="phi2"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.default"
        bg="blackAlpha.300"
      >
        <Text
          fontFamily="heading"
          fontSize="2xs"
          fontWeight="bold"
          letterSpacing="0.1em"
          textTransform="uppercase"
          color="fg.subtle"
          mb="2"
        >
          Other game
        </Text>
        <HStack gap="2" align="stretch">
          <GhInput
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              if (hint) setHint(null);
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            maxLength={48}
            size="sm"
            h="9"
            flex="1"
            tone={tone === "prize" ? "prize" : "brand"}
          />
          <GhButton
            type="submit"
            size="sm"
            variant={tone === "live" ? "live" : tone === "prize" ? "prize" : "primary"}
            leftIcon={<Plus size={14} />}
            flexShrink={0}
          >
            Add
          </GhButton>
        </HStack>
        <Text fontSize="2xs" color={hint ? "danger.solid" : "fg.subtle"} mt="1.5">
          {hint ?? helperText}
        </Text>
      </Box>
    </Box>
  );
}
