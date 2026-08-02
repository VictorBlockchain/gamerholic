import { TournamentDetailView } from "@/components/tournaments/tournament-detail-view";
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
  return <TournamentDetailView tournamentId={id} />;
}
