"use client";

import * as React from "react";

export type UseInfiniteRevealOptions = {
  rootMargin?: string;
  threshold?: number;
  /**
   * When these values change (e.g. visibleCount, list length), re-check whether the
   * sentinel still intersects the viewport and load again if needed. IntersectionObserver
   * alone often does not fire again when the target stays intersecting after layout
   * shifts (classic infinite-scroll bug).
   */
  layoutCheckDeps?: readonly unknown[];
};

function marginPx(rootMargin?: string): number {
  const m = (rootMargin ?? "120px").trim().match(/^(\d+(?:\.\d+)?)px$/i);
  return m ? Number(m[1]) : 120;
}

function sentinelIntersectsViewport(el: HTMLElement, margin: number): boolean {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  return (
    rect.top < vh + margin &&
    rect.bottom > -margin &&
    rect.left < vw + margin &&
    rect.right > -margin
  );
}

const EMPTY_DEPS: readonly unknown[] = [];

/**
 * Scroll-triggered progressive reveal: when a sentinel enters the viewport, onLoadMore runs.
 * Also re-checks after list layout changes so loading continues if the sentinel stays in view.
 */
export function useInfiniteReveal(
  hasMore: boolean,
  onLoadMore: () => void,
  options?: UseInfiniteRevealOptions,
): React.RefObject<HTMLDivElement | null> {
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const onLoadMoreRef = React.useRef(onLoadMore);
  const hasMoreRef = React.useRef(hasMore);
  onLoadMoreRef.current = onLoadMore;
  hasMoreRef.current = hasMore;

  const mPx = marginPx(options?.rootMargin);
  const layoutDeps = options?.layoutCheckDeps ?? EMPTY_DEPS;

  React.useLayoutEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    if (!sentinelIntersectsViewport(el, mPx)) return;
    onLoadMoreRef.current();
  }, [hasMore, mPx, ...layoutDeps]);

  React.useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || !hasMoreRef.current) return;
        onLoadMoreRef.current();
      },
      {
        rootMargin: options?.rootMargin ?? "120px",
        threshold: options?.threshold ?? 0,
      },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, options?.rootMargin, options?.threshold]);

  return sentinelRef;
}
