"use client";

import { Tooltip, Portal, Box } from "@chakra-ui/react";
import type { ReactNode } from "react";

export type GhTooltipProps = {
  content: ReactNode;
  children: ReactNode;
  /** Prefer openDelay ~200–400 for HUD feel */
  openDelay?: number;
  closeDelay?: number;
  placement?: "top" | "bottom" | "left" | "right";
  disabled?: boolean;
  /** Show small tip arrow */
  showArrow?: boolean;
};

/**
 * Glass HUD tooltip — Orbitron-friendly labels, volt border glow.
 */
export function GhTooltip({
  content,
  children,
  openDelay = 200,
  closeDelay = 80,
  placement = "top",
  disabled,
  showArrow = true,
}: GhTooltipProps) {
  if (disabled) return <>{children}</>;

  return (
    <Tooltip.Root openDelay={openDelay} closeDelay={closeDelay} positioning={{ placement }}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content
            px="3"
            py="1.5"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="border.brand"
            bg="bg.glass-strong"
            backdropFilter="blur(14px)"
            color="fg.default"
            fontSize="xs"
            fontFamily="heading"
            fontWeight="bold"
            letterSpacing="0.06em"
            boxShadow="glow"
            maxW="16rem"
            zIndex={80}
          >
            {showArrow ? (
              <Tooltip.Arrow>
                <Tooltip.ArrowTip
                  borderColor="border.brand"
                  bg="bg.glass-strong"
                />
              </Tooltip.Arrow>
            ) : null}
            <Box>{content}</Box>
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  );
}
