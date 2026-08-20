"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PullToRefreshOptions = {
  /** Async work to run when user releases past threshold */
  onRefresh: () => Promise<void>;
  /** Disable entirely (e.g. arcade fullscreen) */
  disabled?: boolean;
  /** Pull distance (px) required to trigger refresh. Default 72 */
  threshold?: number;
  /** Max rubber-band distance shown. Default 112 */
  maxPull?: number;
  /** Only when viewport matches mobile bottom-nav. Default true */
  mobileOnly?: boolean;
};

export type PullToRefreshState = {
  /** Current pull distance 0…maxPull (visual) */
  pull: number;
  /** Past threshold, ready to fire on release */
  armed: boolean;
  /** Refresh in progress */
  refreshing: boolean;
};

/**
 * Touch pull-to-refresh when the document is scrolled to the top.
 * Uses window scroll (gh-main is not an overflow container).
 */
export function usePullToRefresh({
  onRefresh,
  disabled = false,
  threshold = 72,
  maxPull = 112,
  mobileOnly = true,
}: PullToRefreshOptions): PullToRefreshState {
  const [pull, setPull] = useState(0);
  const [armed, setArmed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const startY = useRef(0);
  const tracking = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const isMobileViewport = useCallback(() => {
    if (typeof window === "undefined") return false;
    if (!mobileOnly) return true;
    return window.matchMedia("(max-width: 767px)").matches;
  }, [mobileOnly]);

  const atTop = useCallback(() => {
    if (typeof window === "undefined") return false;
    const y =
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    return y <= 1;
  }, []);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    if (disabled || typeof window === "undefined") return;

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      if (!isMobileViewport()) return;
      if (!atTop()) return;
      if (e.touches.length !== 1) return;
      // Don't start PTR inside nested scrollers that aren't at their top
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("[data-no-pull-refresh]")) return;
      const scrollParent = findScrollableParent(t);
      if (scrollParent && scrollParent.scrollTop > 1) return;

      tracking.current = true;
      startY.current = e.touches[0]!.clientY;
      pullRef.current = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking.current || refreshingRef.current) return;
      if (!atTop()) {
        tracking.current = false;
        pullRef.current = 0;
        setPull(0);
        setArmed(false);
        return;
      }
      const y = e.touches[0]!.clientY;
      const delta = y - startY.current;
      if (delta <= 0) {
        pullRef.current = 0;
        setPull(0);
        setArmed(false);
        return;
      }
      // Rubber-band: ease off as pull grows
      const damped = Math.min(maxPull, delta * 0.55);
      pullRef.current = damped;
      setPull(damped);
      setArmed(damped >= threshold);
      // Prevent browser native overscroll bounce fighting the gesture
      if (damped > 8 && e.cancelable) {
        e.preventDefault();
      }
    };

    const finish = async () => {
      if (!tracking.current) return;
      tracking.current = false;
      const shouldRefresh = pullRef.current >= threshold && !refreshingRef.current;
      if (!shouldRefresh) {
        pullRef.current = 0;
        setPull(0);
        setArmed(false);
        return;
      }
      setRefreshing(true);
      setArmed(false);
      setPull(Math.min(56, threshold)); // hold indicator while loading
      try {
        await onRefreshRef.current();
      } catch (e) {
        console.warn("[pull-refresh]", e);
      } finally {
        setRefreshing(false);
        pullRef.current = 0;
        setPull(0);
      }
    };

    const onTouchEnd = () => {
      void finish();
    };
    const onTouchCancel = () => {
      tracking.current = false;
      pullRef.current = 0;
      setPull(0);
      setArmed(false);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [atTop, disabled, isMobileViewport, maxPull, threshold]);

  return { pull, armed, refreshing };
}

function findScrollableParent(el: HTMLElement | null): HTMLElement | null {
  let n: HTMLElement | null = el;
  while (n && n !== document.body && n !== document.documentElement) {
    const style = window.getComputedStyle(n);
    const oy = style.overflowY;
    if (
      (oy === "auto" || oy === "scroll" || oy === "overlay") &&
      n.scrollHeight > n.clientHeight + 4
    ) {
      return n;
    }
    n = n.parentElement;
  }
  return null;
}
