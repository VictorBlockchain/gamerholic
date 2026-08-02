"use client";

import { Suspense } from "react";
import { Text } from "@chakra-ui/react";
import { ChallengeDetailClient } from "@/components/challenges/challenge-detail-client";

/**
 * Always-available static shell: /challenges/view/?id=chal_xxx
 * Required on IC assets — path /challenges/{id} is not prebuilt and falls
 * through to the visitor home HTML.
 */
function ViewInner() {
  return <ChallengeDetailClient />;
}

export default function ChallengeViewQueryPage() {
  return (
    <Suspense fallback={<Text color="fg.muted">Loading challenge…</Text>}>
      <ViewInner />
    </Suspense>
  );
}
