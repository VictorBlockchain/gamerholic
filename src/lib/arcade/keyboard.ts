/**
 * Arcade keyboard helpers — stop page scroll and forward keys into the game iframe.
 * Arrow/space/WASD otherwise scroll the parent document when focus is outside the iframe.
 */

export const ARCADE_KEY_CODES = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
]);

export function isArcadeGameKey(e: KeyboardEvent): boolean {
  if (ARCADE_KEY_CODES.has(e.code)) return true;
  const k = e.key;
  return (
    k === " " ||
    k === "ArrowUp" ||
    k === "ArrowDown" ||
    k === "ArrowLeft" ||
    k === "ArrowRight" ||
    k === "w" ||
    k === "a" ||
    k === "s" ||
    k === "d" ||
    k === "W" ||
    k === "A" ||
    k === "S" ||
    k === "D"
  );
}

export type ArcadeKeyMessage = {
  type: "gamerholic:key";
  event: "keydown" | "keyup";
  code: string;
  key: string;
  repeat?: boolean;
};

/**
 * While `active`, prevent browser scroll and post key events to the game iframe.
 * Returns a cleanup function.
 */
export function bindArcadeKeyboardCapture(opts: {
  active: boolean;
  postToGame: (msg: ArcadeKeyMessage) => void;
  iframe?: HTMLIFrameElement | null;
  /**
   * When true (default during mock/live play), steal game keys even if a
   * form field still has focus — otherwise arrows scroll the page / type nowhere.
   */
  stealFromForms?: boolean;
}): () => void {
  if (!opts.active) return () => {};

  const stealFromForms = opts.stealFromForms !== false;

  // Drop form focus so arrows aren't "stuck" in a textarea next to the preview
  try {
    const ae = document.activeElement as HTMLElement | null;
    if (
      ae &&
      (ae.tagName === "INPUT" ||
        ae.tagName === "TEXTAREA" ||
        ae.tagName === "SELECT" ||
        ae.isContentEditable)
    ) {
      ae.blur();
    }
  } catch {
    /* ignore */
  }

  const onKey = (e: KeyboardEvent) => {
    if (!isArcadeGameKey(e)) return;
    const t = e.target as HTMLElement | null;
    const inForm =
      !!t &&
      (t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.tagName === "SELECT" ||
        t.isContentEditable);
    if (inForm && !stealFromForms) return;

    e.preventDefault();
    e.stopPropagation();
    opts.postToGame({
      type: "gamerholic:key",
      event: e.type === "keyup" ? "keyup" : "keydown",
      code: e.code,
      key: e.key,
      repeat: e.repeat,
    });
  };

  window.addEventListener("keydown", onKey, { capture: true, passive: false });
  window.addEventListener("keyup", onKey, { capture: true, passive: false });

  try {
    opts.iframe?.focus({ preventScroll: true });
    opts.iframe?.contentWindow?.focus();
  } catch {
    /* sandbox */
  }

  return () => {
    window.removeEventListener("keydown", onKey, {
      capture: true,
    } as EventListenerOptions);
    window.removeEventListener("keyup", onKey, {
      capture: true,
    } as EventListenerOptions);
  };
}
