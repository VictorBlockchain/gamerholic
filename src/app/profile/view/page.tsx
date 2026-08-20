"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Text } from "@chakra-ui/react";
import { ProfileView } from "@/components/profile/profile-view";

/**
 * Always-built static shell: /profile/view/?u=username
 * IC assets rewrite /profile/{user} → here (unknown path would hit visitor HTML).
 */
function ViewInner() {
  const search = useSearchParams();
  const u = search.get("u")?.trim() || "";
  return <ProfileView viewUsername={u || undefined} />;
}

export default function ProfileViewQueryPage() {
  return (
    <Suspense fallback={<Text color="fg.muted">Loading profile…</Text>}>
      <ViewInner />
    </Suspense>
  );
}
