"use client";

// components/page/learner/lesson-training/LessonTrainerPage.tsx
// Solo lesson trainer page. Drives useLessonTrainer through the shared TrainerShell
// (loading / training / complete), rendering the current task with the matching
// component and showing the SuccessPopup + recap. Ported from
// Learning/web_app/templates/lesson/lesson.html + static/lesson/lesson.js.

import { TrainerShell } from "@/components/page/learner/trainer/TrainerShell";
import { SuccessPopup } from "@/components/page/learner/trainer/SuccessPopup";
import { useLessonTrainer } from "@/hooks/lesson/useLessonTrainer";
import { ChoiceTask } from "./ChoiceTask";
import { TypingTask } from "./TypingTask";
import { ReorderTask } from "./ReorderTask";
import { LessonTrainerRecap } from "./LessonTrainerRecap";
import "./lesson-trainer.css";

export function LessonTrainerPage() {
  const trainer = useLessonTrainer();
  const task = trainer.task;

  return (
    <>
      <TrainerShell
        scopeClass="lesson-trainer"
        screen={trainer.screen}
        subtitle={trainer.subtitle}
        progress={trainer.progress}
        counterText={trainer.counterText}
        onQuit={trainer.goHome}
        quitIcon
        complete={
          <LessonTrainerRecap
            missed={trainer.missed}
            canRetry={trainer.canRetry}
            onRetry={trainer.retryMissed}
            onHome={trainer.goHome}
          />
        }
      >
        {task &&
          (task.type === "listening" || task.type === "meaning" ? (
            <ChoiceTask key={trainer.taskKey} task={task} onResolved={trainer.onResolved} onAdvance={trainer.advance} />
          ) : task.type === "typing" ? (
            <TypingTask key={trainer.taskKey} task={task} onResolved={trainer.onResolved} onAdvance={trainer.advance} />
          ) : (
            <ReorderTask key={trainer.taskKey} task={task} onResolved={trainer.onResolved} onAdvance={trainer.advance} />
          ))}
      </TrainerShell>

      <SuccessPopup
        open={trainer.popupOpen}
        total={trainer.popupTotal}
        correct={trainer.popupCorrect}
        onContinue={trainer.continueToRecap}
      />
    </>
  );
}
