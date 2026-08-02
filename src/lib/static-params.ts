/**
 * generateStaticParams helpers for `output: 'export'`.
 * Unknown IDs still need a 404 or asset fallback — we prebuild placeholders
 * and best-effort live IDs when env can reach Supabase / canisters at build.
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

export { PLACEHOLDER as STATIC_ID_PLACEHOLDER };
