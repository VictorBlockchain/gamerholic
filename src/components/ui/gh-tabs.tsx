"use client";

import { Tabs, Box, type TabsRootProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

export type GhTabItem = {
  value: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
};

export type GhTabsProps = {
  items: GhTabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  tone?: "brand" | "prize" | "attr" | "live";
  /** fitted = stretch triggers evenly */
  fitted?: boolean;
  size?: "sm" | "md";
  rootProps?: Omit<TabsRootProps, "defaultValue" | "value" | "onValueChange">;
};

const TONE = {
  brand: {
    activeBg: "brand.muted",
    activeColor: "brand.fg",
    activeBorder: "border.brand",
    indicator: "brand.solid",
  },
  prize: {
    activeBg: "prize.muted",
    activeColor: "prize.fg",
    activeBorder: "prize.solid",
    indicator: "prize.solid",
  },
  attr: {
    activeBg: "attr.muted",
    activeColor: "attr.fg",
    activeBorder: "attr.solid",
    indicator: "attr.solid",
  },
  live: {
    activeBg: "live.muted",
    activeColor: "live.fg",
    activeBorder: "live.solid",
    indicator: "live.solid",
  },
} as const;

/**
 * Segmented tab list with Gamerholic product tones.
 */
export function GhTabs({
  items,
  defaultValue,
  value,
  onValueChange,
  tone = "brand",
  fitted,
  size = "md",
  rootProps,
}: GhTabsProps) {
  const t = TONE[tone];
  const first = items[0]?.value;
  const py = size === "sm" ? "1.5" : "2";
  const px = size === "sm" ? "3" : "4";
  const fontSize = size === "sm" ? "xs" : "sm";

  return (
    <Tabs.Root
      defaultValue={defaultValue ?? first}
      value={value}
      onValueChange={(d) => onValueChange?.(d.value)}
      variant="plain"
      {...rootProps}
    >
      <Tabs.List
        display="flex"
        gap="1"
        p="1"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.default"
        bg="blackAlpha.400"
        flexWrap="wrap"
        w={fitted ? "100%" : "auto"}
      >
        {items.map((item) => (
          <Tabs.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            flex={fitted ? "1" : undefined}
            justifyContent="center"
            px={px}
            py={py}
            borderRadius="lg"
            fontFamily="heading"
            fontWeight="bold"
            fontSize={fontSize}
            letterSpacing="0.06em"
            color="fg.muted"
            transition="all 0.15s"
            _selected={{
              bg: t.activeBg,
              color: t.activeColor,
              borderWidth: "1px",
              borderColor: t.activeBorder,
              boxShadow: "sm",
            }}
            _hover={{ color: "fg.default" }}
            display="inline-flex"
            alignItems="center"
            gap="2"
          >
            {item.icon}
            {item.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <Box mt="phi3">
        {items.map((item) => (
          <Tabs.Content key={item.value} value={item.value} outline="none">
            {item.content}
          </Tabs.Content>
        ))}
      </Box>
    </Tabs.Root>
  );
}
