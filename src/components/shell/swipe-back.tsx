"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box } from "@chakra-ui/react";
import { ChevronLeft } from "lucide-react";
import { useSwipeBack } from "@/hooks/use-swipe-back";
import { homeHref } from "@/lib/nav";
import { useSession } from "@/components/providers/session-context";

/**
 * Mobile swipe-right → browser history back (fallback: home/dashboard).
 * Mount once in AppShell. Shows a left-edge chevron while dragging.
 */
export function SwipeBack() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn } = useSession();

  const onBack = useCallback(() => {
    // Cold open / no in-app history → home shell instead of leaving the site
    if (typeof window !== "undefined" && window.history.length <= 1) {
      const home = homeHref(isLoggedIn);
      if (pathname === home || pathname === `${home}/`) return;
      router.push(home);
      return;
    }
    router.back();
  }, [isLoggedIn, pathname, router]);

  const { pull, armed, active } = useSwipeBack({
    onBack,
    mobileOnly: true,
    threshold: 72,
    maxPull: 120,
    edgeOnly: false,
  });

  const visible = active && pull > 6;
  const progress = Math.min(1, pull / 72);

  return (
    <Box
      display={{ base: "block", md: "none" }}
      position="fixed"
      top="50%"
      left="0"
      zIndex={46}
      pointerEvents="none"
      aria-hidden={!visible}
      style={{
        transform: `translateY(-50%) translateX(${visible ? Math.min(pull * 0.45, 36) : -48}px)`,
        opacity: visible ? Math.min(1, 0.25 + progress * 0.85) : 0,
        transition: active
          ? "none"
          : "transform 0.2s ease, opacity 0.2s ease",
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        w="9"
        h="9"
        ml="2"
        borderRadius="full"
        borderWidth="1px"
        borderColor={armed ? "border.brand" : "border.default"}
        bg="bg.glass-strong"
        backdropFilter="blur(14px)"
        boxShadow={
          armed
            ? "0 0 18px rgba(163, 255, 61, 0.35)"
            : "0 4px 16px rgba(0,0,0,0.35)"
        }
        color={armed ? "brand.fg" : "fg.muted"}
      >
        <ChevronLeft size={20} strokeWidth={2.5} />
      </Box>
    </Box>
  );
}
