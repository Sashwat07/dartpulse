"use client";

import * as React from "react";

/**
 * Scroll-triggered progressive reveal: when a sentinel element enters the viewport
 * and more items remain, onLoadMore is called. Prevents duplicate triggers while
 * sentinel stays in view; allows loading again after user scrolls and sentinel
 * re-enters.
 */
export function useInfiniteReveal(
  hasMore: boolean,
  onLoadMore: () => void,
  options?: { rootMargin?: string; threshold?: number },
): React.RefObject<HTMLDivElement | null> {
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const onLoadMoreRef = React.useRef(onLoadMore);
  const canLoadRef = React.useRef(true);
  onLoadMoreRef.current = onLoadMore;

  React.useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) return;
        if (entry.isIntersecting) {
          if (hasMore && canLoadRef.current) {
            canLoadRef.current = false;
            onLoadMoreRef.current();
            // Allow next chunk when sentinel stays in view (e.g. short list / large viewport)
            requestAnimationFrame(() => {
              canLoadRef.current = true;
            });
          }
        } else {
          canLoadRef.current = true;
        }
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
