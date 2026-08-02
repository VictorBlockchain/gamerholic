"use client";

import { Button, type ButtonProps } from "@chakra-ui/react";
import { forwardRef, type ReactNode } from "react";

export type GhButtonVariant =
  | "primary"
  | "outline"
  | "ghost"
  | "soft"
  | "prize"
  | "attr"
  | "live"
  | "danger";

export type GhButtonProps = Omit<ButtonProps, "variant"> & {
  variant?: GhButtonVariant;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const styles: Record<GhButtonVariant, Partial<ButtonProps>> = {
  primary: {
    bg: "brand.solid",
    color: "brand.contrast",
    fontWeight: "bold",
    _hover: { filter: "brightness(1.08)" },
    _active: { transform: "scale(0.97)" },
    boxShadow: "glow",
  },
  outline: {
    bg: "transparent",
    color: "fg.default",
    borderWidth: "1px",
    borderColor: "border.strong",
    _hover: { borderColor: "border.brand", color: "brand.fg", bg: "brand.muted" },
    _active: { transform: "scale(0.97)" },
  },
  ghost: {
    bg: "transparent",
    color: "fg.muted",
    _hover: { bg: "whiteAlpha.50", color: "brand.fg" },
    _active: { transform: "scale(0.97)" },
  },
  soft: {
    bg: "brand.muted",
    color: "brand.fg",
    _hover: { filter: "brightness(1.1)" },
    _active: { transform: "scale(0.97)" },
  },
  prize: {
    bg: "prize.solid",
    color: "white",
    fontWeight: "bold",
    boxShadow: "glow-prize",
    _hover: { filter: "brightness(1.08)" },
    _active: { transform: "scale(0.97)" },
  },
  attr: {
    bg: "attr.solid",
    color: "white",
    fontWeight: "bold",
    boxShadow: "glow-attr",
    _hover: { filter: "brightness(1.08)" },
    _active: { transform: "scale(0.97)" },
  },
  live: {
    bg: "live.solid",
    color: "brand.contrast",
    fontWeight: "bold",
    boxShadow: "glow-live",
    _hover: { filter: "brightness(1.08)" },
    _active: { transform: "scale(0.97)" },
  },
  danger: {
    bg: "danger.solid",
    color: "white",
    fontWeight: "semibold",
    _hover: { filter: "brightness(1.08)" },
    _active: { transform: "scale(0.97)" },
  },
};

export const GhButton = forwardRef<HTMLButtonElement, GhButtonProps>(
  function GhButton(
    {
      variant = "primary",
      size = "md",
      children,
      leftIcon,
      rightIcon,
      ...rest
    },
    ref,
  ) {
    const v = styles[variant];
    const h =
      size === "sm" ? "9" : size === "lg" ? "12" : size === "xs" ? "8" : "10";
    const px =
      size === "sm" ? "3.5" : size === "lg" ? "6" : size === "xs" ? "3" : "5";
    const fontSize =
      size === "sm" || size === "xs" ? "sm" : size === "lg" ? "md" : "sm";
    const iconSize = size === "lg" ? 18 : size === "sm" || size === "xs" ? 14 : 16;

    return (
      <Button
        ref={ref}
        h={h}
        minH={h}
        px={px}
        fontSize={fontSize}
        fontFamily="heading"
        letterSpacing="0.04em"
        borderRadius="xl"
        transition="all 0.15s ease"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        gap="2"
        {...v}
        {...rest}
      >
        {leftIcon ? (
          <span
            style={{
              display: "inline-flex",
              flexShrink: 0,
              width: iconSize,
              height: iconSize,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {leftIcon}
          </span>
        ) : null}
        {children}
        {rightIcon ? (
          <span
            style={{
              display: "inline-flex",
              flexShrink: 0,
              width: iconSize,
              height: iconSize,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {rightIcon}
          </span>
        ) : null}
      </Button>
    );
  },
);
