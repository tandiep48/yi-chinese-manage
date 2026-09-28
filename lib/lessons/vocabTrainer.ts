// lib/lessons/vocabTrainer.ts
// Pure activity-building engine for the batch vocab trainer. Ported verbatim from
// Learning/web_app/static/vocab/vocab_trainer_core.js (the grouping + interleaving
// logic), split out from the React components so it can be unit-tested. The trainer
// works words in small groups; each group runs typing -> listening match -> reading
// match, and each activity type gets its own independent random grouping so the
// words paired together differ between skills.

import type { VocabRow } from "@/lib/types/vocab";

// The trainer's word rows are exactly the normalized rows returned by
// /api/vocab/words (normalize_vocab_row), which match VocabRow.
export type TrainerWord = VocabRow;

// The engine's three skills. `listen`/`reading` are match boards; `typing` is
// type-the-word. These ids are also what /api/vocab/submit-batch records as the
// answer `type` (listen -> "listen", reading -> "meaning", typing -> "typing").
export type VocabActivityType = "typing" | "listen" | "reading";

export const VOCAB_ACTIVITY_TYPES: VocabActivityType[] = ["typing", "listen", "reading"];

export const GROUP_SIZE = 5; // words per group

// Match config per activity. `db` is the vocab_records mode recorded on solve; the
// left column is the scored anchor (one record per word), the right is paired to it.
export const MATCH_CONFIG: Record<
  "listen" | "reading",
  { db: string; instruction: string; leftKind: "audio" | "word"; rightKind: "meaning" }
> = {
  listen: { db: "listen", instruction: "instruction_match_listen", leftKind: "audio", rightKind: "meaning" },
  reading: { db: "meaning", instruction: "instruction_match_reading", leftKind: "word", rightKind: "meaning" },
};

// Keyboard shortcut keys for the left (anchor) column of a match board.
export const LEFT_KEYS = ["1", "2", "3", "4", "5"];

export interface Activity {
  groupIndex: number;
  type: VocabActivityType;
  words: TrainerWord[];
}

// Fisher-Yates, returns a new array (does not mutate the input).
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = input.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Group sizes for `n` words: fixed groups of GROUP_SIZE, but a lone trailing word is
// avoided by borrowing one from the previous group ([...,5,1] -> [...,4,2]) instead
// of growing a group past GROUP_SIZE — a 6-word group would break the 1-5 keyboard
// shortcuts and leave a match card without a number badge.
export function groupSizes(n: number): number[] {
  const sizes: number[] = [];
  for (let i = 0; i < n; i += GROUP_SIZE) sizes.push(Math.min(GROUP_SIZE, n - i));
  if (sizes.length > 1 && sizes[sizes.length - 1] === 1) {
    sizes[sizes.length - 1] = 2;
    sizes[sizes.length - 2] -= 1;
  }
  return sizes;
}

export function buildGroups(rows: readonly TrainerWord[]): TrainerWord[][] {
  const sizes = groupSizes(rows.length);
  const groups: TrainerWord[][] = [];
  let i = 0;
  for (const size of sizes) {
    groups.push(rows.slice(i, i + size));
    i += size;
  }
  return groups;
}

// Split `n` items into `k` groups as evenly as possible (sizes differ by at most one).
function balancedSizes(n: number, k: number): number[] {
  const base = Math.floor(n / k);
  let rem = n % k;
  return Array.from({ length: k }, () => base + (rem-- > 0 ? 1 : 0));
}

// Homophones (same pinyin, e.g. 他 / 她 both "tā") sound identical, so a listening
// match group holding two of them has no distinguishable answer. Group so no group
// repeats a key: a key appearing m times needs at least m groups to separate, so the
// group count grows to max(ceil(n/5), maxFrequency); the most-constrained words are
// placed first, each into the emptiest group with room and no clash.
export function buildGroupsAvoidingKey(
  rows: readonly TrainerWord[],
  keyFn: (row: TrainerWord) => string
): TrainerWord[][] {
  const shuffled = shuffle(rows);
  const n = shuffled.length;
  if (!n) return [];

  const freq: Record<string, number> = {};
  shuffled.forEach((r) => {
    const k = keyFn(r);
    freq[k] = (freq[k] || 0) + 1;
  });
  const maxFreq = Math.max(...Object.values(freq));
  const groupCount = Math.max(Math.ceil(n / GROUP_SIZE), maxFreq, 1);
  const sizes = balancedSizes(n, groupCount);
  const ordered = shuffled.slice().sort((a, b) => freq[keyFn(b)] - freq[keyFn(a)]);

  const groups: TrainerWord[][] = sizes.map(() => []);
  const emptiestWithRoom = (allow: (g: TrainerWord[]) => boolean): number => {
    let best = -1;
    groups.forEach((g, idx) => {
      if (g.length >= sizes[idx] || !allow(g)) return;
      if (best === -1 || g.length < groups[best].length) best = idx;
    });
    return best;
  };
  ordered.forEach((row) => {
    const key = keyFn(row);
    let slot = emptiestWithRoom((g) => !g.some((r) => keyFn(r) === key));
    if (slot === -1) slot = emptiestWithRoom(() => true);
    groups[slot].push(row);
  });
  return groups;
}

// Pinyin identity for the homophone check: case/space-insensitive, tone marks kept
// (a true homophone matches tone too). Blank pinyin falls back to the word so
// distinct words are never treated as clashing.
export function pinyinKey(row: TrainerWord): string {
  const p = String(row.pinyin || "").toLowerCase().replace(/\s+/g, "");
  return p || `__${row.word}`;
}

// Build the flat activity list. Each activity type gets its own independent random
// grouping of the words, and the types are interleaved round by round, so the words
// paired together differ between typing, listening, and reading. Every word still
// appears once per type, so all words complete all three (or the selected) skills.
export function buildActivities(
  rows: readonly TrainerWord[],
  types: readonly VocabActivityType[] = VOCAB_ACTIVITY_TYPES
): Activity[] {
  const requested = types.filter((t) => VOCAB_ACTIVITY_TYPES.includes(t));
  const active = requested.length ? requested : VOCAB_ACTIVITY_TYPES;

  const groupsByType = active.map((type) => ({
    type,
    // Listening pairs audio -> meaning, so its groups must avoid same-pinyin
    // homophones; the other types read the character and can group freely.
    groups:
      type === "listen"
        ? buildGroupsAvoidingKey(rows, pinyinKey)
        : buildGroups(shuffle(rows)),
  }));
  const roundCount = Math.max(0, ...groupsByType.map((g) => g.groups.length));

  const list: Activity[] = [];
  for (let round = 0; round < roundCount; round++) {
    groupsByType.forEach(({ type, groups }) => {
      const groupWords = groups[round];
      if (groupWords) list.push({ groupIndex: round, type, words: groupWords });
    });
  }
  return list;
}
