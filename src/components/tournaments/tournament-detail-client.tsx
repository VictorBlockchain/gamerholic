"use client";

import { useMemo } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { Text } from "@chakra-ui/react";
import { TournamentDetailView } from "@/components/tournaments/tournament-detail-view";
import { resolveDeepId } from "@/lib/deep-links";

export function TournamentDetailClient({ routeId }: { routeId?: string }) {
  const params = useParams();
  const pathname = usePathname();
  const search = useSearchParams();

  const tournamentId = useMemo(
    () =>
      resolveDeepId({
        routeId,
        paramId: params?.id as string | undefined,
        queryId: search?.get("id"),
        pathname,
        pathPattern: /\/tournaments\/([^/?#]+)/i,
      }),
    [routeId, params?.id, search, pathname],
  );

  if (!tournamentId) {
    return (
      <Text color="fg.muted" fontSize="sm" py="phi4">
        Missing tournament id. Use a link with ?id= or open from the list.
      </Text>
    );
  }
  return <TournamentDetailView tournamentId={tournamentId} />;
}
