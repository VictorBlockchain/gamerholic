import { Suspense } from "react";
import { Text } from "@chakra-ui/react";
import { TournamentDetailClient } from "@/components/tournaments/tournament-detail-client";
import { STATIC_ID_PLACEHOLDER } from "@/lib/static-params";

export function generateStaticParams() {
  return STATIC_ID_PLACEHOLDER;
}

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<Text color="fg.muted">Loading tournament…</Text>}>
      <TournamentDetailClient routeId={id} />
    </Suspense>
  );
}
