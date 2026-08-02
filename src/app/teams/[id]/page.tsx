"use client";

import { use } from "react";
import { TeamDetailView } from "@/components/teams/team-detail-view";

/**
 * Team detail — cover, logo, stats, roster, match/tournament cards.
 */
export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <TeamDetailView teamId={id} />;
}
