"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { Check, Radio, Swords } from "lucide-react";
import {
  GhAlert,
  GhButton,
  GhField,
  GhInput,
  GhModal,
  GhSpinner,
  GhTextarea,
  ghToast,
} from "@/components/ui";
import { useSession } from "@/components/providers/session-context";
import {
  canAcceptChallenge,
  challengeHref,
  formatIcp,
  type ChallengeDetail,
} from "@/lib/challenges";
import { getProfileCompleteness } from "@/lib/profile";
import { joinChallenge } from "@/lib/ic/challenge-service";
import { friendlyIcError } from "@/lib/ic/local-identity";
import { useGhEvents } from "@/context/event-context";

type Phase =
  | "form"
  | "validating"
  | "joining"
  | "confirming"
  | "redirecting"
  | "error";

const STEPS: { key: Phase; label: string; detail: string }[] = [
  {
    key: "validating",
    label: "Checking profile",
    detail: "Profile complete · stream optional",
  },
  {
    key: "joining",
    label: "Accepting on-chain",
    detail: "Calling gh_backend · joinChallenge",
  },
  {
    key: "confirming",
    label: "Seating confirmed",
    detail: "You’re locked in as opponent",
  },
  {
    key: "redirecting",
    label: "Opening match",
    detail: "Taking you to the challenge page",
  },
];

type Props = {
  challenge: ChallengeDetail | null;
  open: boolean;
  onClose: () => void;
  /** Called after a successful accept (before redirect) */
  onAccepted?: (id: string) => void;
};

/**
 * Accept 1v1 from a MatchCard — form + styled processing modal.
 */
export function AcceptChallengeModal({
  challenge,
  open,
  onClose,
  onAccepted,
}: Props) {
  const { isLoggedIn, login, profile, principal, identity, user } =
    useSession();
  const { emit } = useGhEvents();
  const [streamUrl, setStreamUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);

  const viewer =
    profile?.username || user?.username || principal || "";
  const mePrincipal = principal || user?.principal || "";

  useEffect(() => {
    if (!open) {
      setPhase("form");
      setError(null);
      setStreamUrl("");
      setNotes("");
    }
  }, [open, challenge?.id]);

  if (!challenge) return null;

  const canAccept = canAcceptChallenge(challenge, viewer, mePrincipal);
  const stepIndex = STEPS.findIndex((s) => s.key === phase);
  const processing = phase !== "form" && phase !== "error";

  const runAccept = async () => {
    if (!isLoggedIn) {
      void login();
      ghToast({ title: "Sign in required", type: "error" });
      return;
    }
    setError(null);
    setPhase("validating");
    await new Promise((r) => setTimeout(r, 280));

    const complete = getProfileCompleteness(profile);
    if (!complete.ok) {
      setPhase("error");
      setError(complete.message);
      return;
    }
    if (!canAccept) {
      setPhase("error");
      setError(
        "You cannot accept this challenge (creator, already filled, or not invited).",
      );
      return;
    }
    // Stream is optional — only validate if provided
    let stream = "";
    if (streamUrl.trim()) {
      const raw = streamUrl.trim();
      stream = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      try {
        // eslint-disable-next-line no-new
        new URL(stream);
      } catch {
        setPhase("error");
        setError("Stream URL is not valid.");
        return;
      }
    }

    setPhase("joining");
    try {
      const ok = await joinChallenge(
        challenge.id,
        viewer,
        stream,
        identity,
      );
      if (!ok) throw new Error("joinChallenge returned false");
      emit({
        type: "challenge.joined",
        origin: "canister",
        challengeId: challenge.id,
      });
      setPhase("confirming");
      await new Promise((r) => setTimeout(r, 400));
      onAccepted?.(challenge.id);
      setPhase("redirecting");
      ghToast({
        title: "Challenge accepted",
        description: `${formatIcp(challenge.entryFeeIcp)} · seated as opponent`,
        type: "success",
      });
      await new Promise((r) => setTimeout(r, 450));
      window.location.assign(challengeHref(challenge.id));
    } catch (e) {
      setPhase("error");
      setError(friendlyIcError(e));
      ghToast({
        title: "Accept failed",
        description: friendlyIcError(e),
        type: "error",
      });
    }
  };

  return (
    <GhModal
      open={open}
      onOpenChange={(o) => {
        if (!o && !processing) onClose();
        if (!o && phase === "error") onClose();
      }}
      title={
        phase === "error"
          ? "Accept failed"
          : phase === "redirecting"
            ? "You’re in"
            : phase === "form"
              ? "Accept 1v1"
              : "Accepting challenge"
      }
      description={
        phase === "error"
          ? "Could not join this match on-chain."
          : phase === "form"
            ? `${challenge.title} · vs @${challenge.creator.username}`
            : phase === "redirecting"
              ? "Opening match actions…"
              : "Keep this tab open while we seat you on Internet Computer."
      }
      tone={phase === "error" ? "prize" : "brand"}
      hideClose={processing}
      size="md"
      footer={
        phase === "form" ? (
          <HStack gap="2" w="100%" justify="flex-end" flexWrap="wrap">
            <GhButton variant="ghost" onClick={onClose}>
              Cancel
            </GhButton>
            <GhButton
              variant="primary"
              leftIcon={<Swords size={16} />}
              onClick={() => void runAccept()}
            >
              Accept · {formatIcp(challenge.entryFeeIcp)}
            </GhButton>
          </HStack>
        ) : phase === "error" ? (
          <HStack gap="2" w="100%" justify="flex-end" flexWrap="wrap">
            <GhButton
              variant="outline"
              onClick={() => {
                setPhase("form");
                setError(null);
              }}
            >
              Try again
            </GhButton>
            <GhButton variant="ghost" onClick={onClose}>
              Close
            </GhButton>
          </HStack>
        ) : phase === "redirecting" ? (
          <Link href={challengeHref(challenge.id)} style={{ width: "100%" }}>
            <GhButton variant="primary" w="100%">
              Open challenge
            </GhButton>
          </Link>
        ) : undefined
      }
    >
      <VStack align="stretch" gap="phi3" py="phi1">
        {phase === "form" ? (
          <>
            <HStack gap="phi3" align="flex-start">
              <Box
                w="12"
                h="12"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="brand.muted"
                color="brand.fg"
                borderWidth="1px"
                borderColor="border.brand"
                flexShrink={0}
              >
                <Swords size={22} />
              </Box>
              <Box minW="0">
                <Text
                  fontFamily="heading"
                  fontWeight="extrabold"
                  fontSize="sm"
                  lineClamp={2}
                >
                  {challenge.title}
                </Text>
                <Text fontSize="xs" color="fg.muted" mt="0.5">
                  {challenge.game} · {challenge.console} · stake{" "}
                  {formatIcp(challenge.entryFeeIcp)}
                </Text>
                <Text fontSize="xs" color="brand.fg" mt="1" fontWeight="bold">
                  Challenger · @{challenge.creator.username}
                </Text>
              </Box>
            </HStack>

            {!getProfileCompleteness(profile).ok ? (
              <GhAlert tone="warning" title="Profile incomplete">
                {getProfileCompleteness(profile).message}{" "}
                <Link href="/profile" style={{ fontWeight: 700 }}>
                  Complete profile →
                </Link>
              </GhAlert>
            ) : null}

            <GhField
              label="Stream URL"
              helperText="Optional — add later if you stream for spectators / monitor"
            >
              <GhInput
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="https://twitch.tv/your_name"
              />
            </GhField>
            <GhField label="Notes (optional)">
              <GhTextarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ready now · Discord…"
              />
            </GhField>
            <HStack gap="2" color="fg.subtle" fontSize="2xs">
              <Radio size={12} />
              <Text>
                Deposit {formatIcp(challenge.entryFeeIcp)} is recorded on accept
                (escrow rules apply).
              </Text>
            </HStack>
          </>
        ) : null}

        {phase !== "form" && phase !== "error" ? (
          <>
            <HStack gap="phi3" align="center">
              <Box
                w="12"
                h="12"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="brand.muted"
                color="brand.fg"
                borderWidth="1px"
                borderColor="border.brand"
                flexShrink={0}
              >
                {phase === "redirecting" || phase === "confirming" ? (
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
                  {STEPS[Math.max(0, stepIndex)]?.label || "Working…"}
                </Text>
                <Text fontSize="xs" color="fg.muted" mt="0.5" lineHeight="1.5">
                  {STEPS[Math.max(0, stepIndex)]?.detail}
                </Text>
                <Text
                  fontSize="xs"
                  color="brand.fg"
                  mt="1"
                  fontWeight="bold"
                  lineClamp={1}
                >
                  {challenge.title} · {formatIcp(challenge.entryFeeIcp)}
                </Text>
              </Box>
            </HStack>

            <VStack align="stretch" gap="2">
              {STEPS.map((step, i) => {
                const active = step.key === phase;
                const done = stepIndex > i;
                return (
                  <HStack
                    key={step.key}
                    gap="3"
                    px="3"
                    py="2.5"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={
                      active
                        ? "border.brand"
                        : done
                          ? "border.default"
                          : "border.default"
                    }
                    bg={
                      active
                        ? "brand.muted"
                        : done
                          ? "whiteAlpha.50"
                          : "transparent"
                    }
                    opacity={done || active ? 1 : 0.45}
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
                          : active
                            ? "brand.solid"
                            : "whiteAlpha.100"
                      }
                      color={done ? "success.fg" : active ? "black" : "fg.subtle"}
                      flexShrink={0}
                    >
                      {done ? (
                        <Check size={14} />
                      ) : active ? (
                        <GhSpinner size="sm" />
                      ) : (
                        <Text fontSize="2xs" fontWeight="extrabold">
                          {i + 1}
                        </Text>
                      )}
                    </Box>
                    <Box minW="0">
                      <Text
                        fontFamily="heading"
                        fontWeight="bold"
                        fontSize="xs"
                      >
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
          </>
        ) : null}

        {phase === "error" ? (
          <GhAlert tone="error" title="Accept failed">
            {error || "Unknown error"}
          </GhAlert>
        ) : null}
      </VStack>
    </GhModal>
  );
}
