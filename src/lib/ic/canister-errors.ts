/**
 * Graceful parsing of ICP agent / canister reject errors for UI toasts.
 * Never surface raw multi-KB agent stacks when a short reason exists.
 */

export type CanisterCallResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; err: string; code?: string };

/** Short, user-facing message from any thrown agent/canister error. */
export function formatCanisterError(
  e: unknown,
  fallback = "Canister call failed",
): string {
  if (e == null) return fallback;
  if (typeof e === "string") return shorten(e, fallback);
  if (e instanceof Error) {
    return shorten(parseAgentMessage(e.message) || e.message, fallback);
  }
  if (typeof e === "object") {
    const o = e as Record<string, unknown>;
    // @dfinity/agent AgentError shape
    if (typeof o.message === "string") {
      return shorten(parseAgentMessage(o.message), fallback);
    }
    if (typeof o.reject_message === "string") {
      return shorten(String(o.reject_message), fallback);
    }
    if (typeof o.error_message === "string") {
      return shorten(String(o.error_message), fallback);
    }
    try {
      return shorten(JSON.stringify(o), fallback);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function parseAgentMessage(msg: string): string {
  const m = msg || "";
  // Common IC reject shapes
  const rejectMsg =
    m.match(
      /reject message[:\s]+(.+?)(?:\.\s*Check that|\.\s*See documentation|, error code|$)/i,
    )?.[1] ||
    m.match(/Reject text:\s*(.+?)(?:\n|$)/i)?.[1] ||
    m.match(/Canister rejected with message:\s*(.+?)(?:\n|$)/i)?.[1] ||
    m.match(/IC0\d{3}[^:]*:\s*(.+?)(?:\n|$)/)?.[1];
  if (rejectMsg) return rejectMsg.trim();

  if (/IC0406|not found/i.test(m) && /ryjl3|ledger/i.test(m)) {
    return "ICP ledger canister not found on this network — check IC host / ledger principal";
  }
  if (/IC0536|has no update method|has no query method/i.test(m)) {
    return "Method missing on canister — redeploy gh_backend with latest WASM";
  }
  if (/Invalid certificate|fetchRootKey|Invalid signature/i.test(m)) {
    return "Identity / network mismatch — reconnect wallet (local vs mainnet)";
  }
  if (/InsufficientFunds|insufficient/i.test(m)) {
    return "Insufficient ICP in play subaccount (need amount + ledger fee)";
  }
  if (/canister trap|trapped/i.test(m)) {
    return "Canister trapped during call — often a ledger candid mismatch; redeploy backend";
  }
  return m;
}

function shorten(s: string, fallback: string, max = 280): string {
  const t = (s || "").trim().replace(/\s+/g, " ");
  if (!t) return fallback;
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Run an async canister call; never throws — returns { ok, data } | { ok: false, err }.
 */
export async function safeCanisterCall<T>(
  fn: () => Promise<T>,
  fallback = "Canister call failed",
): Promise<CanisterCallResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, err: formatCanisterError(e, fallback) };
  }
}

/** Normalize { ok, err } style candid records + bool legacy. */
export function parseOkErr(
  raw: unknown,
  failMsg = "Request failed",
): { ok: boolean; err: string } {
  if (typeof raw === "boolean") {
    return { ok: raw, err: raw ? "" : failMsg };
  }
  if (raw && typeof raw === "object") {
    const o = raw as { ok?: boolean; err?: string; error?: string };
    if ("ok" in o) {
      const ok = Boolean(o.ok);
      return {
        ok,
        err: ok ? "" : String(o.err || o.error || failMsg),
      };
    }
  }
  return { ok: false, err: failMsg };
}
