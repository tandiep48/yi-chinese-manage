"use client";

// components/page/learner/practice/PracticeSelectPage.tsx
// HSK 1–6 level grid — the entry screen for Exercise (category="practice") and
// Exam (category="exam"). Ports templates/practice/practice_select.html.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useT } from "@/components/i18n/I18nProvider";
import { LearningTabs } from "@/components/page/learner/picker/LearningTabs";
import { hskSelectFallbackImage, hskSelectImageUrl } from "@/lib/gcs";
import type { PracticeCategory } from "@/lib/types/practice";
import "@/components/page/learner/picker/learning-tabs.css";
import "./practice-select.css";

// The level picture: the bucket image first, the bundled copy if that fails, and
// the plain level number if neither loads.
function LevelCardImage({ category, level, alt }: { category: PracticeCategory; level: number; alt: string }) {
  const sources = [hskSelectImageUrl(category, level), hskSelectFallbackImage(category, level)];
  const [attempt, setAttempt] = useState(0);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // A server-rendered image can fail before React attaches onError; catch that
  // already-broken state once mounted (and again after each source swap).
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setAttempt((n) => n + 1);
  }, [attempt]);

  if (attempt >= sources.length) return <div className="card-icon">{level}</div>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      className="card-image"
      src={sources[attempt]}
      alt={alt}
      loading="lazy"
      onError={() => setAttempt((n) => n + 1)}
    />
  );
}

export function PracticeSelectPage({ category }: { category: PracticeCategory }) {
  const { t } = useT();
  const base = category === "exam" ? "/learner/exam" : "/learner/practice";
  const categoryLabel = category === "exam" ? t("dashboard.exam") : t("dashboard.exercise");

  return (
    <div className="practice-select">
      <div className="practice-select-container">
        <LearningTabs />
        <h1 className="page-title">{categoryLabel}</h1>
        <p className="page-subtitle">
          {t("practice_select.choose_hsk_subtitle", { category: categoryLabel.toLowerCase() })}
        </p>
        <div className="practice-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Link key={n} href={`${base}/${n}`} className="practice-card">
              <LevelCardImage category={category} level={n} alt={`${categoryLabel} ${n}`} />
              <div className="card-label">
                {categoryLabel} {n}
              </div>
              <div className="hsk-badge">HSK {n}</div>
              <div className="card-sub">{t("practice_select.listening_reading")}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
