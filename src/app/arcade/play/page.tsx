"use client";

import { Suspense } from "react";
import { Text } from "@chakra-ui/react";
import { ArcadePlayClient } from "@/components/arcade/arcade-play-client";

/**
 * Always-available static shell: /arcade/play/?id=game_xxx
 * Use when path-based deep links are not prebuilt on the assets canister.
 */
function PlayQueryInner() {
  return <ArcadePlayClient />;
}

export default function ArcadePlayQueryPage() {
  return (
    <Suspense fallback={<Text color="fg.muted">Loading play…</Text>}>
      <PlayQueryInner />
    </Suspense>
  );
}
