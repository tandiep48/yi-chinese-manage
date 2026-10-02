"use client";

// components/page/learner/home/HomeShell.tsx
// The tabbed learner home (docs/plans/dashboard-tabs.md Phase 1): one container
// holding Word Review, Lesson and Recommend, each running its activity in place
// instead of navigating away.
//
// Two rules hold this together:
//
// 1. §2 invariant — `.learner-home` is a NEW root that styles only its own chrome.
//    Each panel keeps its own root class and stylesheet as a non-descendant, so the
//    30 leaf class names those stylesheets share (`.btn`, `.rec-card`, `.active`, …)
//    never meet. tests/css/containerInvariants.test.ts enforces it.
// 2. Only the active panel is mounted, and each is a next/dynamic chunk — the
//    first dynamic imports in the repo. Eagerly shipping all three would cost
//    ~50-60 KB of JS and ~20 KB of CSS gzipped on a route where most learners
//    open one tab.
//
// Unmounting a running panel is safe because the Phase 0 trainer seams flush their
// pending answers on unmount; the guard below is about the learner's intent, not
// about data loss.

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { getVocabReviewCount } from "@/lib/api/learner/vocab";
import { useLearnerHome } from "@/hooks/home/useLearnerHome";
import { HomeTabs } from "./HomeTabs";
import { HomePanelSkeleton } from "./HomePanelSkeleton";
import { CurrentLessonPanel } from "./CurrentLessonPanel";
import "./home-shell.css";

const loading = () => <HomePanelSkeleton />;

const ReviewTab = dynamic(() => import("./ReviewTab").then((m) => m.ReviewTab), { loading });
const LessonTab = dynamic(() => import("./LessonTab").then((m) => m.LessonTab), { loading });
const RecommendTab = dynamic(() => import("./RecommendTab").then((m) => m.RecommendTab), { loading });

export function HomeShell() {
  const { t } = useT();
  const { user, loading: authLoading } = useAuth();
  const home = useLearnerHome();
  const [reviewCount, setReviewCount] = useState(0);

  // The words-due badge is wanted before the tab is opened, so it can't wait for
  // the panel. /api/vocab/review/count exists for exactly this: the list route is
  // a full-table vocabulary load and costs ~11x as much (§4).
  //
  // Depending on `run` re-counts once a run ends — training words is what changes
  // the number — while the early return keeps it from firing when one starts.
  // Switching tabs doesn't touch `run`, so it costs nothing.
  useEffect(() => {
    if (authLoading || !user || home.run) return;
    let cancelled = false;
    getVocabReviewCount()
      .then((n) => !cancelled && setReviewCount(n))
      .catch(() => {
        // Soft-fail: a missing badge is better than a broken dashboard.
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, home.run]);

  return (
    <div className="learner-home">
      <HomeTabs tab={home.tab} counts={{ review: reviewCount }} onSelect={home.requestTab} />

      {/* The panel and, for a signed-in learner, the current-lesson rail beside
          it. The rail is visible from every tab, so it lives in the shell rather
          than inside any one panel. The `--split` modifier turns on the two-column
          layout only when the rail is present. */}
      <div className={`learner-home-main${user ? " learner-home-main--split" : ""}`}>
        <div
          className="learner-home-panel"
          id={`learner-home-panel-${home.tab}`}
          role="tabpanel"
          aria-labelledby={`learner-home-tab-${home.tab}`}
        >
          {/* Switched rather than mapped, so each panel takes exactly the props it
              needs — the two that don't run anything yet declare none. */}
          {home.tab === "review" ? (
            <ReviewTab run={home.run} setRun={home.setRun} />
          ) : home.tab === "lesson" ? (
            <LessonTab run={home.run} setRun={home.setRun} />
          ) : (
            <RecommendTab run={home.run} setRun={home.setRun} />
          )}
        </div>

        {user && <CurrentLessonPanel onContinue={() => home.requestTab("lesson")} />}
      </div>

      {home.pendingTab && (
        <div
          className="learner-home-guard"
          onClick={(e) => {
            if (e.target === e.currentTarget) home.cancelSwitch();
          }}
        >
          <div className="learner-home-guard-box" role="alertdialog" aria-modal="true" aria-labelledby="learner-home-guard-title">
            <h2 id="learner-home-guard-title" className="learner-home-guard-title">
              {t("home.guard_title")}
            </h2>
            <p className="learner-home-guard-body">{t("home.guard_body")}</p>
            <div className="learner-home-guard-actions">
              <button type="button" className="learner-home-guard-stay" onClick={home.cancelSwitch}>
                {t("home.guard_stay")}
              </button>
              <button type="button" className="learner-home-guard-leave" onClick={home.confirmSwitch}>
                {t("home.guard_leave")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
