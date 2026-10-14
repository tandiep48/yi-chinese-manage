"use client";

// components/page/learner/RecentLessonPanel.tsx
// "Continue where you left off" banner on the learning page. Ported from the
// #learning-recent-panel markup + showRecentPanel()/continueRecentLesson()/
// formatPassageContext() in Learning/web_app's learning.html / learning.js.
// Renders nothing until a recent lesson is known (matches the legacy panel,
// which starts hidden and reveals only when one loads).

import Link from "next/link";
import { useT } from "@/components/i18n/I18nProvider";
import type { TVars } from "@/lib/i18n";
import { useRecentLearning } from "@/hooks/profile/useRecentLearning";
import { lessonHrefForPassage } from "@/lib/lessons/passageNav";
import "./recent-lesson-panel.css";

// "H1" -> "HSK1"; anything already like "HSK1" (or non-HSK) passes through.
function normalizeHskLevel(value: string): string {
  const m = value.match(/^H(\d)$/i);
  return m ? `HSK${m[1]}` : value;
}

function formatPassageContext(passageId: string, t: (k: string, v?: TVars) => string): string {
  // Special-cased HSK1 Lesson 5 "numbers" part, mirroring the legacy page.
  if (passageId === "H1_5_99") {
    return `HSK1 - ${t("picker.lesson_prefix")} 5 - ${t("picker.number_part")}`;
  }
  const parts = String(passageId ?? "").split("_");
  const hsk = normalizeHskLevel(parts[0] ?? "") || parts[0] || "HSK";
  const lesson = parts.length >= 2 ? `${t("picker.lesson_prefix")} ${parts[1]}` : t("picker.lesson_prefix");
  const part = parts.length >= 3 ? `${t("picker.part_prefix")} ${parts[2]}` : passageId;
  return `${hsk} - ${lesson} - ${part}`;
}

export function RecentLessonPanel() {
  const { t } = useT();
  const { loading, passageId } = useRecentLearning();

  if (loading || !passageId) return null;

  return (
    <section className="learning-recent-panel">
      <div>
        <h2>{t("learning.recent_lesson")}</h2>
        <p className="subtitle">{formatPassageContext(passageId, t)}</p>
      </div>
      <Link className="btn btn-primary learning-continue-btn" href={lessonHrefForPassage(passageId)}>
        {t("lesson.continue")}
      </Link>
    </section>
  );
}
