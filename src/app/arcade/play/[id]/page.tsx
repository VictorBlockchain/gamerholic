import { ArcadePlayView } from "@/components/arcade/play-view";
import { STATIC_ID_PLACEHOLDER } from "@/lib/static-params";

export function generateStaticParams() {
  return STATIC_ID_PLACEHOLDER;
}

export default async function ArcadePlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ArcadePlayView gameId={decodeURIComponent(id)} />;
}
