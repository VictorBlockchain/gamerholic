"use client";

import {
  Dialog,
  Portal,
  Box,
  Text,
  type DialogRootProps,
} from "@chakra-ui/react";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { GhButton } from "./gh-button";

export type GhModalSize = "sm" | "md" | "lg" | "xl" | "full";

export type GhModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: GhModalSize;
  /** Tone accent on header rail */
  tone?: "brand" | "prize" | "attr" | "live";
  /** Hide default close (X) */
  hideClose?: boolean;
  /** Scroll body */
  scrollBehavior?: "inside" | "outside";
  /** Placement */
  placement?: DialogRootProps["placement"];
};

const SIZE_MAXW: Record<GhModalSize, string> = {
  sm: "24rem",
  md: "28rem",
  lg: "36rem",
  xl: "48rem",
  full: "min(96vw, 64rem)",
};

const TONE_BAR = {
  brand: "linear-gradient(90deg, #a3ff3d, #7dd41f)",
  prize: "linear-gradient(90deg, #f43fa8, #db2777)",
  attr: "linear-gradient(90deg, #8b5cf6, #a3ff3d)",
  live: "linear-gradient(90deg, #22d3ee, #06b6d4)",
} as const;

/**
 * Centered glass dialog — match create / settle flows.
 */
export function GhModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  tone = "brand",
  hideClose,
  placement = "center",
}: GhModalProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(d) => onOpenChange(d.open)}
      placement={placement}
      motionPreset="scale"
    >
      <Portal>
        <Dialog.Backdrop
          bg="blackAlpha.700"
          backdropFilter="blur(6px)"
        />
        <Dialog.Positioner>
          <Dialog.Content
            maxW={SIZE_MAXW[size]}
            w="100%"
            mx="phi3"
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="border.default"
            bg="bg.elevated"
            boxShadow="card"
            overflow="hidden"
            p="0"
          >
            <Box h="1.5" bg={TONE_BAR[tone]} />
            {(title || !hideClose) && (
              <Dialog.Header
                display="flex"
                alignItems="flex-start"
                justifyContent="space-between"
                gap="phi3"
                px="phi4"
                pt="phi4"
                pb={description ? "phi1" : "phi3"}
              >
                <Box minW="0" flex="1">
                  {title ? (
                    <Dialog.Title
                      fontFamily="heading"
                      fontWeight="extrabold"
                      fontSize="lg"
                      letterSpacing="0.04em"
                      lineHeight="1.2"
                    >
                      {title}
                    </Dialog.Title>
                  ) : null}
                  {description ? (
                    <Dialog.Description
                      mt="phi1"
                      fontSize="sm"
                      color="fg.muted"
                      lineHeight="1.55"
                    >
                      {description}
                    </Dialog.Description>
                  ) : null}
                </Box>
                {!hideClose ? (
                  <Dialog.CloseTrigger asChild>
                    <GhButton
                      variant="ghost"
                      size="sm"
                      aria-label="Close"
                      px="2"
                      minW="9"
                    >
                      <X size={16} />
                    </GhButton>
                  </Dialog.CloseTrigger>
                ) : null}
              </Dialog.Header>
            )}
            {children ? (
              <Dialog.Body px="phi4" pb={footer ? "phi2" : "phi4"}>
                {children}
              </Dialog.Body>
            ) : null}
            {footer ? (
              <Dialog.Footer
                px="phi4"
                pb="phi4"
                pt="phi2"
                gap="phi2"
                display="flex"
                flexWrap="wrap"
                justifyContent="flex-end"
              >
                {footer}
              </Dialog.Footer>
            ) : null}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

/** Convenience: confirm-style modal actions */
export function GhModalActions({
  onCancel,
  onConfirm,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  loading,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmVariant?: "primary" | "prize" | "danger" | "attr";
  loading?: boolean;
}) {
  return (
    <>
      <GhButton variant="outline" onClick={onCancel} disabled={loading}>
        {cancelLabel}
      </GhButton>
      <GhButton
        variant={confirmVariant}
        onClick={onConfirm}
        disabled={loading}
      >
        {confirmLabel}
      </GhButton>
    </>
  );
}

/** Controlled trigger helper text for docs */
export function GhModalHint({ children }: { children: ReactNode }) {
  return (
    <Text fontSize="xs" color="fg.subtle" mt="phi1">
      {children}
    </Text>
  );
}
