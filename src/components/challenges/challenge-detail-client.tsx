"use client";

import { useMemo } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { Text } from "@chakra-ui/react";
import { ChallengeDetailView } from "@/components/challenges/challenge-detail-view";

/**
 * Resolve challenge id from:
 * 1) ?id= query (always works on static /challenges/view/)
 * 2) dynamic route param /challenges/[id]
 * 3) pathname segment /challenges/{id}
 */
export function resolveChallengeId(opts: {
  routeId?: string;
  paramId?: string | string[];
  queryId?: string | null;
  pathname?: string | null;
}): string {
  if (opts.queryId && opts.queryId.trim()) {
    return decodeURIComponent(opts.queryId.trim());
  }
  const fromParam = Array.isArray(opts.paramId)
    ? opts.paramId[0]
    : opts.paramId;
  if (fromParam && fromParam !== "_" && fromParam !== "view") {
    return decodeURIComponent(fromParam);
  }
  if (opts.routeId && opts.routeId !== "_" && opts.routeId !== "view") {
    return decodeURIComponent(opts.routeId);
  }
  const path = opts.pathname || "";
  const m = path.match(/\/challenges\/([^/?#]+)/i);
  if (m?.[1] && m[1] !== "_" && m[1] !== "view") {
    return decodeURIComponent(m[1]);
  }
  return "";
}

export function ChallengeDetailClient({ routeId }: { routeId?: string }) {
  const params = useParams();
  const pathname = usePathname();
  const search = useSearchParams();

  // Depend on search.get("id") string, not the searchParams object identity
  const queryId = search?.get("id") ?? null;
  const challengeId = useMemo(
    () =>
      resolveChallengeId({
        routeId,
        paramId: params?.id as string | undefined,
        queryId,
        pathname,
      }),
    [routeId, params?.id, queryId, pathname],
  );

  if (!challengeId) {
    return (
      <Text color="fg.muted" fontSize="sm" py="phi4">
        Missing challenge id. Open a challenge from the list or use a link with
        ?id=.
      </Text>
    );
  }

  return <ChallengeDetailView challengeId={challengeId} />;
}
