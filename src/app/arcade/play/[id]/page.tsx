import { Suspense } from "react";
import { Text } from "@chakra-ui/react";
import { ArcadePlayClient } from "@/components/arcade/arcade-play-client";
import { arcadePlayStaticParams } from "@/lib/static-params";

/**
 * Pre-render every known cabinet id at build so IC assets deep links work.
 * Client also re-reads id from the URL path (handles soft nav + odd hosts).
 */
export async function generateStaticParams() {
  return arcadePlayStaticParams();
}

export default async function ArcadePlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<Text color="fg.muted">Loading play…</Text>}>
      <ArcadePlayClient routeId={id} />
    </Suspense>
  );
}
