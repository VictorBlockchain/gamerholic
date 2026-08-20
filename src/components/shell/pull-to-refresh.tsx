"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Box, Text } from "@chakra-ui/react";
import { Loader2, RefreshCw } from "lucide-react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { useSession } from "@/components/providers/session-context";

/** Custom event pages can listen for soft reload (static export friendly). */
export const GH_PULL_REFRESH_EVENT = "gh:pull-refresh";

/**
 * Mobile pull-to-refresh overlay + gesture.
 * Mount once inside AppShell. Does not change layout when idle.
 *
 * On refresh:
 * 1. refreshProfile() if connected
 * 2. dispatch `gh:pull-refresh` for detail views with local loaders
 * 3. router.refresh()
 */
export function PullToRefresh() {
  const router = useRouter();
  const { refreshProfile, isLoggedIn } = useSession();

  const onRefresh = useCallback(async () => {
    if (isLoggedIn) {
      try {
        await refreshProfile();
      } catch {
        /* non-fatal */
      }
    }
    try {
      window.dispatchEvent(
        new CustomEvent(GH_PULL_REFRESH_EVENT, {
          detail: { at: Date.now() },
        }),
      );
    } catch {
      /* ignore */
    }
    try {
      router.refresh();
    } catch {
      /* static export may no-op */
    }
    // Brief settle so spinner is visible even if work is instant
    await new Promise((r) => window.setTimeout(r, 420));
  }, [isLoggedIn, refreshProfile, router]);

  const { pull, armed, refreshing } = usePullToRefresh({
    onRefresh,
    mobileOnly: true,
    threshold: 72,
    maxPull: 120,
  });

  const visible = pull > 4 || refreshing;
  const progress = Math.min(1, pull / 72);

  return (
    <Box
      display={{ base: "block", md: "none" }}
      position="fixed"
      top="0"
      left="0"
      right="0"
      zIndex={45}
      pointerEvents="none"
      aria-hidden={!visible}
      style={{
        // Sit just under header chrome
        paddingTop: "calc(var(--gh-header-h, 56px) + var(--gh-safe-top, 0px))",
      }}
    >
      <Box
        mx="auto"
        w="100%"
        maxW="var(--gh-content-max, 84rem)"
        display="flex"
        justifyContent="center"
        style={{
          transform: visible
            ? `translateY(${Math.max(refreshing ? 8 : pull * 0.35 - 8, 0)}px)`
            : "translateY(-120%)",
          opacity: visible ? Math.min(1, 0.35 + progress * 0.75) : 0,
          transition: refreshing || pull === 0
            ? "transform 0.2s ease, opacity 0.2s ease"
            : "none",
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          gap="2"
          px="3"
          py="1.5"
          borderRadius="full"
          borderWidth="1px"
          borderColor={armed || refreshing ? "border.brand" : "border.default"}
          bg="bg.glass-strong"
          backdropFilter="blur(14px)"
          boxShadow={
            armed || refreshing
              ? "0 0 20px rgba(163, 255, 61, 0.25)"
              : "0 4px 16px rgba(0,0,0,0.35)"
          }
        >
          <Box
            color={armed || refreshing ? "brand.fg" : "fg.muted"}
            display="flex"
            style={{
              transform: refreshing
                ? undefined
                : `rotate(${progress * 180}deg)`,
              transition: refreshing ? undefined : "transform 0.05s linear",
            }}
          >
            {refreshing ? (
              <Loader2 size={16} className="gh-spin" />
            ) : (
              <RefreshCw size={16} strokeWidth={2.25} />
            )}
          </Box>
          <Text
            fontSize="2xs"
            fontFamily="heading"
            fontWeight="extrabold"
            letterSpacing="0.08em"
            textTransform="uppercase"
            color={armed || refreshing ? "brand.fg" : "fg.muted"}
          >
            {refreshing
              ? "Refreshing…"
              : armed
                ? "Release to refresh"
                : "Pull to refresh"}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
