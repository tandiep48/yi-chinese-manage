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
}: {
  passageId: string;
  domain: StudyDomain;
  children: React.ReactNode;
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
          />
        )}
        <div className="lesson-study-main app-container">{children}</div>
      </div>
    </div>
  );
}
