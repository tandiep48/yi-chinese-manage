// lib/gcs.ts
// Public GCS asset URLs, mirroring Learning/web_app/service/gcs_service.py.
// The learner picker uses the HSK cover images and per-lesson images from the
// same bucket the Jinja app used, so the Next view matches the legacy look.

export const GCS_BUCKET_URL =
  process.env.NEXT_PUBLIC_GCS_BUCKET_URL ??
  "https://storage.googleapis.com/chinese-learning-audio-assets";

// HSK level cover image, e.g. level 1 -> .../hsk_images/hsk1.png (gcs_service.hsk_image_url).
export function hskImageUrl(level: number | string): string {
  const n = String(level).replace(/[^0-9]/g, "");
  return `${GCS_BUCKET_URL}/hsk_images/hsk${n}.png`;
}

// Per-lesson image, e.g. HSK1 lesson 2 -> .../lesson_images/H1/H1-lesson 2.png
// (gcs_service.lesson_image_url: uppercase H-level folder, space before number).
export function lessonImageUrl(hskKey: string, lessonNum: string | number): string {
  const h = hskKey.toUpperCase().replace("HSK", "H"); // "HSK1" -> "H1"
  return `${GCS_BUCKET_URL}/lesson_images/${h}/${h}-lesson ${lessonNum}.png`;
}

// Book cover, e.g. "AML" -> .../lesson_cover/AML.png (gcs_service.lesson_cover_url:
// uppercased book code). The book grid provides a cover_url per book already, so
// use this only where a book_code is all that's available (the book-detail header).
export function bookCoverUrl(bookCode: string): string {
  return `${GCS_BUCKET_URL}/lesson_cover/${bookCode.toUpperCase()}.png`;
}

// Practice/exam question audio, mirroring practice_engine.js audioSrc():
// .../question_bank/<category>/<category>-<level>/<key>.mp3
export function practiceAudioUrl(
  key: string,
  level: number | string,
  category: "practice" | "exam" = "practice"
): string {
  const lvl = level || 1;
  return `${GCS_BUCKET_URL}/question_bank/${category}/${category}-${lvl}/${key}.mp3`;
}

// HSK achievement badge, e.g. level 3 -> .../badge/HSK3.png (gcs_service badge_url).
// Returns "" for a level outside 1..6, matching the legacy helper.
export function badgeUrl(level: number | string | null | undefined): string {
  const n = String(level ?? "").replace(/[^0-9]/g, "");
  if (!["1", "2", "3", "4", "5", "6"].includes(n)) return "";
  return `${GCS_BUCKET_URL}/badge/HSK${n}.png`;
}

// Practice/exam question image, mirroring practice_engine.js imageUrl():
// .../images/<category>/<level>/<file> (a bare name gets a .jpg extension).
export function practiceImageUrl(
  level: number | string,
  filename: string,
  category: "practice" | "exam" = "practice"
): string {
  let file = filename.trim();
  if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(file)) file += ".jpg";
  return `${GCS_BUCKET_URL}/images/${category}/${level}/${file}`;
}
