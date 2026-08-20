"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@chakra-ui/react";
import { HomeView } from "@/components/home/home-view";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { GhSpinner } from "@/components/ui";
import { useSession } from "@/components/providers/session-context";

/**
 * App home:
 * - Visitor → marketing / visitor home
 * - Logged in → dashboard (arena home); URL may rewrite to /dashboard
 */
export default function HomePage() {
  const { isLoggedIn, authReady } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;
    if (isLoggedIn) {
      router.replace("/dashboard");
    }
  }, [authReady, isLoggedIn, router]);

  if (!authReady) {
    return (
      <Box py="phi6" display="flex" justifyContent="center">
        <GhSpinner />
      </Box>
    );
  }

  if (isLoggedIn) {
    // Show dashboard immediately while replace to /dashboard settles
    return <DashboardView />;
  }

  return <HomeView />;
}
