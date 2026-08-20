"use client";

import {
  Toaster,
  Toast,
  createToaster,
  Box,
  HStack,
  Portal,
} from "@chakra-ui/react";
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from "lucide-react";
import type { ReactNode } from "react";

/** App-wide toaster instance — import `toaster` to fire notifications */
export const toaster = createToaster({
  placement: "top-end",
  pauseOnPageIdle: true,
  overlap: true,
  max: 4,
  gap: 12,
});

export type GhToastTone = "success" | "error" | "warning" | "info" | "brand" | "prize";

const TONE_STYLE: Record<
  GhToastTone,
  { border: string; icon: ReactNode; color: string }
> = {
  success: {
    border: "success.solid",
    color: "success.solid",
    icon: <CheckCircle2 size={16} />,
  },
  error: {
    border: "danger.solid",
    color: "danger.solid",
    icon: <XCircle size={16} />,
  },
  warning: {
    border: "prize.solid",
    color: "prize.fg",
    icon: <AlertTriangle size={16} />,
  },
  info: {
    border: "live.solid",
    color: "live.fg",
    icon: <Info size={16} />,
  },
  brand: {
    border: "border.brand",
    color: "brand.fg",
    icon: <Info size={16} />,
  },
  prize: {
    border: "prize.solid",
    color: "prize.fg",
    icon: <CheckCircle2 size={16} />,
  },
};

function mapType(type?: string): GhToastTone {
  if (type === "success") return "success";
  if (type === "error") return "error";
  if (type === "warning") return "warning";
  if (type === "loading") return "info";
  if (type === "info") return "info";
  return "brand";
}

/**
 * Mount once near the app root (inside ChakraProvider).
 */
export function GhToaster() {
  return (
    <Portal>
      <Toaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast) => {
          const tone = mapType(toast.type);
          const style = TONE_STYLE[tone];
          return (
            <Toast.Root
              width={{ base: "100%", sm: "sm" }}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={style.border}
              bg="bg.glass-strong"
              backdropFilter="blur(16px)"
              boxShadow="card"
              p="phi3"
            >
              <HStack align="flex-start" gap="phi2">
                <Box color={style.color} mt="0.5" flexShrink={0}>
                  {style.icon}
                </Box>
                <Box flex="1" minW="0">
                  {toast.title ? (
                    <Toast.Title
                      fontFamily="heading"
                      fontWeight="extrabold"
                      fontSize="sm"
                      letterSpacing="0.04em"
                    >
                      {toast.title}
                    </Toast.Title>
                  ) : null}
                  {toast.description ? (
                    <Toast.Description
                      fontSize="xs"
                      color="fg.muted"
                      mt="0.5"
                      lineHeight="1.45"
                    >
                      {toast.description}
                    </Toast.Description>
                  ) : null}
                </Box>
                <Toast.CloseTrigger
                  asChild
                  position="relative"
                  top="0"
                  insetEnd="0"
                >
                  <Box
                    as="button"
                    aria-label="Dismiss"
                    color="fg.subtle"
                    _hover={{ color: "fg.default" }}
                    p="1"
                    borderRadius="md"
                    cursor="pointer"
                  >
                    <X size={14} />
                  </Box>
                </Toast.CloseTrigger>
              </HStack>
              {toast.action ? (
                <Toast.ActionTrigger asChild>
                  <Box
                    as="button"
                    mt="phi2"
                    fontFamily="heading"
                    fontSize="xs"
                    fontWeight="bold"
                    color={style.color}
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    cursor="pointer"
                  >
                    {toast.action.label}
                  </Box>
                </Toast.ActionTrigger>
              ) : null}
            </Toast.Root>
          );
        }}
      </Toaster>
    </Portal>
  );
}

/** Fire a Gamerholic-styled toast */
export function ghToast(opts: {
  title: string;
  description?: string;
  type?: "success" | "error" | "warning" | "info" | "loading";
  duration?: number;
  action?: { label: string; onClick: () => void };
}) {
  return toaster.create({
    title: opts.title,
    description: opts.description,
    type: opts.type ?? "info",
    duration: opts.duration ?? 4000,
    action: opts.action,
  });
}
