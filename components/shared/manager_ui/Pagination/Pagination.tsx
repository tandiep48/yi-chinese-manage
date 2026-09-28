// components/shared/manager_ui/Pagination/Pagination.tsx
// Page controls: Prev / page pills / Next
import { PAGINATION_DESIGN, PAGINATION_TEXT } from './constants';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Build page number array (max 7 visible)
  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  const { btnBase, btnActive, btnDefault, btnDisabled } = PAGINATION_DESIGN;

  return (
    <div className={PAGINATION_DESIGN.container}>
      <p className={PAGINATION_DESIGN.textContainer}>
        {PAGINATION_TEXT.showing} <span className={PAGINATION_DESIGN.textHighlight}>{from}–{to}</span> {PAGINATION_TEXT.of}{" "}
        <span className={PAGINATION_DESIGN.textHighlight}>{total}</span>
      </p>

      <nav aria-label="Pagination" className={PAGINATION_DESIGN.nav}>
        {/* Prev */}
        <button
          id="pagination-prev"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={`${btnBase} ${page <= 1 ? btnDisabled : btnDefault}`}
          aria-label="Previous page"
        >
          ←
        </button>

        {/* Page pills */}
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className={PAGINATION_DESIGN.ellipsis}>
              …
            </span>
          ) : (
            <button
              key={p}
              id={`pagination-page-${p}`}
              onClick={() => onPageChange(p as number)}
              aria-current={p === page ? "page" : undefined}
              className={`${btnBase} ${p === page ? btnActive : btnDefault}`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          id="pagination-next"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={`${btnBase} ${page >= totalPages ? btnDisabled : btnDefault}`}
          aria-label="Next page"
        >
          →
        </button>
      </nav>
    </div>
  );
}
