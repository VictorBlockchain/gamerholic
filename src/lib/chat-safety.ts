// Lightweight chat safety helpers to sanitize and validate user-submitted text.
// Designed for reuse across chat components.

export type ChatSanitizeResult = {
  sanitized: string;
  ok: boolean;
  reason?: string;
};

const DEFAULT_MAX_LENGTH = 500;

// Disallowed indicators that commonly signal malicious intent.
const DISALLOWED_PATTERNS = [
  /<\s*script\b[^>]*>/i,
  /<\s*iframe\b[^>]*>/i,
  /<\s*object\b[^>]*>/i,
  /<\s*embed\b[^>]*>/i,
  /javascript:\s*/i,
  /vbscript:\s*/i,
  /data:\s*text\/html/i,
];

// Remove all HTML tags, control characters, and normalize whitespace.
function basicSanitize(input: string): string {
  // Normalize newlines to spaces to avoid layout abuse
  let out = input.replace(/\r?\n+/g, " ");
  // Strip HTML tags
  out = out.replace(/<[^>]*>/g, "");
  // Remove ASCII control characters except tab (\t) which we convert to space
  out = out.replace(/[\u0000-\u001F\u007F]/g, " ");
  // Collapse excessive whitespace
  out = out.replace(/\s{2,}/g, " ").trim();
  return out;
}

// Validate for obviously malicious intent and apply sanitation.
export function sanitizeChatMessage(
  input: string,
  opts?: { maxLength?: number }
): ChatSanitizeResult {
  if (!input || typeof input !== "string") {
    return { sanitized: "", ok: false, reason: "Empty message" };
  }

  const max = opts?.maxLength ?? DEFAULT_MAX_LENGTH;

  // Fast checks on raw input before sanitation
  for (const re of DISALLOWED_PATTERNS) {
    if (re.test(input)) {
      return { sanitized: "", ok: false, reason: "Disallowed content detected" };
    }
  }

  let sanitized = basicSanitize(input);

  // If sanitation results in empty string, reject
  if (!sanitized) {
    return { sanitized: "", ok: false, reason: "Message is empty after sanitize" };
  }

  // Length enforcement: truncate rather than reject
  if (sanitized.length > max) {
    sanitized = sanitized.slice(0, max);
  }

  // Secondary check in case hostile strings survive tag stripping
  for (const re of DISALLOWED_PATTERNS) {
    if (re.test(sanitized)) {
      return { sanitized: "", ok: false, reason: "Disallowed content detected" };
    }
  }

  return { sanitized, ok: true };
}

// Convenience helper that only returns a safe string for display; empty if unsafe.
export function safeDisplayText(input: string, opts?: { maxLength?: number }): string {
  const res = sanitizeChatMessage(input, opts);
  return res.ok ? res.sanitized : "";
}