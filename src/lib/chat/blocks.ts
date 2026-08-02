/**
 * Client-side mute/block list for room & dock chat (demo until canister social graph).
 */

const KEY = "gh_chat_blocked_v1";

export function getBlockedUsernames(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.map(String).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

export function isBlocked(username: string): boolean {
  const u = username.replace(/^@/, "").toLowerCase();
  return getBlockedUsernames().some((b) => b.toLowerCase() === u);
}

export function blockUser(username: string): string[] {
  const u = username.replace(/^@/, "").trim();
  if (!u) return getBlockedUsernames();
  const set = new Set(getBlockedUsernames().map((x) => x.toLowerCase()));
  // keep original casing of first add
  const list = getBlockedUsernames().filter((x) => x.toLowerCase() !== u.toLowerCase());
  list.push(u);
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}

export function unblockUser(username: string): string[] {
  const u = username.replace(/^@/, "").toLowerCase();
  const list = getBlockedUsernames().filter((x) => x.toLowerCase() !== u);
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}
