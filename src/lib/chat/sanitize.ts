/** Minimal chat safety (ported from legacy gamerholic chat-safety). */

export function sanitizeChatMessage(
  raw: string,
  opts: { maxLength?: number } = {},
): { sanitized: string; ok: boolean } {
  const max = opts.maxLength ?? 500;
  let s = String(raw ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/<[^>]*>/g, "")
    .trim();
  if (!s) return { sanitized: "", ok: false };
  if (s.length > max) s = s.slice(0, max);
  return { sanitized: s, ok: true };
}

export function safeDisplayText(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
