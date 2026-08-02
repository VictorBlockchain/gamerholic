"use client";

import { use } from "react";
import { ArcadePlayView } from "@/components/arcade/play-view";

export default function ArcadePlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ArcadePlayView gameId={decodeURIComponent(id)} />;
}
