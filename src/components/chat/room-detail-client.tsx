"use client";

import { useMemo } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { Text } from "@chakra-ui/react";
import { GroupHubView } from "@/components/rooms/group-hub-view";
import { resolveDeepId } from "@/lib/deep-links";

/** Room / community group detail shell (static-export safe ?id=). */
export function RoomDetailClient({ routeId }: { routeId?: string }) {
  const params = useParams();
  const pathname = usePathname();
  const search = useSearchParams();

  const roomId = useMemo(
    () =>
      resolveDeepId({
        routeId,
        paramId: params?.id as string | undefined,
        queryId: search?.get("id"),
        pathname,
        pathPattern: /\/chat\/([^/?#]+)/i,
      }),
    [routeId, params?.id, search, pathname],
  );

  if (!roomId) {
    return (
      <Text color="fg.muted" fontSize="sm" py="phi4">
        Missing group id. Use a link with ?id= or open from Rooms.
      </Text>
    );
  }
  return <GroupHubView roomId={roomId} />;
}
