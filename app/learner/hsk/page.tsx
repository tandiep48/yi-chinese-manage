"use client";

// app/learner/hsk/page.tsx
// Step 1 of the lesson flow — pick an HSK level.

import Link from "next/link";
import { HSK_LEVELS } from "@/lib/lessons/lessons";
import { hskImageUrl } from "@/lib/gcs";
import { useT } from "@/components/i18n/I18nProvider";
import { LearningTabs } from "@/components/page/learner/LearningTabs";
import { RecentLessonPanel } from "@/components/page/learner/RecentLessonPanel";
import "@/components/page/learner/lesson-picker.css";

export default function HskLevelPickerPage() {
  const { t } = useT();

  return (
    <div className="lesson-picker">
      <div className="picker-wrap">
        <LearningTabs />
        <RecentLessonPanel />
        <h1 className="picker-title">{t("picker.select_hsk_level")}</h1>
        <p className="picker-subtitle">{t("picker.choose_level_subtitle")}</p>

        <div className="level-picker-grid">
          {HSK_LEVELS.map((lvl) => (
            <Link
              key={lvl.key}
              href={`/learner/hsk/${lvl.key}`}
              className="level-picker-card"
              style={{ backgroundColor: lvl.color }}
            >
              <div className="level-icon">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hskImageUrl(lvl.level)}
                  alt={lvl.label}
                  // Fall back to the text label if the cover image is unavailable.
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement?.parentElement
                      ?.querySelector<HTMLElement>(".level-name")
                      ?.style.setProperty("display", "block");
                  }}
                />
              </div>
              <div className="level-name" style={{ display: "none" }}>
                {lvl.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
