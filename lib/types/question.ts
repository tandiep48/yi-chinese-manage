// lib/types/question.ts
// Question bank: the admin CRUD row and its option lists. Distinct from
// PracticeQuestion in ./practice, which is what the learner is served.
// Mirrors the JSON shapes served by the Flask app in ../../../Learning.

import { TYPE_CONSTANTS } from "./constants";

export interface Question {
  id: number;
  level: number;
  category: string;
  lesson: number;
  no: number;
  skill: string | null;
  type: number;
  content: string | null;
  question: string | null;
  answer: string | null;
  audio_key: string | null;
  image: string | null;
  options: Record<string, unknown> | null;
  progress: string;
  unit_id: string;
}

export type QuestionFormData = {
  category: string;
  level: number;
  lesson: number;
  no: number;
  type: number;
  progress: string;
  skill?: string | null;
  content?: string | null;
  question?: string | null;
  answer?: string | null;
  audio_key?: string | null;
  image?: string | null;
  options?: Record<string, unknown> | null;
  unit_id?: string;
};

export const QUESTION_CATEGORIES = TYPE_CONSTANTS.QUESTION_CATEGORIES;

export const QUESTION_SKILLS = TYPE_CONSTANTS.QUESTION_SKILLS;
