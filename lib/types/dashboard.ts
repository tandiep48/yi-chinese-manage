// lib/types/dashboard.ts
// Learner dashboard: current lesson, global stats, the three-day charts
// and the recommendation feed.
// Mirrors the JSON shapes served by the Flask app in ../../../Learning.

// ── Learner dashboard — mirrors the raw (non-enveloped) JSON shapes from
// Learning/web_app/routes/user/user_routes.py and routes/practice/practice_routes.py.
export interface DashboardLesson {
  passage_id: string;
  hsk_level: string;
  level: number;
  lesson: number;
  part: number;
  passage_ids: string[];
  updated_at: string | null;
}

export interface DashboardCurrentLesson {
  has_recent: boolean;
  lesson?: DashboardLesson;
}

export interface GlobalStatsBucket {
  questions: number;
  time_ms: number;
  time_label: string;
}

export interface GlobalStats {
  total_time_ms: number;
  total_time_label: string;
  total_words: number;
  buckets: {
    exercise: GlobalStatsBucket;
    exam: GlobalStatsBucket;
    lesson_trainer: GlobalStatsBucket;
    vocab_trainer: GlobalStatsBucket;
  };
}

export interface LearnedWordsDay {
  date: string;
  count: number;
}

export interface TimeLearnedDay {
  date: string;
  ms: number;
  minutes: number;
}

export type RecommendStatus = "Not start" | "Finish and success" | "Finish and fail";

export interface RecommendedPractice {
  level: number;
  lesson: number;
  progress: string;
  skill: string | null;
  type: number;
  category: string;
  unit_ids: string[];
  total_words: number;
  known_words: number;
  coverage_pct: number;
  matched_words: string[];
  recent_matched_words: string[];
  newest_learned_at: string | null;
  recent_score: number;
  status: RecommendStatus;
  question_count: number;
}
