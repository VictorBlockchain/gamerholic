/**
 * generateStaticParams helpers for `output: 'export'`.
 * Prefetches live IDs so IC asset deep links get real HTML shells.
 */

const PLACEHOLDER = [{ id: "_" }];

export async function staticParamsFromIds(
  loader: () => Promise<string[]>,
): Promise<{ id: string }[]> {
  try {
    const ids = await loader();
    const unique = [...new Set(ids.map(String).filter(Boolean))];
    if (unique.length === 0) return PLACEHOLDER;
    return unique.map((id) => ({ id }));
  } catch {
    return PLACEHOLDER;
  }
}

/** All published arcade game ids (for /arcade/play/[id] static export). */
export async function arcadePlayStaticParams(): Promise<{ id: string }[]> {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!url || !key) return PLACEHOLDER;
  try {
    const res = await fetch(
      `${url}/rest/v1/gh_arcade_games?select=id&published=eq.true&limit=500`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        // build-time only
        cache: "no-store",
      },
    );
    if (!res.ok) return PLACEHOLDER;
    const rows = (await res.json()) as { id?: string }[];
    const ids = rows.map((r) => String(r.id || "")).filter(Boolean);
    // Always include placeholder for unknown / pre-create soft links
    const set = new Set(["_", ...ids]);
    return [...set].map((id) => ({ id }));
  } catch {
    return PLACEHOLDER;
  }
}

export { PLACEHOLDER as STATIC_ID_PLACEHOLDER };
