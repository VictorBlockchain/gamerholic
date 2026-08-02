import { Suspense } from "react";
import { Text } from "@chakra-ui/react";
import { RoomDetailClient } from "@/components/chat/room-detail-client";
import { STATIC_ID_PLACEHOLDER } from "@/lib/static-params";

export function generateStaticParams() {
  return STATIC_ID_PLACEHOLDER;
}

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<Text color="fg.muted">Loading room…</Text>}>
      <RoomDetailClient routeId={decodeURIComponent(id)} />
    </Suspense>
  );
}
