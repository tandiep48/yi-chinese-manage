"use client";

// components/page/learner/vocab/VocabFilterBar.tsx
// Filter row of the vocab selection page: HSK level, lesson + part multi-selects
// (standard mode only), and page size. Ports the .vocab-filter-bar markup and
// the show/hide rules for the HSK / standard-only filters from
// Learning/web_app/templates/vocab/vocab.html + vocab_select.js.

import { useT } from "@/components/i18n/I18nProvider";
import { MultiSelect } from "@/components/shared/customer_ui/MultiSelect/MultiSelect";
import type { MultiSelectOption } from "@/hooks/useVocabSelect";
import type { VocabMode } from "@/lib/types/types";

const HSK_LEVELS = ["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"] as const;
const PAGE_SIZES = [10, 20, 50, 100, 200, 500, 1000] as const;

interface VocabFilterBarProps {
  mode: VocabMode;
  isHistoryMode: boolean;
  hskLevel: string;
  onHskChange: (level: string) => void;
  lessonOptions: MultiSelectOption[];
  selectedLessons: string[];
  onLessonsChange: (values: string[]) => void;
  partOptions: MultiSelectOption[];
  selectedParts: string[];
  onPartsChange: (values: string[]) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

export function VocabFilterBar({
  mode,
  isHistoryMode,
  hskLevel,
  onHskChange,
  lessonOptions,
  selectedLessons,
  onLessonsChange,
  partOptions,
  selectedParts,
  onPartsChange,
  pageSize,
  onPageSizeChange,
}: VocabFilterBarProps) {
  const { t } = useT();
  const isStandard = mode === "standard";

  return (
    <div className="vocab-filter-bar">
      {!isHistoryMode && (
        <div className="form-group">
          <label htmlFor="filter-hsk">{t("vocab.hsk_label")}</label>
          <select
            id="filter-hsk"
            value={hskLevel}
            onChange={(e) => onHskChange(e.target.value)}
          >
            <option value="">{t("vocab.select_hsk")}</option>
            {HSK_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>{`HSK ${lvl.slice(3)}`}</option>
            ))}
          </select>
        </div>
      )}

      {isStandard && (
        <>
          <div className="form-group">
            <label>{t("picker.lesson_prefix")}</label>
            <MultiSelect
              options={lessonOptions}
              values={selectedLessons}
              onChange={onLessonsChange}
              placeholder={t("vocab.select_lesson_option")}
              selectAllLabel={t("vocab.select_all")}
              renderCount={(n) => t("vocab.n_selected", { n })}
            />
          </div>
          <div className="form-group">
            <label>{t("picker.part_prefix")}</label>
            <MultiSelect
              options={partOptions}
              values={selectedParts}
              onChange={onPartsChange}
              placeholder={t("vocab.select_part_option")}
              selectAllLabel={t("vocab.select_all")}
              renderCount={(n) => t("vocab.n_selected", { n })}
            />
          </div>
        </>
      )}

      <div className="form-group">
        <label htmlFor="filter-page-size">{t("vocab.rows_label")}</label>
        <select
          id="filter-page-size"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
