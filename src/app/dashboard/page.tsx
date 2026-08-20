"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@chakra-ui/react";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { GhSpinner } from "@/components/ui";
import { useSession } from "@/components/providers/session-context";

/**
 * Logged-in home (arena). Visitors are sent to marketing `/`.
 */
export default function DashboardPage() {
  const { isLoggedIn, authReady } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;
    if (!isLoggedIn) {
      router.replace("/");
    }
  }, [authReady, isLoggedIn, router]);

  if (!authReady || !isLoggedIn) {
    return (
      <Box py="phi6" display="flex" justifyContent="center">
        <GhSpinner />
      </Box>
    );
  }

  return <DashboardView />;
}
