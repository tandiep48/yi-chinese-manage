"use client";

// app/learner/books/[code]/[lesson]/page.tsx
// Books tab — the part list for one book lesson. Ported from the
// #books-screen-parts markup + openBookLesson() in Learning/web_app's
// learning.html / learning.js. Selecting a part opens the lesson view (the
// legacy page opened /reading; here that is /lesson?passage_id=<id>).

import { use } from "react";
import Link from "next/link";
import { useT } from "@/components/i18n/I18nProvider";
import { useLearnerBook } from "@/hooks/useLearnerBook";
import { lessonHrefForPassage } from "@/lib/lessons/passageNav";
import "@/components/page/learner/lesson-picker.css";

export default function BookPartsPage({
  params,
}: {
  params: Promise<{ code: string; lesson: string }>;
}) {
  const { code, lesson } = use(params);
  const { t } = useT();
  const { loading, error, book } = useLearnerBook(code);

  const current = book?.lessons.find((l) => String(l.lesson) === String(lesson));
  const bookTitle = book?.book_name || code;
  const lessonLabel = current?.title || `${t("picker.lesson_prefix")} ${lesson}`;
  const parts = current?.parts ?? [];

  return (
    <div className="lesson-picker">
      <div className="picker-wrap picker-wrap-narrow">
        <div className="picker-toolbar-section">
          <Link href={`/learner/books/${encodeURIComponent(code)}`} className="picker-back-button">
            ← {t("books.back_to_lessons")}
          </Link>
        </div>

        <div className="picker-header-section">
          <div className="picker-header-col2">
            <h2>
              {bookTitle} · {lessonLabel}
            </h2>
          </div>
        </div>

        <div className="picker-cards-section">
          {loading ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center" }}>{t("picker.loading_parts")}</p>
          ) : error ? (
            <p style={{ color: "var(--danger, #dc2626)", textAlign: "center" }}>{t("books.failed_load_lessons")}</p>
          ) : !current || parts.length === 0 ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center" }}>{t("picker.no_lessons_found")}</p>
          ) : (
            <div className="part-list">
              {parts.map((part) => (
                <Link
                  key={part.passage_id}
                  href={lessonHrefForPassage(part.passage_id, "lesson")}
                  className="part-list-item"
                >
                  <div className="part-list-title">
                    {t("picker.part_prefix")} {part.part}
                    {part.completed ? (
                      <span className="book-part-done">✓ {t("books.completed")}</span>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
