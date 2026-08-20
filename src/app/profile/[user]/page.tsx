import { ProfileView } from "@/components/profile/profile-view";

/**
 * Public profile by username: /profile/{user}/
 * Prebuilds `_` for static export; IC unknown paths rewrite via layout → view/?u=
 */
export function generateStaticParams() {
  return [{ user: "_" }];
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ user: string }>;
}) {
  const { user } = await params;
  // `_` static shell = no public slug (treat as own profile entry)
  const viewUsername =
    user && user !== "_" ? decodeURIComponent(user) : undefined;
  return <ProfileView viewUsername={viewUsername} />;
}
