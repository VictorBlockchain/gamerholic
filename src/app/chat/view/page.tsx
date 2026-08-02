"use client";

import { Suspense } from "react";
import { Text } from "@chakra-ui/react";
import { RoomDetailClient } from "@/components/chat/room-detail-client";

export default function ChatViewQueryPage() {
  return (
    <Suspense fallback={<Text color="fg.muted">Loading room…</Text>}>
      <RoomDetailClient />
    </Suspense>
  );
}
