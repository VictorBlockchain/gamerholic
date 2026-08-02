"use client";

import { useMemo } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { ArcadePlayView } from "@/components/arcade/play-view";

/**
 * Resolve game id from:
 * 1) ?id= query (always works on static /arcade/play/)
 * 2) dynamic route param
 * 3) pathname segment /arcade/play/{id}
 */
export function resolveArcadePlayId(opts: {
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
  if (fromParam && fromParam !== "_") {
    return decodeURIComponent(fromParam);
  }
  if (opts.routeId && opts.routeId !== "_") {
    return decodeURIComponent(opts.routeId);
  }
  const path = opts.pathname || "";
  const m = path.match(/\/arcade\/play\/([^/?#]+)/i);
  if (m?.[1] && m[1] !== "_") {
    return decodeURIComponent(m[1]);
  }
  return "";
}

export function ArcadePlayClient({ routeId }: { routeId?: string }) {
  const params = useParams();
  const pathname = usePathname();
  const search = useSearchParams();

  const gameId = useMemo(
    () =>
      resolveArcadePlayId({
        routeId,
        paramId: params?.id as string | undefined,
        queryId: search?.get("id"),
        pathname,
      }),
    [routeId, params?.id, search, pathname],
  );

  if (!gameId) {
    return <ArcadePlayView gameId="" />;
  }
  return <ArcadePlayView gameId={gameId} />;
}
