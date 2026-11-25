"use client";

// components/page/learner/practice/PracticeSelectPage.tsx
// HSK 1–6 level grid — the entry screen for Exercise (category="practice") and
// Exam (category="exam"). Ports templates/practice/practice_select.html.

import { useState } from "react";
import Link from "next/link";
import { useT } from "@/components/i18n/I18nProvider";
import { LearningTabs } from "@/components/page/learner/picker/LearningTabs";
import { GcsImage } from "@/components/shared/customer_ui/GcsImage/GcsImage";
import { hskSelectImageUrl } from "@/lib/gcs";
import type { PracticeCategory } from "@/lib/types/practice";
import "@/components/page/learner/picker/learning-tabs.css";
import "./practice-select.css";

// The level picture: the bucket image, its local mirror if that fails, and the
// plain level number if neither loads.
function LevelCardImage({ category, level, alt }: { category: PracticeCategory; level: number; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <div className="card-icon">{level}</div>;
  return (
    <GcsImage
      className="card-image"
      src={hskSelectImageUrl(category, level)}
      alt={alt}
      onFallbackFailed={() => setBroken(true)}
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
            <Link
              key={n}
              href={`${base}/${n}`}
              className="practice-card"
              data-category={category}
              data-level={n}
            >
              <LevelCardImage category={category} level={n} alt={`${categoryLabel} ${n}`} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
