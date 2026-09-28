// lib/audio.ts
// Resolves audio_key fields to playable URLs. These mirror
// Learning/web_app/service/gcs_service.py's vocab_audio_url / lesson_audio_url,
// resolved straight to the public GCS bucket (the Flask /audio and /lesson_audio
// routes are just redirects to these same objects), exactly like pinyinAudioUrl.
import { GCS_BUCKET_URL } from "./gcs";

// Vocabulary word audio, e.g. "xiuxi_1" -> .../vocab_audio/xiuxi_1.mp3.
export function vocabAudioUrl(audioKey: string): string {
  return `${GCS_BUCKET_URL}/vocab_audio/${encodeURIComponent(audioKey)}.mp3`;
}

// Passage line audio, e.g. HSK2 key "l2_1" -> .../lesson_audio/HSK2/l2_1.mp3.
// `folder` is the HSK level (e.g. "HSK2") or, for book lessons, the book code —
// mirrors getLessonAudioSrc() in Learning/web_app/static/reading/reading.js.
export function lessonAudioUrl(folder: string, audioKey: string): string {
  return `${GCS_BUCKET_URL}/lesson_audio/${encodeURIComponent(folder)}/${encodeURIComponent(audioKey)}.mp3`;
}

// The lesson-audio folder for a passage: the book code (book lessons) or the
// normalised HSK level (e.g. "H2"/"2" -> "HSK2").
export function lessonAudioFolder(passage: { hsk_level?: string | null; book_code?: string | null }): string {
  if (passage.book_code) return passage.book_code;
  const raw = String(passage.hsk_level || "HSK1");
  return /^hsk/i.test(raw) ? raw.toUpperCase() : `HSK${raw.replace(/^h/i, "")}`;
}

// Pinyin syllable audio (basic/advanced pinyin guides). Served directly from the
// public GCS bucket, exactly like the legacy pinyin.js — NOT proxied through Flask.
export function pinyinAudioUrl(syllable: string): string {
  return `${GCS_BUCKET_URL}/audio_pinyin/${encodeURIComponent(syllable)}.mp3`;
}
