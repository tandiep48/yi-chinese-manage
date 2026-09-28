// lib/practice/groupState.ts
// The per-group answer state of a practice/exam session, and the pure
// transitions over it. These are the React analog of the groupSaved[] entries
// the legacy practice_engine.js kept in module globals.
//
// Everything here is a plain value -> value function: usePracticeEngine holds
// the state and decides when to apply these, but never what they mean. Each
// transition is a no-op once the group has been checked, matching the engine,
// which disabled its inputs at that point.

import { scoreGroup } from "./practiceEngine";
import type { PracticeGroup } from "@/lib/types/practice";

export interface GroupUIState {
  userAnswers: Record<string, string>; // blockId -> selected key(s)
  chipOrder: Record<string, string[]>; // type 4: blockId -> ordered keys
  chipShuffle: Record<string, string[]>; // type 4: fixed shuffled pool order
  blankState: Record<string, Record<number, string>>; // type 6: blockId -> {blankIdx: key}
  activeBlank: { blockId: string; index: number } | null; // one active blank per group
  checked: boolean;
  correctCount: number;
  correctTotal: number;
  startTime: number;
  perQuestionTimeMs: number;
}

export function freshGroupState(group: PracticeGroup): GroupUIState {
  const chipShuffle: Record<string, string[]> = {};
  group.questions.forEach((q, idx) => {
    if (q.type === 4) {
      // Shuffle once at load (never during render — keeps render pure).
      chipShuffle[`q-${idx}`] = Object.keys(q.options || {}).sort(() => Math.random() - 0.5);
    }
  });
  return {
    userAnswers: {},
    chipOrder: {},
    chipShuffle,
    blankState: {},
    activeBlank: null,
    checked: false,
    correctCount: 0,
    correctTotal: 0,
    startTime: 0,
    perQuestionTimeMs: 0,
  };
}

// Plain multiple choice: one answer per block, replacing whatever was there.
export function applyMCSelection(s: GroupUIState, blockId: string, key: string): GroupUIState {
  if (s.checked) return s;
  return { ...s, userAnswers: { ...s.userAnswers, [blockId]: key } };
}

// Unique-key-per-row selection (t5 grouped layouts). Picking the same key again
// clears the row, which is how a key gets freed for another row.
export function applyKeySelection(s: GroupUIState, blockId: string, key: string): GroupUIState {
  if (s.checked) return s;
  const ua = { ...s.userAnswers };
  if (ua[blockId] === key) delete ua[blockId];
  else ua[blockId] = key;
  return { ...s, userAnswers: ua };
}

// Type 4 chips move between the pool and the answer row; the answer is the
// chip keys in the order they were added.
export function applyChipToggle(s: GroupUIState, blockId: string, key: string): GroupUIState {
  if (s.checked) return s;
  const order = s.chipOrder[blockId] ? [...s.chipOrder[blockId]] : [];
  const at = order.indexOf(key);
  if (at >= 0) order.splice(at, 1);
  else order.push(key);
  return {
    ...s,
    chipOrder: { ...s.chipOrder, [blockId]: order },
    userAnswers: { ...s.userAnswers, [blockId]: order.join("") },
  };
}

// Type 6: target a blank. Only one blank in the group is active at a time.
export function applyBlankFocus(s: GroupUIState, blockId: string, index: number): GroupUIState {
  if (s.checked) return s;
  return { ...s, activeBlank: { blockId, index } };
}

// Type 6: drop the shared option `key` into whichever blank is active, and
// rebuild that block's answer from its blanks in index order.
export function applyT6Assignment(s: GroupUIState, key: string): GroupUIState {
  if (s.checked || !s.activeBlank) return s;
  const { blockId, index } = s.activeBlank;
  const blockBlanks = { ...(s.blankState[blockId] || {}) };
  blockBlanks[index] = key;
  const blankState = { ...s.blankState, [blockId]: blockBlanks };
  const joined = Object.keys(blockBlanks)
    .map(Number)
    .sort((a, b) => a - b)
    .map((i) => blockBlanks[i] || "")
    .join("");
  return {
    ...s,
    blankState,
    userAnswers: { ...s.userAnswers, [blockId]: joined },
    activeBlank: null,
  };
}

// Grade the group and freeze it. `elapsedMs` is passed in rather than read from
// the clock here so this stays pure; the caller measures against startTime.
// Returns the checked state and the score to add, or null if already checked.
export function applyCheck(
  s: GroupUIState,
  group: PracticeGroup,
  elapsedMs: number
): { state: GroupUIState; correct: number } | null {
  if (s.checked) return null;
  const { correct } = scoreGroup(group, s.userAnswers);
  const perQ = Math.round(elapsedMs / Math.max(1, group.questions.length));
  return {
    state: {
      ...s,
      checked: true,
      correctCount: correct,
      correctTotal: group.questions.length,
      perQuestionTimeMs: perQ,
    },
    correct,
  };
}
