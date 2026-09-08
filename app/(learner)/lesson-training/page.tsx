"use client";

// app/(learner)/lesson-training/page.tsx
// Solo lesson trainer route. Resolves its passage(s) from the URL (?passage_id — part
// mode) or a lesson-wide selection stashed in sessionStorage (master mode) and runs
// the server-built listening / meaning / typing / reorder tasks. Ported from
// Learning/web_app/templates/lesson/lesson.html (Flask route /lesson). The Next
// /lesson route is the read-only study page, so the graded trainer lives here.

import { Suspense } from "react";
import { LessonTrainerPage } from "@/components/page/learner/lesson-training/LessonTrainerPage";

export default function LessonTrainingPage() {
  return (
    <Suspense fallback={null}>
      <LessonTrainerPage />
    </Suspense>
  );
}
