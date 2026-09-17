// lib/types/book.ts
// Books: the admin CRUD row and the learner Books browsing shapes.
// Mirrors the JSON shapes served by the Flask app in ../../../Learning.

export interface Book {
  book_code: string;
  name_en: string | null;
  name_vn: string | null;
}

// ── Learner Books browsing (Books tab of the learning page) — mirrors the raw
// JSON shapes from Learning/web_app/routes/lesson/lesson_routes.py's
// GET /api/lesson/books and GET /api/lesson/book/<code>.
export interface LearnerBookSummary {
  book_code: string;
  name?: string | null;
  cover_url: string;
  lesson_count: number;
  part_count: number;
  done_count: number;
}

export interface LearnerBookPart {
  part: string | number;
  passage_id: string;
  completed?: boolean;
}

export interface LearnerBookLesson {
  lesson: string | number;
  title?: string | null;
  part_count: number;
  done_count: number;
  parts: LearnerBookPart[];
}

export interface LearnerBookDetail {
  book_code: string;
  book_name?: string | null;
  lessons: LearnerBookLesson[];
}

export type BookFormData = {
  book_code: string;
  name_en?: string;
  name_vn?: string;
};
