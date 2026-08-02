"use client";

import { Checkbox, HStack, Text } from "@chakra-ui/react";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

export type GhCheckboxProps = {
  checked?: boolean | "indeterminate";
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean | "indeterminate") => void;
  label?: ReactNode;
  disabled?: boolean;
  tone?: "brand" | "prize" | "attr";
};

export function GhCheckbox({
  checked,
  defaultChecked,
  onCheckedChange,
  label,
  disabled,
  tone = "brand",
}: GhCheckboxProps) {
  const solid =
    tone === "prize"
      ? "prize.solid"
      : tone === "attr"
        ? "attr.solid"
        : "brand.solid";
  const contrast = tone === "brand" ? "brand.contrast" : "white";

  return (
    <Checkbox.Root
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={(d) => onCheckedChange?.(d.checked)}
      disabled={disabled}
    >
      <HStack gap="phi2" align="center">
        <Checkbox.HiddenInput />
        <Checkbox.Control
          w="5"
          h="5"
          borderRadius="md"
          borderWidth="1px"
          borderColor="border.strong"
          bg="blackAlpha.400"
          _checked={{
            bg: solid,
            borderColor: solid,
            color: contrast,
          }}
        >
          <Checkbox.Indicator>
            <Check size={12} strokeWidth={3} />
          </Checkbox.Indicator>
        </Checkbox.Control>
        {label ? (
          <Checkbox.Label>
            <Text
              fontSize="sm"
              fontWeight="medium"
              color="fg.default"
              as="span"
            >
              {label}
            </Text>
          </Checkbox.Label>
        ) : null}
      </HStack>
    </Checkbox.Root>
  );
}
