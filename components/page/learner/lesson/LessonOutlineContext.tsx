"use client";

// components/page/learner/lesson/LessonOutlineContext.tsx
// The lesson's parts, loaded once by LessonStudyShell and shared down: the
// milestone header in the main column needs the part title. Outside a shell the
// context is absent and the header does without.

import { createContext, useContext } from "react";
import type { SidebarPart } from "@/hooks/lesson/useLessonParts";

interface LessonOutlineValue {
  parts: SidebarPart[];
}

export const LessonOutlineContext = createContext<LessonOutlineValue | null>(null);

export function useLessonOutline(): LessonOutlineValue | null {
  return useContext(LessonOutlineContext);
}
