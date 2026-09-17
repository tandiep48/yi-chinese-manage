// lib/types/common.ts
// Generic API envelope shapes and the HSK level list shared everywhere.
// Mirrors the JSON shapes served by the Flask app in ../../../Learning.

import { TYPE_CONSTANTS } from "./constants";

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ApiError {
  error: string;
}

export const HSK_LEVELS = TYPE_CONSTANTS.HSK_LEVELS;

export type HskLevel = (typeof HSK_LEVELS)[number];
