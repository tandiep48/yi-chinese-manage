// lib/types/grammar.ts
// Grammar: the admin CRUD rules and contexts. The lesson-wide grammar shown
// to learners is LessonGrammarRule in ./lesson — a different endpoint.
// Mirrors the JSON shapes served by the Flask app in ../../../Learning.

import { TYPE_CONSTANTS } from "./constants";

export interface GrammarRule {
  id: number;
  grammar_id: string;
  type: number | null;
  passage_number: number | null;
  vietnamese_content: string | null;
  english_content: string | null;
}

export interface GrammarContext {
  id: number;
  grammar_id: string;
  content_json: Record<string, unknown> | unknown[] | null;
}

export type GrammarRuleFormData = {
  grammar_id: string;
  type?: number | null;
  passage_number?: number | null;
  vietnamese_content?: string | null;
  english_content?: string | null;
};

export type GrammarContextFormData = {
  grammar_id: string;
  content_json?: Record<string, unknown> | unknown[] | null;
};

export const GRAMMAR_TYPES = TYPE_CONSTANTS.GRAMMAR_TYPES;

export type GrammarType = (typeof GRAMMAR_TYPES)[number];
