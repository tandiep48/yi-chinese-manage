import type { DashboardCurrentLesson, GlobalStats, LearnedWordsDay, RecommendStatus, RecommendedPractice, TimeLearnedDay } from "@/lib/types/dashboard";
import { legacyApiFetch } from "../client";

export function getDashboardCurrentLesson(
  page = 1,
  pageSize = 5
): Promise<DashboardCurrentLesson> {
  return legacyApiFetch<DashboardCurrentLesson>(
    `/api/user/dashboard-current-lesson?page=${page}&page_size=${pageSize}`
  );
}

export function getGlobalStats(): Promise<GlobalStats> {
  return legacyApiFetch<GlobalStats>("/api/user/global-stats");
}

export function getLearnedWordsLast3Days(): Promise<LearnedWordsDay[]> {
  return legacyApiFetch<{ days: LearnedWordsDay[] }>(
    "/api/user/learned-words-last-3-days"
  ).then((r) => r.days);
}

export function getTimeLearnedLast3Days(): Promise<TimeLearnedDay[]> {
  return legacyApiFetch<{ days: TimeLearnedDay[] }>(
    "/api/user/time-learned-last-3-days"
  ).then((r) => r.days);
}

export function getRecommendedPractices(
  limit?: number,
  status?: RecommendStatus
): Promise<RecommendedPractice[]> {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (status) params.set("status", status);
  const qs = params.toString();
  return legacyApiFetch<{ recommendations: RecommendedPractice[] }>(
    `/api/practice/recommend${qs ? `?${qs}` : ""}`
  ).then((r) => r.recommendations);
}
