"use client";

import { use } from "react";
import { TournamentDetailView } from "@/components/tournaments/tournament-detail-view";

/**
 * Tournament detail — overview, players, bracket, host controls.
 * Path: /tournaments/[id]
 */
export default function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <TournamentDetailView tournamentId={id} />;
}
