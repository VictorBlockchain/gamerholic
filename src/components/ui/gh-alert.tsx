"use client";

import { Box, Flex, Text, type BoxProps } from "@chakra-ui/react";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

export type GhAlertTone =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "brand"
  | "prize"
  | "attr"
  | "live";

const META: Record<
  GhAlertTone,
  { icon: LucideIcon; bg: string; border: string; color: string }
> = {
  info: {
    icon: Info,
    bg: "live.muted",
    border: "live.solid",
    color: "live.fg",
  },
  success: {
    icon: CheckCircle2,
    bg: "rgba(34, 197, 94, 0.12)",
    border: "success.solid",
    color: "success.solid",
  },
  warning: {
    icon: AlertTriangle,
    bg: "prize.muted",
    border: "prize.solid",
    color: "prize.fg",
  },
  error: {
    icon: XCircle,
    bg: "rgba(244, 63, 94, 0.12)",
    border: "danger.solid",
    color: "danger.solid",
  },
  brand: {
    icon: Info,
    bg: "brand.muted",
    border: "border.brand",
    color: "brand.fg",
  },
  prize: {
    icon: AlertTriangle,
    bg: "prize.muted",
    border: "prize.solid",
    color: "prize.fg",
  },
  attr: {
    icon: Info,
    bg: "attr.muted",
    border: "attr.solid",
    color: "attr.fg",
  },
  live: {
    icon: Info,
    bg: "live.muted",
    border: "live.solid",
    color: "live.fg",
  },
};

export type GhAlertProps = Omit<BoxProps, "title" | "direction"> & {
  tone?: GhAlertTone;
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
};

export function GhAlert({
  tone = "brand",
  title,
  children,
  icon,
  ...rest
}: GhAlertProps) {
  const m = META[tone];
  const Icon = m.icon;
  return (
    <Flex
      role="alert"
      gap="phi2"
      p="phi3"
      borderRadius="xl"
      borderWidth="1px"
      borderColor={m.border}
      bg={m.bg}
      align="flex-start"
      flexDirection="row"
      {...rest}
    >
      <Box color={m.color} flexShrink={0} mt="0.5">
        {icon ?? <Icon size={18} />}
      </Box>
      <Box minW="0" flex="1">
        {title ? (
          <Text
            fontFamily="heading"
            fontWeight="extrabold"
            fontSize="sm"
            letterSpacing="0.04em"
            color={m.color}
            mb={children ? "1" : 0}
          >
            {title}
          </Text>
        ) : null}
        {children ? (
          <Text fontSize="sm" color="fg.muted" lineHeight="1.5">
            {children}
          </Text>
        ) : null}
      </Box>
    </Flex>
  );
}
