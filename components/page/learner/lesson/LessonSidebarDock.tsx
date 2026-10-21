"use client";

// components/page/learner/lesson/LessonSidebarDock.tsx
// Lets the learner home dock the lesson-study sidebar into its right rail instead of
// having it sit beside the lesson content, so the lesson gets the full main width
// (docs item 7). The home provides the rail's DOM node through this context; a
// LessonStudyShell rendered inside the home portals its sidebar there (keeping the
// React tree — and the sidebar's callbacks — intact). Everywhere else the context is
// absent, so the sidebar stays inline exactly as before.

import { createContext, useContext } from "react";

export const LessonSidebarDockContext = createContext<HTMLElement | null>(null);

export function useLessonSidebarDock(): HTMLElement | null {
  return useContext(LessonSidebarDockContext);
}
