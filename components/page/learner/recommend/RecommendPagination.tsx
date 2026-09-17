"use client";

// components/page/learner/recommend/RecommendPagination.tsx
// Numbered pager with prev/next + "start-end of total" info — ports
// renderPagination() from static/recommend/recommend.js. Hidden when one page.

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import type { PageToken } from "@/lib/recommend/recommendLogic";
import "./recommend-pagination.css";

export function RecommendPagination({
  page,
  totalPages,
  totalItems,
  pageNumbers,
  pageSize,
  onGo,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageNumbers: PageToken[];
  pageSize: number;
  onGo: (page: number) => void;
}) {
  const { t } = useT();
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="pagination-bar">
      <button
        className={`page-btn${page === 1 ? " disabled" : ""}`}
        disabled={page === 1}
        onClick={() => onGo(page - 1)}
        aria-label={t("recommend.prev_page")}
      >
        <FontAwesomeIcon icon={faChevronLeft} aria-hidden />
      </button>

      {pageNumbers.map((tok, i) =>
        tok === "..." ? (
          <span key={`e${i}`} className="page-ellipsis">
            …
          </span>
        ) : (
          <button
            key={tok}
            className={`page-btn${tok === page ? " active" : ""}`}
            onClick={() => onGo(tok)}
          >
            {tok}
          </button>
        )
      )}

      <button
        className={`page-btn${page === totalPages ? " disabled" : ""}`}
        disabled={page === totalPages}
        onClick={() => onGo(page + 1)}
        aria-label={t("recommend.next_page")}
      >
        <FontAwesomeIcon icon={faChevronRight} aria-hidden />
      </button>

      <span className="page-info">
        {t("recommend.page_range", { start, end, total: totalItems })}
      </span>
    </div>
  );
}
