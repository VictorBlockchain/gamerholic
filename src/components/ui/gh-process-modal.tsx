"use client";

import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { Check, XCircle } from "lucide-react";
import { GhAlert } from "./gh-alert";
import { GhButton } from "./gh-button";
import { GhModal } from "./gh-modal";
import { GhSpinner } from "./gh-spinner";

export type GhProcessStep = {
  key: string;
  label: string;
  detail: string;
};

export type GhProcessPhase = "running" | "success" | "error";

export type GhProcessTone = "brand" | "prize" | "attr" | "live";

export type GhProcessState = {
  open: boolean;
  title: string;
  description?: string;
  /** Context line under the active step (match title, team name, etc.) */
  contextLine?: string;
  steps: GhProcessStep[];
  stepIndex: number;
  phase: GhProcessPhase;
  error?: string | null;
  successTitle?: string;
  successDetail?: string;
  tone?: GhProcessTone;
};

export const IDLE_PROCESS: GhProcessState = {
  open: false,
  title: "",
  steps: [],
  stepIndex: 0,
  phase: "running",
  error: null,
};

type Props = {
  state: GhProcessState;
  onClose: () => void;
};

/**
 * Shared styled processing modal for form / chain submissions
 * (challenges, teams, arcade, host create, community rooms, …).
 */
export function GhProcessModal({ state, onClose }: Props) {
  const {
    open,
    title,
    description,
    contextLine,
    steps,
    stepIndex,
    phase,
    error,
    successTitle,
    successDetail,
    tone = "brand",
  } = state;

  const running = phase === "running";
  const active =
    phase === "running"
      ? steps[Math.min(stepIndex, Math.max(0, steps.length - 1))]
      : null;

  const toneMuted =
    tone === "prize"
      ? "prize.muted"
      : tone === "live"
        ? "live.muted"
        : tone === "attr"
          ? "attr.muted"
          : "brand.muted";
  const toneFg =
    tone === "prize"
      ? "prize.fg"
      : tone === "live"
        ? "live.fg"
        : tone === "attr"
          ? "attr.fg"
          : "brand.fg";
  const toneBorder =
    tone === "prize"
      ? "prize.solid"
      : tone === "live"
        ? "live.solid"
        : tone === "attr"
          ? "attr.solid"
          : "border.brand";

  return (
    <GhModal
      open={open}
      onOpenChange={(o) => {
        if (!o && !running) onClose();
      }}
      title={
        phase === "error"
          ? "Action failed"
          : phase === "success"
            ? successTitle || "Done"
            : title
      }
      description={
        phase === "error"
          ? "Something went wrong. You can dismiss and try again."
          : phase === "success"
            ? successDetail || "All set."
            : description || "Keep this tab open while we finish."
      }
      tone={phase === "error" ? "prize" : tone}
      hideClose={running}
      size="md"
      footer={
        phase === "error" || phase === "success" ? (
          <GhButton variant="primary" onClick={onClose} w="100%">
            {phase === "success" ? "Close" : "Dismiss"}
          </GhButton>
        ) : undefined
      }
    >
      <VStack align="stretch" gap="phi3" py="phi1">
        {phase === "running" || phase === "success" ? (
          <HStack gap="phi3" align="center">
            <Box
              w="12"
              h="12"
              borderRadius="xl"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg={phase === "success" ? "success.muted" : toneMuted}
              color={phase === "success" ? "success.fg" : toneFg}
              borderWidth="1px"
              borderColor={
                phase === "success" ? "success.solid" : toneBorder
              }
              flexShrink={0}
            >
              {phase === "success" ? (
                <Check size={22} />
              ) : (
                <GhSpinner size="md" />
              )}
            </Box>
            <Box minW="0">
              <Text
                fontFamily="heading"
                fontWeight="extrabold"
                fontSize="sm"
                letterSpacing="0.04em"
              >
                {phase === "success"
                  ? successTitle || "Complete"
                  : active?.label || "Working…"}
              </Text>
              <Text fontSize="xs" color="fg.muted" mt="0.5" lineHeight="1.5">
                {phase === "success"
                  ? successDetail || "All set."
                  : active?.detail}
              </Text>
              {contextLine ? (
                <Text
                  fontSize="xs"
                  color={toneFg}
                  mt="1"
                  fontWeight="bold"
                  lineClamp={1}
                >
                  {contextLine}
                </Text>
              ) : null}
            </Box>
          </HStack>
        ) : null}

        {phase === "error" ? (
          <GhAlert tone="error" title="Failed">
            {error || "Unknown error"}
          </GhAlert>
        ) : null}

        {steps.length > 0 && phase !== "error" ? (
          <VStack align="stretch" gap="2">
            {steps.map((step, i) => {
              const activeStep = phase === "running" && i === stepIndex;
              const done =
                phase === "success" || (phase === "running" && i < stepIndex);
              return (
                <HStack
                  key={step.key}
                  gap="3"
                  px="3"
                  py="2.5"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={
                    activeStep ? "border.brand" : "border.default"
                  }
                  bg={
                    activeStep
                      ? "brand.muted"
                      : done
                        ? "whiteAlpha.50"
                        : "transparent"
                  }
                  opacity={done || activeStep ? 1 : 0.45}
                >
                  <Box
                    w="7"
                    h="7"
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg={
                      done
                        ? "success.muted"
                        : activeStep
                          ? "brand.solid"
                          : "whiteAlpha.100"
                    }
                    color={
                      done ? "success.fg" : activeStep ? "black" : "fg.subtle"
                    }
                    flexShrink={0}
                  >
                    {done ? (
                      <Check size={14} />
                    ) : activeStep ? (
                      <GhSpinner size="sm" />
                    ) : (
                      <Text fontSize="2xs" fontWeight="extrabold">
                        {i + 1}
                      </Text>
                    )}
                  </Box>
                  <Box minW="0">
                    <Text fontFamily="heading" fontWeight="bold" fontSize="xs">
                      {step.label}
                    </Text>
                    <Text fontSize="2xs" color="fg.subtle" lineClamp={1}>
                      {step.detail}
                    </Text>
                  </Box>
                </HStack>
              );
            })}
          </VStack>
        ) : null}

        {phase === "error" ? (
          <HStack gap="2" color="danger.solid" fontSize="xs">
            <XCircle size={14} />
            <Text>You can dismiss and try again.</Text>
          </HStack>
        ) : null}
      </VStack>
    </GhModal>
  );
}

export function processBeat(ms = 320) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
