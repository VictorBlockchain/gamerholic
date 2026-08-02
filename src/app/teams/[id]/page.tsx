import { Suspense } from "react";
import { Text } from "@chakra-ui/react";
import { TeamDetailClient } from "@/components/teams/team-detail-client";
import { STATIC_ID_PLACEHOLDER } from "@/lib/static-params";

export function generateStaticParams() {
  return STATIC_ID_PLACEHOLDER;
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<Text color="fg.muted">Loading team…</Text>}>
      <TeamDetailClient routeId={id} />
    </Suspense>
  );
}
