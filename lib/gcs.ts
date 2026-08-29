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
