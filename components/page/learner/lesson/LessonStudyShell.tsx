"use client";

// components/page/learner/lesson/LessonStudyShell.tsx
// Shared layout for the lesson-study pages (Word/Lesson Summary, Grammar,
// Translation): the collapsible LessonSidebar next to the page's main content.
// Mirrors the page-layout shell that Learning/web_app/templates/shared/sidebar.html
// wraps every study screen in.

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useMediaQuery } from "@/hooks/shared/useMediaQuery";
import { LessonSidebar, type StudyDomain } from "./LessonSidebar";
import { useLessonSidebarDock } from "./LessonSidebarDock";
import {
  LessonOutlineContext,
  type OutlineMilestone,
} from "./LessonOutlineContext";
import { useLessonParts } from "@/hooks/lesson/useLessonParts";
import "./lesson-study.css";

export function LessonStudyShell({
  passageId,
  domain,
  children,
  onSelectPart,
  onSelectDomain,
  onStartMaster,
}: {
  passageId: string;
  domain: StudyDomain;
  children: React.ReactNode;
  // Forwarded to the sidebar: when set, part clicks switch in place instead of
  // navigating to /learner/lesson (used by the dashboard's embedded milestone).
  onSelectPart?: (passageId: string) => void;
  // Forwarded to the sidebar: when set, Grammar / Translation render in place
  // instead of navigating to their pages (used by the dashboard).
  onSelectDomain?: (target: StudyDomain) => void;
  // Forwarded to the sidebar: when set, the Master Vocab / Master Lesson entries
  // start that trainer sequence in place (the lesson flow owns it).
  onStartMaster?: (engine: "vocab" | "lesson") => void;
}) {
  // On phones the sidebar starts collapsed (a sticky toggle opens it as an
  // overlay drawer) so it doesn't eat the vertical space above the lesson; on
  // desktop it stays open beside the content. `override` holds the learner's own
  // choice once they toggle it, so it wins over the breakpoint default.
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [override, setOverride] = useState<boolean | null>(null);
  const sidebarOpen = override ?? !isMobile;

  // The learner home can offer a rail to dock the sidebar into (item 7). When it
  // does, the sidebar is portaled there — always open, no drawer/toggle — and the
  // lesson content takes the full main width. Elsewhere the dock is absent and the
  // sidebar stays beside the content as before.
  const dockEl = useLessonSidebarDock();

  // The outline and the milestone header read the same parts load, and the outline
  // lists the running milestone's steps — see LessonOutlineContext.
  const lesson = useLessonParts(passageId);
  const [milestone, setMilestone] = useState<OutlineMilestone | null>(null);
  const outline = useMemo(
    () => ({ parts: lesson.parts, publishMilestone: setMilestone }),
    [lesson.parts],
  );

  if (dockEl && passageId) {
    return (
      <LessonOutlineContext.Provider value={outline}>
        <div className="lesson-study ui2-lesson">
          <div className="lesson-study-main app-container">{children}</div>
          {createPortal(
            <div className="lesson-study lesson-study-sidebar-dock">
              <LessonSidebar
                passageId={passageId}
                domain={domain}
                open
                onOpenChange={() => {}}
                lesson={lesson}
                milestone={milestone}
                onSelectPart={onSelectPart}
                onSelectDomain={onSelectDomain}
                onStartMaster={onStartMaster}
              />
            </div>,
            dockEl,
          )}
        </div>
      </LessonOutlineContext.Provider>
    );
  }

  return (
    <LessonOutlineContext.Provider value={outline}>
      <div className="lesson-study ui2-lesson">
        <div
          className={`lesson-study-layout${sidebarOpen ? "" : " sidebar-collapsed"}`}
        >
          {passageId && (
            <LessonSidebar
              passageId={passageId}
              domain={domain}
              open={sidebarOpen}
              onOpenChange={setOverride}
              lesson={lesson}
              milestone={milestone}
              onSelectPart={onSelectPart}
              onSelectDomain={onSelectDomain}
              onStartMaster={onStartMaster}
            />
          )}
          <div className="lesson-study-main app-container">{children}</div>
        </div>
      </div>
    </LessonOutlineContext.Provider>
  );
}
