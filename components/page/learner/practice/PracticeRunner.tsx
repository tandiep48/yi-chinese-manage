"use client";

// components/page/learner/practice/PracticeRunner.tsx
// Orchestrates a practice/exam run: the two shells from the legacy app —
// practice_standard.html (sidebar, direct lesson entry) and practice.html
// (bottom-nav, /practice/multi) — plus the shared topbar, question card, and
// result screen. State lives in usePracticeEngine; audio in PracticeAudioProvider.

import { useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCheck,
  faXmark,
  faHeadphonesSimple,
  faBookOpen,
  faTrophy,
  faChartLine,
  faRotateRight,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { usePracticeEngine, type PracticeEngine, type PracticeEngineOptions } from "@/hooks/usePracticeEngine";
import { PracticeAudioProvider, usePracticeAudio } from "./PracticeAudio";
import { QuestionGroup } from "./QuestionGroup";
import "./practice-shell.css";

const RESULT_ICONS: Record<string, IconDefinition> = {
  "fa-trophy": faTrophy,
  "fa-circle-check": faCircleCheck,
  "fa-chart-line": faChartLine,
  "fa-rotate-right": faRotateRight,
};

export function PracticeRunner(opts: PracticeEngineOptions) {
  return (
    <PracticeAudioProvider>
      <RunnerInner {...opts} />
    </PracticeAudioProvider>
  );
}

function RunnerInner(opts: PracticeEngineOptions) {
  const { t } = useT();
  const engine = usePracticeEngine(opts);
  const audio = usePracticeAudio();
  const variant: "sidebar" | "nav" = opts.multi ? "nav" : "sidebar";

  // Stop any audio when the active group changes or the run finishes.
  useEffect(() => {
    audio.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.currentIndex, engine.screen]);

  const backHref = engine.referrer.href;
  const backLabel = backLabelFor(engine.referrer.title, t);

  if (engine.screen === "loading") {
    return (
      <div className={`practice-shell${variant === "sidebar" ? " ps-shell" : ""}`}>
        <div className="p-screen active" id="screen-loading">
          {engine.error ? (
            <p style={{ color: "var(--danger)" }}>{t("practice.load_failed")}</p>
          ) : (
            <>
              <div className="loading-spinner" />
              <p style={{ color: "var(--text-muted)", marginTop: 16 }}>{t("practice.loading")}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (engine.screen === "result") {
    const r = engine.result!;
    return (
      <div className={`practice-shell${variant === "sidebar" ? " ps-shell" : ""}`}>
        <div className="p-screen active" id="screen-result">
          <div className="result-container">
            <div className="result-emoji">
              <FontAwesomeIcon icon={RESULT_ICONS[r.icon] ?? faCircleCheck} />
            </div>
            <h1 className="result-title">{t("practice.complete_title")}</h1>
            <p className="result-sub">
              {t("practice.set_label")} {opts.number ?? ""}
            </p>
            <div className="result-score-box">
              <div className="result-score-num">
                {r.score} / {r.total}
              </div>
              <div className="result-score-label">{t("practice.correct_answers")}</div>
            </div>
            <div className="result-actions">
              <Link href={backHref} className="p-btn p-btn-check" style={{ textDecoration: "none", textAlign: "center" }}>
                ← {backLabel}
              </Link>
              <button type="button" className="p-btn p-btn-next" onClick={engine.retry}>
                {t("practice.retry")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const group = engine.currentGroup!;
  const skill = group.questions[0]?.skill === "listening" ? "listening" : "reading";

  const card = (
    <>
      <div className={`p-skill-tag ${skill}`}>
        <FontAwesomeIcon icon={skill === "listening" ? faHeadphonesSimple : faBookOpen} />
        <span>{skill === "listening" ? t("recommend.listening") : t("recommend.reading")}</span>
      </div>
      <div className="p-card" id="question-card">
        <div className="p-group-card">
          <QuestionGroup
            group={group}
            state={engine.currentState!}
            category={opts.category}
            onSelectMC={engine.selectMC}
            onSelectKey={engine.selectKey}
            onToggleChip={engine.toggleChip}
            onBlankClick={engine.blankClick}
            onAssignT6={engine.assignT6}
          />
        </div>
      </div>
      <Nav engine={engine} variant={variant} t={t} />
    </>
  );

  return (
    <div className={`practice-shell${variant === "sidebar" ? " ps-shell" : ""}`}>
      <div className="p-screen active" id="screen-practice">
        <div className="p-topbar">
          <Link href={backHref} className="p-back-btn" title={backLabel}>
            ←
          </Link>
          <div className="p-progress-wrap">
            <div className="p-progress-bar">
              <div className="p-progress-fill" style={{ width: `${engine.progressPct}%` }} />
            </div>
            <span className="p-counter">
              {engine.currentIndex + 1} / {engine.groups.length}
            </span>
          </div>
          <div className="p-score-badge">
            <FontAwesomeIcon icon={faCircleCheck} /> <span>{engine.score}</span>
          </div>
        </div>

        {variant === "sidebar" ? (
          <div className="ps-body">
            <aside className="ps-sidebar">
              <div className="ps-sidebar-title">{t("practice.all_questions")}</div>
              <Sidebar engine={engine} t={t} />
            </aside>
            <div className="ps-main">{card}</div>
          </div>
        ) : (
          card
        )}
      </div>
    </div>
  );
}

function backLabelFor(title: string, t: (k: string, v?: Record<string, string | number>) => string): string {
  if (title === "recommend") return t("practice_select.back_to_recommendations");
  if (title.startsWith("exam-")) return t("practice.back_to_hsk_exam", { level: title.split("-")[1] });
  if (title.startsWith("practice-")) return t("practice.back_to_hsk_lessons", { level: title.split("-")[1] });
  return t("practice.back_to_practice");
}

function Sidebar({ engine, t }: { engine: PracticeEngine; t: (k: string, v?: Record<string, string | number>) => string }) {
  return (
    <div className="ps-sidebar-list">
      {engine.groups.map((_, i) => {
        const s = engine.states[i];
        const status = !s?.checked ? "unanswered" : s.correctCount === s.correctTotal ? "correct" : "incorrect";
        const cls = ["ps-sidebar-item"];
        if (status === "correct") cls.push("correct");
        if (status === "incorrect") cls.push("incorrect");
        if (i === engine.currentIndex) cls.push("active");
        return (
          <button
            key={i}
            type="button"
            className={cls.join(" ")}
            aria-label={t("practice.question_number", { n: i + 1 })}
            onClick={() => engine.jumpTo(i)}
          >
            {status === "correct" ? (
              <FontAwesomeIcon icon={faCheck} />
            ) : status === "incorrect" ? (
              <FontAwesomeIcon icon={faXmark} />
            ) : (
              i + 1
            )}
          </button>
        );
      })}
    </div>
  );
}

function Nav({
  engine,
  variant,
  t,
}: {
  engine: PracticeEngine;
  variant: "sidebar" | "nav";
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const checked = !!engine.currentState?.checked;
  return (
    <div className="p-nav">
      {variant === "nav" && engine.currentIndex > 0 && (
        <button type="button" className="p-btn p-btn-nav" onClick={engine.goPrev}>
          ← {t("practice.previous")}
        </button>
      )}
      {!checked && (
        <button type="button" className="p-btn p-btn-check" disabled={!engine.canCheck} onClick={engine.check}>
          {t("practice.check")}
        </button>
      )}
      {variant === "nav" && !engine.everyChecked && engine.hasNextUnchecked && (
        <button type="button" className="p-btn p-btn-nav" onClick={engine.goNext}>
          {t("practice.skip")} →
        </button>
      )}
      {engine.everyChecked && (
        <button type="button" className="p-btn p-btn-finish" disabled={engine.submitting} onClick={engine.finish}>
          {engine.submitting ? t("practice.submitting") : t("practice.finish")}
        </button>
      )}
    </div>
  );
}
