"use client";

import {
  Field,
  Input,
  Textarea,
  Box,
  type InputProps,
  type TextareaProps,
} from "@chakra-ui/react";
import { forwardRef, type ReactNode } from "react";

const inputBase = {
  bg: "blackAlpha.400",
  borderWidth: "1px",
  borderColor: "border.default",
  borderRadius: "xl",
  color: "fg.default",
  fontFamily: "body",
  fontSize: "sm",
  h: "11",
  px: "3.5",
  _placeholder: { color: "fg.subtle" },
  _hover: { borderColor: "border.strong" },
  _focusVisible: {
    borderColor: "border.brand",
    boxShadow: "0 0 0 1px var(--gh-colors-border-brand)",
    outline: "none",
  },
  _invalid: {
    borderColor: "danger.solid",
    boxShadow: "0 0 0 1px var(--gh-colors-danger-solid)",
  },
  transition: "border-color 0.15s, box-shadow 0.15s",
} as const;

export type GhInputProps = InputProps & {
  tone?: "brand" | "prize" | "attr";
};

export const GhInput = forwardRef<HTMLInputElement, GhInputProps>(
  function GhInput({ tone = "brand", ...rest }, ref) {
    const focusBorder =
      tone === "prize"
        ? "prize.solid"
        : tone === "attr"
          ? "attr.solid"
          : "border.brand";
    return (
      <Input
        ref={ref}
        {...inputBase}
        _focusVisible={{
          borderColor: focusBorder,
          boxShadow: `0 0 0 1px var(--gh-colors-${tone === "brand" ? "border-brand" : tone + "-solid"})`,
          outline: "none",
        }}
        {...rest}
      />
    );
  },
);

export type GhTextareaProps = TextareaProps;

export const GhTextarea = forwardRef<HTMLTextAreaElement, GhTextareaProps>(
  function GhTextarea(props, ref) {
    return (
      <Textarea
        ref={ref}
        {...inputBase}
        h="auto"
        minH="6.5rem"
        py="3"
        resize="vertical"
        {...props}
      />
    );
  },
);

export type GhFieldProps = {
  label?: ReactNode;
  helperText?: ReactNode;
  errorText?: ReactNode;
  required?: boolean;
  children: ReactNode;
  invalid?: boolean;
  /**
   * `onDark` — pure white labels/helpers for elevated dark panels
   * (default theme muted tokens are unreadable there).
   */
  tone?: "default" | "onDark";
};

/**
 * Label + control + helper/error — arena form pattern.
 */
export function GhField({
  label,
  helperText,
  errorText,
  required,
  children,
  invalid,
  tone = "default",
}: GhFieldProps) {
  const onDark = tone === "onDark";
  const labelColor = onDark ? "#ffffff" : "fg.muted";
  const helperColor = onDark ? "rgba(255,255,255,0.85)" : "fg.subtle";

  return (
    <Field.Root invalid={invalid || Boolean(errorText)} required={required}>
      {label ? (
        <Field.Label
          fontFamily="heading"
          fontSize="xs"
          fontWeight="bold"
          letterSpacing="0.1em"
          textTransform="uppercase"
          color={labelColor}
          mb="1.5"
          style={onDark ? { color: "#ffffff" } : undefined}
        >
          {label}
          {required ? (
            <Field.RequiredIndicator color="prize.fg" ml="1" />
          ) : null}
        </Field.Label>
      ) : null}
      {children}
      {helperText && !errorText ? (
        <Field.HelperText
          fontSize="xs"
          color={helperColor}
          mt="1.5"
          style={onDark ? { color: "rgba(255,255,255,0.85)" } : undefined}
        >
          {helperText}
        </Field.HelperText>
      ) : null}
      {errorText ? (
        <Field.ErrorText fontSize="xs" color="danger.solid" mt="1.5">
          {errorText}
        </Field.ErrorText>
      ) : null}
    </Field.Root>
  );
}

/** Compact search-style input shell */
export function GhInputShell({
  left,
  right,
  children,
}: {
  left?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box position="relative">
      {left ? (
        <Box
          position="absolute"
          left="3"
          top="50%"
          transform="translateY(-50%)"
          color="fg.subtle"
          zIndex={1}
          pointerEvents="none"
        >
          {left}
        </Box>
      ) : null}
      <Box css={left ? { "& input": { paddingInlineStart: "2.5rem" } } : undefined}>
        {children}
      </Box>
      {right ? (
        <Box
          position="absolute"
          right="3"
          top="50%"
          transform="translateY(-50%)"
          color="fg.subtle"
        >
          {right}
        </Box>
      ) : null}
    </Box>
  );
}
