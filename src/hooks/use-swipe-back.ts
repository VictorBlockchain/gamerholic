"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SwipeBackOptions = {
  /** Called when gesture commits (past threshold on release) */
  onBack: () => void;
  disabled?: boolean;
  /** Min horizontal travel (px). Default 72 */
  threshold?: number;
  /** Max visual drag (px). Default 120 */
  maxPull?: number;
  /** Only max-width 767px. Default true */
  mobileOnly?: boolean;
  /**
   * If true, only start when touch begins near the left edge.
   * Default false — any clear right-swipe (horizontal dominant).
   */
  edgeOnly?: boolean;
  /** Edge width when edgeOnly. Default 28 */
  edgeWidth?: number;
};

export type SwipeBackState = {
  /** Visual pull 0…maxPull */
  pull: number;
  /** Past threshold */
  armed: boolean;
  /** Gesture in progress */
  active: boolean;
};

/**
 * Mobile swipe-right → go back.
 * Horizontal-dominant gestures only; skips vertical PTR, inputs, and
 * `[data-no-swipe-back]` / horizontal scrollers mid-scroll.
 */
export function useSwipeBack({
  onBack,
  disabled = false,
  threshold = 72,
  maxPull = 120,
  mobileOnly = true,
  edgeOnly = false,
  edgeWidth = 28,
}: SwipeBackOptions): SwipeBackState {
  const [pull, setPull] = useState(0);
  const [armed, setArmed] = useState(false);
  const [active, setActive] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);
  const decided = useRef(false);
  const isHorizontal = useRef(false);
  const pullRef = useRef(0);
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  const isMobileViewport = useCallback(() => {
    if (typeof window === "undefined") return false;
    if (!mobileOnly) return true;
    return window.matchMedia("(max-width: 767px)").matches;
  }, [mobileOnly]);

  useEffect(() => {
    if (disabled || typeof window === "undefined") return;

    const reset = () => {
      tracking.current = false;
      decided.current = false;
      isHorizontal.current = false;
      pullRef.current = 0;
      setPull(0);
      setArmed(false);
      setActive(false);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!isMobileViewport()) return;
      if (e.touches.length !== 1) return;
      const t = e.target as HTMLElement | null;
      if (shouldIgnoreTarget(t)) return;
      const x = e.touches[0]!.clientX;
      if (edgeOnly && x > edgeWidth) return;

      tracking.current = true;
      decided.current = false;
      isHorizontal.current = false;
      startX.current = x;
      startY.current = e.touches[0]!.clientY;
      pullRef.current = 0;
      setPull(0);
      setArmed(false);
      setActive(false);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking.current) return;
      const x = e.touches[0]!.clientX;
      const y = e.touches[0]!.clientY;
      const dx = x - startX.current;
      const dy = y - startY.current;

      if (!decided.current) {
        // Wait for a clear axis before claiming the gesture
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        decided.current = true;
        // Right-swipe, horizontal-dominant
        isHorizontal.current =
          dx > 8 && Math.abs(dx) > Math.abs(dy) * 1.25;
        if (!isHorizontal.current) {
          tracking.current = false;
          return;
        }
        setActive(true);
      }

      if (!isHorizontal.current) return;

      if (dx <= 0) {
        pullRef.current = 0;
        setPull(0);
        setArmed(false);
        return;
      }

      const damped = Math.min(maxPull, dx * 0.85);
      pullRef.current = damped;
      setPull(damped);
      setArmed(damped >= threshold);

      if (damped > 10 && e.cancelable) {
        e.preventDefault();
      }
    };

    const finish = () => {
      if (!tracking.current) return;
      const shouldBack =
        isHorizontal.current && pullRef.current >= threshold;
      reset();
      if (shouldBack) {
        try {
          onBackRef.current();
        } catch (err) {
          console.warn("[swipe-back]", err);
        }
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", finish, { passive: true });
    window.addEventListener("touchcancel", reset, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", finish);
      window.removeEventListener("touchcancel", reset);
    };
  }, [disabled, edgeOnly, edgeWidth, isMobileViewport, maxPull, threshold]);

  return { pull, armed, active };
}

function shouldIgnoreTarget(el: HTMLElement | null): boolean {
  if (!el) return true;
  if (el.closest?.("[data-no-swipe-back]")) return true;
  if (el.closest?.("[data-no-pull-refresh]")) return true; // arcade / fullscreen
  const tag = el.tagName;
  if (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    (el as HTMLElement).isContentEditable
  ) {
    return true;
  }
  // Horizontal scroller mid-pan — don't steal
  const hScroll = findHorizontalScrollParent(el);
  if (hScroll && hScroll.scrollLeft > 2) return true;
  return false;
}

function findHorizontalScrollParent(el: HTMLElement | null): HTMLElement | null {
  let n: HTMLElement | null = el;
  while (n && n !== document.body && n !== document.documentElement) {
    const style = window.getComputedStyle(n);
    const ox = style.overflowX;
    if (
      (ox === "auto" || ox === "scroll" || ox === "overlay") &&
      n.scrollWidth > n.clientWidth + 4
    ) {
      return n;
    }
    n = n.parentElement;
  }
  return null;
}
