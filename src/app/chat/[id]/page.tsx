import { RoomDetailView } from "@/components/chat/room-detail-view";

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RoomDetailView roomId={decodeURIComponent(id)} />;
}
