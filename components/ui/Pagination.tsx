"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
};

/** Compute the page numbers to display, with -1 representing an ellipsis. */
function getPageNumbers(current: number, total: number): (number | -1)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | -1)[] = [1];

  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2) pages.push(-1);
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push(-1);

  pages.push(total);
  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  itemLabel = "items",
  onPageChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);
  const pages = getPageNumbers(currentPage, totalPages);
  const multiPage = totalPages > 1;

  const btnBase =
    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-150 focus-ring select-none";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-glassBorder/60 pt-4 mt-1">
      {/* Showing X to Y of Z */}
      <p className="text-sm text-mutedForeground">
        Showing{" "}
        <span className="font-bold text-foreground">{from}</span>
        {" "}to{" "}
        <span className="font-bold text-foreground">{to}</span>
        {" "}of{" "}
        <span className="font-bold text-foreground">{totalItems}</span>
        {" "}{itemLabel}
      </p>

      {/* Page controls — only rendered when there is more than one page */}
      {multiPage && (
        <div className="flex items-center gap-1">
          {/* Prev */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className={cn(
              btnBase,
              "border border-glassBorder text-mutedForeground",
              "hover:border-primaryNeon/40 hover:text-primaryNeon hover:bg-primaryNeon/8",
              "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-glassBorder disabled:hover:text-mutedForeground disabled:hover:bg-transparent",
            )}
          >
            <ChevronLeft size={14} />
          </button>

          {/* Page numbers */}
          {pages.map((p, i) =>
            p === -1 ? (
              <span
                key={`ellipsis-${i}`}
                className="flex h-8 w-8 items-center justify-center text-xs text-mutedForeground"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={p === currentPage ? "page" : undefined}
                className={cn(
                  btnBase,
                  p === currentPage
                    ? "bg-primaryNeon text-black border border-primaryNeon shadow-[0_0_12px_rgba(0,229,255,0.35)]"
                    : "border border-glassBorder text-mutedForeground hover:border-primaryNeon/40 hover:text-primaryNeon hover:bg-primaryNeon/8",
                )}
              >
                {p}
              </button>
            ),
          )}

          {/* Next */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className={cn(
              btnBase,
              "border border-glassBorder text-mutedForeground",
              "hover:border-primaryNeon/40 hover:text-primaryNeon hover:bg-primaryNeon/8",
              "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-glassBorder disabled:hover:text-mutedForeground disabled:hover:bg-transparent",
            )}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
