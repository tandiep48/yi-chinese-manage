"use client";

// components/page/learner/lesson/LessonOutlineContext.tsx
// The link between the lesson outline (LessonSidebar) and the milestone running in
// the main column. LessonStudyShell owns both sides: it loads the lesson's parts
// once and shares them down (the milestone header needs the part title and word
// count), and it collects the running milestone's step state so the outline can
// list the active part's steps. Outside a shell the context is absent and both
// sides simply do without.

import { createContext, useContext } from "react";
import type { SidebarPart } from "@/hooks/lesson/useLessonParts";

// What the running milestone reports for the outline's sub-step list.
export interface OutlineMilestone {
  passageId: string;
  step: number;
  totalSteps: number;
  // Step numbers the server has recorded as completed.
  completed: number[];
  goToStep: (step: number) => void;
}

interface LessonOutlineValue {
  parts: SidebarPart[];
  publishMilestone: (milestone: OutlineMilestone | null) => void;
}

export const LessonOutlineContext = createContext<LessonOutlineValue | null>(null);

export function useLessonOutline(): LessonOutlineValue | null {
  return useContext(LessonOutlineContext);
}
