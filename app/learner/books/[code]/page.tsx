"use client";

// app/learner/books/[code]/page.tsx
// Books tab — the lesson list for one book. Ported from the
// #books-screen-lessons markup + openBook()/renderBookLessons() in
// Learning/web_app's learning.html / learning.js.

import { use } from "react";
import Link from "next/link";
import { useT } from "@/components/i18n/I18nProvider";
import { useLearnerBook } from "@/hooks/book/useLearnerBook";
import { bookCoverUrl } from "@/lib/gcs";
import "@/components/page/learner/lesson-picker.css";
import "@/components/page/learner/books.css";

export default function BookLessonsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const { t } = useT();
  const { loading, error, book } = useLearnerBook(code);

  const lessons = book?.lessons ?? [];
  const bookTitle = book?.book_name || code;

  return (
    <div className="lesson-picker">
      <div className="picker-wrap">
        <div className="picker-toolbar-section">
          <Link href="/learner/books" className="picker-back-button">
            ← {t("books.back_to_books")}
          </Link>
        </div>

        <div className="picker-header-section">
          <div className="picker-header-col1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="picker-header-lesson-img"
              src={bookCoverUrl(code)}
              alt={bookTitle}
              onError={(e) => {
                const wrap = e.currentTarget.parentElement;
                if (wrap) wrap.style.display = "none";
              }}
            />
          </div>
          <div className="picker-header-col2">
            <h2>{bookTitle}</h2>
            <p className="subtitle">{t("books.lessons_count", { count: lessons.length })}</p>
          </div>
        </div>

        <div className="picker-cards-section">
          {loading ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center" }}>{t("books.loading_lessons")}</p>
          ) : error ? (
            <p style={{ color: "var(--danger, #dc2626)", textAlign: "center" }}>{t("books.failed_load_lessons")}</p>
          ) : lessons.length === 0 ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center" }}>{t("books.no_books_found")}</p>
          ) : (
            <div className="lesson-list">
              {lessons.map((lesson) => {
                const label = `${t("picker.lesson_prefix")} ${lesson.lesson}`;
                const title = lesson.title || label;
                const sub = lesson.title ? label : "";
                let count = t("books.parts_count", { count: lesson.part_count });
                if (lesson.done_count > 0) count += ` · ${lesson.done_count}/${lesson.part_count}`;
                return (
                  <Link
                    key={String(lesson.lesson)}
                    href={`/learner/books/${encodeURIComponent(code)}/${encodeURIComponent(String(lesson.lesson))}`}
                    className="lesson-card"
                  >
                    <div className="lesson-card-body">
                      <div className="lesson-card-title">{title}</div>
                      {sub ? <div className="lesson-card-sub">{sub}</div> : null}
                      <div className="lesson-card-count">{count}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
