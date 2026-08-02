import { Suspense } from "react";
import { Text } from "@chakra-ui/react";
import { ChallengeDetailClient } from "@/components/challenges/challenge-detail-client";
import { STATIC_ID_PLACEHOLDER } from "@/lib/static-params";

/**
 * Path deep links only work when prebuilt. Default `_` shell + client re-reads
 * path; prefer /challenges/view/?id= for new challenges (see challengeHref).
 */
export function generateStaticParams() {
  return STATIC_ID_PLACEHOLDER;
}

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<Text color="fg.muted">Loading challenge…</Text>}>
      <ChallengeDetailClient routeId={id} />
    </Suspense>
  );
}
