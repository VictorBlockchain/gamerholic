/** Chat safety — strip HTML, block non-Gamerholic links, parse @mentions. */

const URL_RE =
  /(?:https?:\/\/|www\.)[^\s<>"']+/gi;

/** Hosts allowed in chat (plus relative /app paths). */
const ALLOWED_HOST_SUFFIXES = [
  "gamerholic.fun",
  "gamerholic.com",
  "icp0.io",
  "ic0.app",
  "internetcomputer.org",
];

export function isAllowedChatUrl(raw: string): boolean {
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    return ALLOWED_HOST_SUFFIXES.some(
      (d) => host === d || host.endsWith(`.${d}`),
    );
  } catch {
    return false;
  }
}

export type SanitizeResult = {
  sanitized: string;
  ok: boolean;
  reason?: string;
  /** @usernames referenced in the message (lowercase, no @) */
  mentions: string[];
};

/**
 * Sanitize outbound chat: no HTML, length cap, only Gamerholic-family links.
 */
export function sanitizeChatMessage(
  raw: string,
  opts: { maxLength?: number } = {},
): SanitizeResult {
  const max = opts.maxLength ?? 500;
  let s = String(raw ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/<[^>]*>/g, "")
    .trim();
  if (!s) return { sanitized: "", ok: false, reason: "empty", mentions: [] };

  const urls = s.match(URL_RE) || [];
  for (const url of urls) {
    if (!isAllowedChatUrl(url)) {
      return {
        sanitized: s,
        ok: false,
        reason:
          "Only Gamerholic / Internet Computer links are allowed in chat.",
        mentions: extractMentions(s),
      };
    }
  }

  if (s.length > max) s = s.slice(0, max);
  return { sanitized: s, ok: true, mentions: extractMentions(s) };
}

/** @username tokens (letters, numbers, underscore, hyphen) */
export function extractMentions(text: string): string[] {
  const re = /@([a-zA-Z0-9_][a-zA-Z0-9_-]{0,31})/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const u = m[1].toLowerCase();
    if (!out.includes(u)) out.push(u);
  }
  return out;
}

export function safeDisplayText(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
