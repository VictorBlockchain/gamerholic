"use client";

import { use } from "react";
import { ChallengeDetailView } from "@/components/challenges/challenge-detail-view";

/**
 * Heads-up challenge detail — accept with stream URL.
 */
export default function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ChallengeDetailView challengeId={id} />;
}
