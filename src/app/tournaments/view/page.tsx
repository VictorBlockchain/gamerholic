"use client";

import { Suspense } from "react";
import { Text } from "@chakra-ui/react";
import { TournamentDetailClient } from "@/components/tournaments/tournament-detail-client";

export default function TournamentViewQueryPage() {
  return (
    <Suspense fallback={<Text color="fg.muted">Loading tournament…</Text>}>
      <TournamentDetailClient />
    </Suspense>
  );
}
