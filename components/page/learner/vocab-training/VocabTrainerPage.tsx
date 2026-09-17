"use client";

// components/page/learner/vocab-training/VocabTrainerPage.tsx
// Batch vocab trainer page. Drives useVocabTrainer through the shared TrainerShell:
// the loading / training / complete screens, the per-activity component, the results
// SuccessPopup and the recap. Ported from Learning/web_app/templates/vocab/
// vocab_training_batch.html + static/vocab/vocab_training_batch.js.

import { useEffect } from "react";
import { TrainerShell } from "@/components/page/learner/trainer/TrainerShell";
import { SuccessPopup } from "@/components/page/learner/trainer/SuccessPopup";
import { useVocabTrainer } from "@/hooks/useVocabTrainer";
import { TypingActivity } from "./TypingActivity";
import { MatchActivity } from "./MatchActivity";
import { VocabTrainerRecap } from "./VocabTrainerRecap";
import "@/components/page/learner/trainer/vocab-trainer.css";

export function VocabTrainerPage() {
  const trainer = useVocabTrainer();

  // Enter advances via the current activity's primary action (Check / Continue),
  // unless a text field is focused (typing inputs manage their own Enter).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || trainer.screen !== "training") return;
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
      const btn = document.querySelector<HTMLButtonElement>(
        ".trainer-action-slot .bt-primary-action:not([disabled])"
      );
      if (btn) {
        e.preventDefault();
        btn.click();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [trainer.screen]);

  const activity = trainer.activity;

  return (
    <>
      <TrainerShell
        screen={trainer.screen}
        subtitle={trainer.subtitle}
        progress={trainer.progress}
        counterText={trainer.counterText}
        onQuit={trainer.goHome}
        complete={
          <VocabTrainerRecap
            missed={trainer.missed}
            canRetry={trainer.canRetry}
            onRetry={trainer.retryMissed}
            onHome={trainer.goHome}
          />
        }
      >
        {activity &&
          (activity.type === "typing" ? (
            <TypingActivity
              key={trainer.activityKey}
              activity={activity}
              onRecord={trainer.recordAnswer}
              onAdvance={trainer.advance}
            />
          ) : (
            <MatchActivity
              key={trainer.activityKey}
              activity={activity}
              onRecord={trainer.recordAnswer}
              onAdvance={trainer.advance}
            />
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
