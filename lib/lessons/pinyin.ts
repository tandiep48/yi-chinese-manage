// lib/lessons/pinyin.ts
// Data + client helpers for the HSK 1 Lesson 1 pinyin guides (basic + advanced).
// Ported 1:1 from Learning/web_app/templates/lesson/{basic,advanced}_pinyin.html
// and static/lesson/pinyin.js. The advanced initial×final matrix is extracted
// into advanced_pinyin_data.json (401 syllables) so it renders from data.
import advancedData from "./advanced_pinyin_data.json";
import { pinyinAudioUrl } from "@/lib/audio";

// ── Basic guide: the fixed 8-column grid (Initials | Finals, plus Tones) ──────
// Each sub-array is one row of four cells; null = an intentionally empty cell.
export const BASIC_INITIAL_ROWS: (string | null)[][] = [
  ["b", "p", "m", "f"],
  ["d", "t", "n", "l"],
  ["g", "k", "h", null],
  ["j", "q", "x", null],
  ["zh", "ch", "sh", "r"],
  ["z", "c", "s", null],
];

// Toned single vowels shown under the "Tones" header (left half, rows 8-13).
export const BASIC_TONE_ROWS: (string | null)[][] = [
  ["ā", "á", "ǎ", "à"],
  ["ō", "ó", "ǒ", "ò"],
  ["ē", "é", "ě", "è"],
  ["ī", "í", "ǐ", "ì"],
  ["ū", "ú", "ǔ", "ù"],
  ["ǖ", "ǘ", "ǚ", "ǜ"],
];

// Finals fill the right half for every one of the 13 rows.
export const BASIC_FINAL_ROWS: (string | null)[][] = [
  ["i", "u", "ü", "er"],
  ["a", "ia", "ua", null],
  ["o", "uo", null, null],
  ["e", "ie", "üe", null],
  ["ai", "uai", null, null],
  ["ei", "uei(ui)", null, null],
  ["ao", "iao", null, null],
  ["ou", "iou(iu)", null, null],
  ["an", "ian", "uan", "üan"],
  ["en", "in", "uen(un)", "ün"],
  ["ang", "iang", "uang", null],
  ["eng", "ing", "ueng", null],
  ["ong", "iong", null, null],
];

// English pronunciation hints for the initials (mirrors pinyin.js). Finals/tones
// fall back to the generic pinyin.pronunciation_for message.
export const PRONUNCIATION_MAP: Record<string, string> = {
  b: "Like 'p' in 'spit'",
  p: "Like 'p' in 'pit'",
  m: "Like 'm' in 'man'",
  f: "Like 'f' in 'fan'",
  d: "Like 't' in 'stop'",
  t: "Like 't' in 'top'",
  n: "Like 'n' in 'not'",
  l: "Like 'l' in 'lot'",
  g: "Like 'k' in 'skill'",
  k: "Like 'k' in 'kill'",
  h: "Like 'h' in 'hat'",
  j: "Like 'j' in 'jeep'",
  q: "Like 'ch' in 'cheat'",
  x: "Like 'sh' in 'sheet'",
  zh: "Like 'j' in 'jump'",
  ch: "Like 'ch' in 'church'",
  sh: "Like 'sh' in 'shoe'",
  r: "Like 'r' in 'run' but with tongue curled back",
  z: "Like 'ds' in 'pads'",
  c: "Like 'ts' in 'cats'",
  s: "Like 's' in 'sun'",
};

// ── Advanced guide: initial×final matrix (from advanced_pinyin_data.json) ──────
export interface AdvancedRow {
  final: string;
  // 22 entries: [bare-final, then one per initial in INITIALS order]. null = gap.
  cells: (string | null)[];
}

export interface AdvancedPinyinData {
  initials: string[];
  tables: AdvancedRow[][];
}

export const ADVANCED_PINYIN: AdvancedPinyinData = advancedData as AdvancedPinyinData;

// ── Tone helpers (ported from pinyin.js addTone/getTones) ─────────────────────
const TONE_MARKS: Record<string, string[]> = {
  a: ["ā", "á", "ǎ", "à"],
  o: ["ō", "ó", "ǒ", "ò"],
  e: ["ē", "é", "ě", "è"],
  i: ["ī", "í", "ǐ", "ì"],
  u: ["ū", "ú", "ǔ", "ù"],
  ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
};

// Place the tone mark on the correct vowel, following the standard priority
// (a > o > e; the second vowel of iu/ui; then i/u/ü) — identical to pinyin.js.
export function addTone(syllable: string, toneIndex: number): string {
  let target = "";
  if (syllable.includes("a")) target = "a";
  else if (syllable.includes("o")) target = "o";
  else if (syllable.includes("e")) target = "e";
  else if (syllable.includes("iu")) target = "u";
  else if (syllable.includes("ui")) target = "i";
  else if (syllable.includes("i")) target = "i";
  else if (syllable.includes("u")) target = "u";
  else if (syllable.includes("ü")) target = "ü";

  if (target) {
    return syllable.replace(target, TONE_MARKS[target][toneIndex]);
  }
  return syllable;
}

// The four toned forms (1st → 4th tone) of a base syllable.
export function getTones(syllable: string): string[] {
  return [0, 1, 2, 3].map((i) => addTone(syllable, i));
}

// ── Audio playback (client only) ──────────────────────────────────────────────
let currentAudio: HTMLAudioElement | null = null;

// Speak a syllable with the browser's Chinese voice. Used as the fallback for
// missing clips, and directly for the advanced chart (see playTone).
function speakSyllable(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

// Basic chart: initials, finals and single toned vowels DO have recordings in
// the bucket, so play the clip and fall back to speech only if it's missing.
export function playPinyin(syllable: string): void {
  if (typeof window === "undefined") return;
  currentAudio?.pause();
  const audio = new Audio(pinyinAudioUrl(syllable));
  currentAudio = audio;
  audio.play().catch(() => {
    const ttsText = syllable
      .replace(/[āáǎà]/g, "a")
      .replace(/[ōóǒò]/g, "o")
      .replace(/[ēéěè]/g, "e")
      .replace(/[īíǐì]/g, "i")
      .replace(/[ūúǔù]/g, "u")
      .replace(/[ǖǘǚǜü]/g, "v");
    speakSyllable(ttsText);
  });
}

// Advanced chart: the bucket has NO recordings for full initial+final syllables
// (audio_pinyin only holds bare initials/finals), so requesting e.g. "tā.mp3"
// always 404s. Speak the toned syllable directly instead of firing that dead
// request — same audible result the legacy got from its TTS fallback.
export function playTone(tonedSyllable: string): void {
  currentAudio?.pause();
  speakSyllable(tonedSyllable);
}
