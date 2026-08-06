"use client";

// app/(learner)/hsk/page.tsx
// Step 1 of the lesson flow — pick an HSK level.

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import { HSK_LEVELS } from "@/lib/lessons/lessons";
import { useT } from "@/components/i18n/I18nProvider";

export default function HskLevelPickerPage() {
  const { t } = useT();

  return (
    <div className="lesson-picker">
      <div className="picker-wrap">
        <h1 className="picker-title">{t("picker.select_hsk_level")}</h1>
        <p className="picker-subtitle">{t("picker.choose_level_subtitle")}</p>

        <div className="level-picker-grid">
          {HSK_LEVELS.map((lvl) => (
            <Link
              key={lvl.key}
              href={`/hsk/${lvl.key}`}
              className="level-picker-card"
              style={{ backgroundColor: lvl.color }}
            >
              <div className="level-icon">
                <FontAwesomeIcon icon={faGraduationCap} />
              </div>
              <div className="level-name">{lvl.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
