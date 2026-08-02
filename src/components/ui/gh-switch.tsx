"use client";

import { Switch, HStack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

export type GhSwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  tone?: "brand" | "prize" | "attr" | "live";
  size?: "sm" | "md";
};

const CHECKED_BG = {
  brand: "brand.solid",
  prize: "prize.solid",
  attr: "attr.solid",
  live: "live.solid",
} as const;

export function GhSwitch({
  checked,
  defaultChecked,
  onCheckedChange,
  label,
  disabled,
  tone = "brand",
  size = "md",
}: GhSwitchProps) {
  return (
    <Switch.Root
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={(d) => onCheckedChange?.(d.checked)}
      disabled={disabled}
      size={size}
    >
      <HStack gap="phi2" align="center">
        <Switch.HiddenInput />
        <Switch.Control
          bg="blackAlpha.500"
          borderWidth="1px"
          borderColor="border.default"
          _checked={{
            bg: CHECKED_BG[tone],
            borderColor: CHECKED_BG[tone],
          }}
        >
          <Switch.Thumb bg="white" />
        </Switch.Control>
        {label ? (
          <Switch.Label
            fontFamily="heading"
            fontSize="sm"
            fontWeight="bold"
            letterSpacing="0.04em"
            color="fg.default"
          >
            {label}
          </Switch.Label>
        ) : null}
      </HStack>
    </Switch.Root>
  );
}
