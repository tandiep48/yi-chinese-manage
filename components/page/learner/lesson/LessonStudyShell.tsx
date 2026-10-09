"use client";

// components/page/learner/lesson/LessonStudyShell.tsx
// Shared layout for the lesson-study pages (Word/Lesson Summary, Grammar,
// Translation): the collapsible LessonSidebar next to the page's main content.
// Mirrors the page-layout shell that Learning/web_app/templates/shared/sidebar.html
// wraps every study screen in.

import { useState } from "react";
import { LessonSidebar, type StudyDomain } from "./LessonSidebar";
import "./lesson-study.css";

export function LessonStudyShell({
  passageId,
  domain,
  children,
  onSelectPart,
  onSelectDomain,
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
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="lesson-study ui2-lesson">
      <div className={`lesson-study-layout${sidebarOpen ? "" : " sidebar-collapsed"}`}>
        {passageId && (
          <LessonSidebar
            passageId={passageId}
            domain={domain}
            open={sidebarOpen}
            onOpenChange={setSidebarOpen}
            onSelectPart={onSelectPart}
            onSelectDomain={onSelectDomain}
          />
        )}
        <div className="lesson-study-main app-container">{children}</div>
      </div>
    </div>
  );
}
