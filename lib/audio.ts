// lib/audio.ts
// Resolves audio_key fields to playable URLs. Both routes are plain Flask
// redirects to GCS (see Learning/web_app/app.py's /audio and /lesson_audio),
// served from the same Flask host as the rest of the API.
import { API_CONSTANTS } from "./api/constants";

const BASE = API_CONSTANTS.BASE_URL;

// Vocabulary word audio (vocab trainer, vocab overview).
export function vocabAudioUrl(audioKey: string): string {
  return `${BASE}/audio/${encodeURIComponent(audioKey)}`;
}

// Passage line audio (lesson overview / reading).
export function lessonAudioUrl(audioKey: string): string {
  return `${BASE}/lesson_audio/${encodeURIComponent(audioKey)}`;
}
