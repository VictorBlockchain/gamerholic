"use client";

import { Suspense } from "react";
import { Text } from "@chakra-ui/react";
import { TeamDetailClient } from "@/components/teams/team-detail-client";

export default function TeamViewQueryPage() {
  return (
    <Suspense fallback={<Text color="fg.muted">Loading team…</Text>}>
      <TeamDetailClient />
    </Suspense>
  );
}
