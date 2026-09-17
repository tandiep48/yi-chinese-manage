"use client";

// app/learner/books/page.tsx
// Books tab of the learning page — the book cover grid. Ported from the
// #tab-books / #books-grid markup + loadBooks() in Learning/web_app's
// learning.html / learning.js.

import Link from "next/link";
import { useT } from "@/components/i18n/I18nProvider";
import { useLearnerBooks } from "@/hooks/useLearnerBooks";
import { LearningTabs } from "@/components/page/learner/LearningTabs";
import { bookCoverUrl } from "@/lib/gcs";
import "@/components/page/learner/lesson-picker.css";
import "@/components/page/learner/books.css";

export default function BooksGridPage() {
  const { t } = useT();
  const { loading, error, books } = useLearnerBooks();

  return (
    <div className="lesson-picker">
      <div className="picker-wrap">
        <LearningTabs />

        <h1 className="picker-title">{t("books.select_book")}</h1>
        <p className="picker-subtitle">{t("books.choose_book_subtitle")}</p>

        {loading ? (
          <p className="books-empty">{t("books.loading_books")}</p>
        ) : error ? (
          <p className="books-empty books-empty-error">{t("books.failed_load_books")}</p>
        ) : books.length === 0 ? (
          <p className="books-empty">{t("books.no_books_found")}</p>
        ) : (
          <div className="books-grid">
            {books.map((book) => {
              let parts = t("books.parts_count", { count: book.part_count });
              if (book.done_count > 0) parts += ` · ${book.done_count}/${book.part_count}`;
              return (
                <Link key={book.book_code} href={`/learner/books/${encodeURIComponent(book.book_code)}`} className="book-card">
                  <div className="book-card-img-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="book-card-img"
                      src={bookCoverUrl(book.book_code)}
                      alt={book.name || book.book_code}
                      loading="lazy"
                      onError={(e) => {
                        const wrap = e.currentTarget.parentElement;
                        if (wrap) wrap.style.display = "none";
                      }}
                    />
                  </div>
                  <div className="book-card-body">
                    <div className="book-card-title">{book.name || book.book_code}</div>
                    <div className="book-card-count">{t("books.lessons_count", { count: book.lesson_count })}</div>
                    <div className="book-card-count">{parts}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
