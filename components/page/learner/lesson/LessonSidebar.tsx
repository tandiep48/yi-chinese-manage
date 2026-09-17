"use client";

// components/page/learner/lesson/LessonSidebar.tsx
// Lesson-study navigation sidebar — ported from Learning/web_app/templates/
// shared/sidebar.html + static/shared/sidebar.{css,js}. Three accordion sections
// (Lesson Parts, Grammar, Translation): Parts lists the lesson's parts with mini
// progress stats and opens each part's study view; Grammar and Translation open
// the matching lesson-wide study page (navigateToDomain in the original). The
// section for the current `domain` is expanded and highlighted. Collapses to a
// floating toggle, matching the Jinja behaviour.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowLeft,
  faXmark,
  faBars,
  faBookOpen,
  faFont,
  faLanguage,
  faCaretUp,
  faCaretDown,
  faLightbulb,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";
import { useLessonParts, type SidebarPart } from "@/hooks/useLessonParts";
import { partPickerHref } from "@/lib/lessons/lessons";
import { useT } from "@/components/i18n/I18nProvider";
import "./lesson-sidebar.css";

export type StudyDomain = "lesson" | "grammar" | "translation";
type Section = "parts" | "grammar" | "translation";

const DOMAIN_SECTION: Record<StudyDomain, Section> = {
  lesson: "parts",
  grammar: "grammar",
  translation: "translation",
};

export function LessonSidebar({
  passageId,
  domain = "lesson",
  open,
  onOpenChange,
}: {
  passageId: string;
  domain?: StudyDomain;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useT();
  const router = useRouter();
  const { loading, error, parts, header } = useLessonParts(passageId);
  const [openSection, setOpenSection] = useState<Section>(DOMAIN_SECTION[domain]);

  const goBackToPartPicker = () => router.push(partPickerHref(passageId));

  const navigateToPart = (id: string) => {
    if (id === passageId) return;
    router.push(`/learner/lesson?passage_id=${encodeURIComponent(id)}`);
  };

  const navigateToDomain = (target: StudyDomain) => {
    if (target === domain) return;
    const route = target === "grammar" ? "/learner/grammar" : "/learner/translation";
    router.push(`${route}?passage_id=${encodeURIComponent(passageId)}`);
  };

  const title = header?.lessonNum
    ? `${t("picker.lesson_prefix")} ${header.lessonNum}`
    : t("sidebar.navigation");

  return (
    <>
      <aside className={`lesson-sidebar${open ? "" : " collapsed"}`}>
        <div className="lesson-sidebar-header">
          <button
            type="button"
            className="lesson-sidebar-back"
            onClick={goBackToPartPicker}
            aria-label={t("sidebar.part_selection")}
            title={t("sidebar.part_selection")}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <span className="lesson-sidebar-badge">{header?.badge ?? "HSK"}</span>
          <h2>{title}</h2>
          <button
            type="button"
            className="lesson-sidebar-close"
            onClick={() => onOpenChange(false)}
            aria-label={t("sidebar.close_sidebar_aria")}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="lesson-sidebar-accordion">
          {/* Lesson Parts */}
          <AccordionItem
            icon={faBookOpen}
            label={t("sidebar.lesson_parts")}
            expanded={openSection === "parts"}
            onToggle={() => setOpenSection("parts")}
          >
            <nav className="sidebar-nav">
              {loading ? (
                <div className="sidebar-loader">{t("widgets.loading")}</div>
              ) : error ? (
                <div className="sidebar-loader">{t("sidebar.failed_load_parts")}</div>
              ) : parts.length === 0 ? (
                <div className="sidebar-loader">{t("sidebar.no_parts_found")}</div>
              ) : (
                parts.map((p) => (
                  <PartStep
                    key={p.passageId}
                    part={p}
                    active={domain === "lesson" && p.passageId === passageId}
                    onSelect={navigateToPart}
                  />
                ))
              )}
            </nav>
          </AccordionItem>

          {/* Grammar */}
          <AccordionItem
            icon={faFont}
            label={t("grammar.page_title")}
            expanded={openSection === "grammar"}
            onToggle={() => setOpenSection("grammar")}
          >
            <nav className="sidebar-nav">
              <DomainStep
                icon={faLightbulb}
                label={t("grammar.page_title")}
                active={domain === "grammar"}
                onSelect={() => navigateToDomain("grammar")}
              />
            </nav>
          </AccordionItem>

          {/* Translation */}
          <AccordionItem
            icon={faLanguage}
            label={t("translation.page_title")}
            expanded={openSection === "translation"}
            onToggle={() => setOpenSection("translation")}
          >
            <nav className="sidebar-nav">
              <DomainStep
                icon={faPenToSquare}
                label={t("translation.page_title")}
                active={domain === "translation"}
                onSelect={() => navigateToDomain("translation")}
              />
            </nav>
          </AccordionItem>
        </div>
      </aside>

      {!open && (
        <button
          type="button"
          className="lesson-sidebar-toggle"
          onClick={() => onOpenChange(true)}
          aria-label={t("sidebar.open_sidebar_aria")}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
      )}
    </>
  );
}

function AccordionItem({
  icon,
  label,
  expanded,
  onToggle,
  children,
}: {
  icon: IconDefinition;
  label: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`acc-item${expanded ? " active" : ""}`}>
      <button type="button" className="acc-header" onClick={onToggle} aria-expanded={expanded}>
        <span className="acc-icon">
          <FontAwesomeIcon icon={icon} />
        </span>
        <span className="acc-title">{label}</span>
        <FontAwesomeIcon icon={expanded ? faCaretUp : faCaretDown} className="acc-arrow" />
      </button>
      {expanded && <div className="acc-body">{children}</div>}
    </div>
  );
}

function DomainStep({
  icon,
  label,
  active,
  onSelect,
}: {
  icon: IconDefinition;
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button" className={`sidebar-step${active ? " active" : ""}`} onClick={onSelect}>
      <span className="step-icon">
        <FontAwesomeIcon icon={icon} />
      </span>
      <span className="step-info">
        <span className="step-label">{label}</span>
      </span>
    </button>
  );
}

function PartStep({
  part,
  active,
  onSelect,
}: {
  part: SidebarPart;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const { t } = useT();
  const label =
    part.title || (part.isNumber ? t("picker.number_part") : `${t("picker.part_prefix")} ${part.partNum}`);
  const iconContent = part.isNumber ? "#" : part.partNum;

  return (
    <button
      type="button"
      className={`sidebar-step${active ? " active" : ""}`}
      onClick={() => onSelect(part.passageId)}
    >
      <span className="step-icon">{iconContent}</span>
      <span className="step-info">
        <span className="step-label">{label}</span>
        {part.progress && <MiniStats progress={part.progress} />}
      </span>
    </button>
  );
}

function MiniStats({ progress }: { progress: NonNullable<SidebarPart["progress"]> }) {
  const { t } = useT();
  const wordsPct = pct(progress.learnedWords, progress.totalWords);
  const lessonPct = Math.max(0, Math.min(100, Math.round(progress.progressPct || 0)));
  const wordsFull = progress.totalWords > 0 && wordsPct >= 100;
  const lessonFull = lessonPct >= 100;

  return (
    <span className="sidebar-part-stats">
      <span className="mini-stat">
        <span className="label">{t("picker.words_label")}</span>
        <span className="mini-progress-bg">
          <span className={`mini-progress-fill${wordsFull ? " success" : ""}`} style={{ width: `${wordsPct}%` }} />
        </span>
        <span className={`value${wordsFull ? " success-text" : ""}`}>
          {progress.learnedWords}/{progress.totalWords}
        </span>
      </span>
      <span className="mini-stat">
        <span className="label">{t("picker.lesson_progress_label")}</span>
        <span className="mini-progress-bg">
          <span className={`mini-progress-fill${lessonFull ? " success" : ""}`} style={{ width: `${lessonPct}%` }} />
        </span>
        <span className={`value${lessonFull ? " success-text" : ""}`}>{lessonPct}%</span>
      </span>
    </span>
  );
}

function pct(done: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((done || 0) / total) * 100)));
}
