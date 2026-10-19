"use client";

// components/page/learner/practice/PracticeSelectPage.tsx
// HSK 1–6 level grid — the entry screen for Exercise (category="practice") and
// Exam (category="exam"). Ports templates/practice/practice_select.html.

import Link from "next/link";
import { useT } from "@/components/i18n/I18nProvider";
import { LearningTabs } from "@/components/page/learner/picker/LearningTabs";
import type { PracticeCategory } from "@/lib/types/practice";
import "@/components/page/learner/picker/learning-tabs.css";
import "./practice-select.css";

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
              <div className="card-icon">{n}</div>
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
