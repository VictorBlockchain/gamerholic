"use client";

import { useMemo } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { Text } from "@chakra-ui/react";
import { TeamDetailView } from "@/components/teams/team-detail-view";
import { resolveDeepId } from "@/lib/deep-links";

export function TeamDetailClient({ routeId }: { routeId?: string }) {
  const params = useParams();
  const pathname = usePathname();
  const search = useSearchParams();

  const teamId = useMemo(
    () =>
      resolveDeepId({
        routeId,
        paramId: params?.id as string | undefined,
        queryId: search?.get("id"),
        pathname,
        pathPattern: /\/teams\/([^/?#]+)/i,
      }),
    [routeId, params?.id, search, pathname],
  );

  if (!teamId) {
    return (
      <Text color="fg.muted" fontSize="sm" py="phi4">
        Missing team id. Use a link with ?id= or open from the list.
      </Text>
    );
  }
  return <TeamDetailView teamId={teamId} />;
}
