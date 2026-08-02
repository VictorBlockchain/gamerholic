"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Flex, Text, VStack, HStack } from "@chakra-ui/react";
import { ArrowRight, ChevronDown, Users } from "lucide-react";
import { CREATE_OPTIONS } from "@/lib/nav";
import { GhBadge, GhButton } from "@/components/ui";

type Props = {
  open: boolean;
  onClose: () => void;
};

const TONE_MAP = {
  prize: { badge: "prize" as const, bg: "prize.muted", color: "prize.fg" },
  brand: { badge: "brand" as const, bg: "brand.muted", color: "brand.fg" },
  live: { badge: "live" as const, bg: "live.muted", color: "live.fg" },
  attr: { badge: "attr" as const, bg: "attr.muted", color: "attr.fg" },
  default: {
    badge: "muted" as const,
    bg: "whiteAlpha.100",
    color: "fg.default",
  },
};

/**
 * Create picker — **show/hide bottom panel** (not a modal dialog).
 * Avoids Internet Identity / wallet connect issues inside modal focus traps.
 * Navigates to `/create?type=…` for the actual in-page form.
 */
export function CreateSheet({ open, onClose }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Show/hide — no body scroll lock, no modal overlay focus trap
  if (!open) return null;

  return (
    <Box
      position="fixed"
      left="0"
      right="0"
      bottom="0"
      zIndex={55}
      pb="calc(var(--gh-bottom-nav-h) + var(--gh-safe-bottom))"
      display={{ base: "block", md: "none" }}
      pointerEvents="none"
    >
      <Box
        pointerEvents="auto"
        mx="phi2"
        mb="phi2"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="border.brand"
        bg="bg.elevated"
        boxShadow="glow"
        maxH="min(70dvh, 28rem)"
        overflowY="auto"
        className="gh-scroll-hide"
      >
        <Flex justify="center" pt="2" pb="1">
          <Box w="10" h="1" borderRadius="full" bg="whiteAlpha.300" />
        </Flex>
        <Flex align="center" justify="space-between" px="phi3" pb="phi2">
          <Box>
            <Text
              fontFamily="heading"
              fontWeight="extrabold"
              fontSize="sm"
              letterSpacing="0.04em"
            >
              Create
            </Text>
            <Text fontSize="2xs" color="fg.subtle">
              In-page forms · no modal (II-safe)
            </Text>
          </Box>
          <GhButton
            size="sm"
            variant="ghost"
            aria-label="Hide create"
            onClick={onClose}
            leftIcon={<ChevronDown size={14} />}
          >
            Hide
          </GhButton>
        </Flex>

        <VStack align="stretch" gap="2" px="phi3" pb="phi3">
          {CREATE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const tone = TONE_MAP[opt.tone] ?? TONE_MAP.default;
            return (
              <Box
                key={opt.id}
                as="button"
                textAlign="left"
                w="100%"
                onClick={() => {
                  onClose();
                  router.push(opt.href);
                }}
                cursor="pointer"
              >
                <HStack
                  gap="phi2"
                  p="phi3"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="border.default"
                  bg="blackAlpha.400"
                  _hover={{ borderColor: "border.brand", bg: "brand.muted" }}
                  transition="all 0.15s"
                >
                  <Box
                    w="10"
                    h="10"
                    borderRadius="lg"
                    bg={tone.bg}
                    color={tone.color}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <Icon size={18} />
                  </Box>
                  <Box flex="1" minW="0">
                    <HStack gap="2" mb="0.5">
                      <Text
                        fontFamily="heading"
                        fontWeight="bold"
                        fontSize="sm"
                      >
                        {opt.title}
                      </Text>
                      <GhBadge tone={tone.badge}>{opt.subtitle}</GhBadge>
                    </HStack>
                    <Text fontSize="xs" color="fg.muted" lineClamp={2}>
                      {opt.description}
                    </Text>
                  </Box>
                  <ArrowRight size={16} color="var(--gh-colors-fg-subtle)" />
                </HStack>
              </Box>
            );
          })}
          <Box
            as="button"
            textAlign="left"
            w="100%"
            onClick={() => {
              onClose();
              router.push("/teams");
            }}
            cursor="pointer"
          >
            <HStack
              gap="phi2"
              p="phi3"
              borderRadius="xl"
              borderWidth="1px"
              borderStyle="dashed"
              borderColor="border.strong"
              bg="blackAlpha.300"
            >
              <Box
                w="10"
                h="10"
                borderRadius="lg"
                bg="brand.muted"
                color="brand.fg"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Users size={18} />
              </Box>
              <Box flex="1">
                <Text fontFamily="heading" fontWeight="bold" fontSize="sm">
                  Teams
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  Create & manage squads on the Teams page
                </Text>
              </Box>
              <ArrowRight size={16} color="var(--gh-colors-fg-subtle)" />
            </HStack>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
}
