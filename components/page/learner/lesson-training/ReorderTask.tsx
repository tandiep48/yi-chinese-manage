"use client";

// components/page/learner/lesson-training/ReorderTask.tsx
// Sentence-reorder lesson task, ported from the reorder branch of
// Learning/web_app/static/lesson/lesson.js. Click a source chip to append it to the
// answer row (click a placed chip to send it back); drag to reposition. The answer
// auto-submits once the row matches the target order. Skipping (or matching) reveals
// the correct sentence and locks the chips.

import { useMemo, useRef, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { reorderMatches } from "@/lib/lessons/lessonTrainer";
import { useLessonTaskFlow } from "@/hooks/useLessonTaskFlow";
import type { LessonTask } from "@/lib/types/lesson";

interface Chip {
  id: number;
  token: string;
}

export function ReorderTask({
  task,
  onResolved,
  onAdvance,
}: {
  task: LessonTask;
  onResolved: Parameters<typeof useLessonTaskFlow>[0]["onResolved"];
  onAdvance: () => void;
}) {
  const { t } = useT();
  const { answered, outcome, commit, buttonPortal } = useLessonTaskFlow({ task, onResolved, onAdvance });
  const tokens = useMemo(() => task.tokens ?? [], [task.tokens]);

  // Stable chip ids (tokens can repeat), starting all in the source row.
  const initialChips = useMemo<Chip[]>(
    () => (task.shuffled_tokens ?? []).map((token, id) => ({ id, token })),
    [task.shuffled_tokens]
  );
  const [source, setSource] = useState<Chip[]>(initialChips);
  const [target, setTarget] = useState<Chip[]>([]);
  const draggingId = useRef<number | null>(null);
  const targetRowRef = useRef<HTMLDivElement | null>(null);
  const sourceRowRef = useRef<HTMLDivElement | null>(null);

  function checkOrder(nextTarget: Chip[]) {
    const order = nextTarget.map((c) => c.token);
    if (reorderMatches(order, tokens)) commit(order.join(""), true);
  }

  function clickChip(chip: Chip, inTarget: boolean) {
    if (answered) return;
    if (inTarget) {
      const nextTarget = target.filter((c) => c.id !== chip.id);
      setTarget(nextTarget);
      setSource((s) => [...s, chip]);
      checkOrder(nextTarget);
    } else {
      const nextTarget = [...target, chip];
      setSource((s) => s.filter((c) => c.id !== chip.id));
      setTarget(nextTarget);
      checkOrder(nextTarget);
    }
  }

  // Which chip the dragged chip should be inserted before, based on cursor X.
  function insertIndex(row: HTMLElement | null, clientX: number): number {
    if (!row) return -1;
    const chips = [...row.querySelectorAll<HTMLElement>(".lesson-reorder-chip:not(.dragging)")];
    for (let i = 0; i < chips.length; i++) {
      const box = chips[i].getBoundingClientRect();
      if (clientX < box.left + box.width / 2) return i;
    }
    return chips.length;
  }

  function dropInto(toTarget: boolean, e: React.DragEvent) {
    if (answered) return;
    e.preventDefault();
    const id = draggingId.current;
    if (id == null) return;
    const chip = [...source, ...target].find((c) => c.id === id);
    if (!chip) return;

    const nextSource = source.filter((c) => c.id !== id);
    const nextTargetBase = target.filter((c) => c.id !== id);
    const row = toTarget ? targetRowRef.current : sourceRowRef.current;
    const at = insertIndex(row, e.clientX);

    if (toTarget) {
      const nextTarget = [...nextTargetBase];
      nextTarget.splice(at === -1 ? nextTarget.length : at, 0, chip);
      setSource(nextSource);
      setTarget(nextTarget);
      checkOrder(nextTarget);
    } else {
      const nextSource2 = [...nextSource];
      nextSource2.splice(at === -1 ? nextSource2.length : at, 0, chip);
      setSource(nextSource2);
      setTarget(nextTargetBase);
      checkOrder(nextTargetBase);
    }
    draggingId.current = null;
  }

  function renderChip(chip: Chip, inTarget: boolean) {
    return (
      <div
        key={chip.id}
        className="chip lesson-reorder-chip"
        draggable={!answered}
        onClick={() => clickChip(chip, inTarget)}
        onDragStart={() => {
          draggingId.current = chip.id;
        }}
        onDragEnd={() => {
          draggingId.current = null;
        }}
      >
        {chip.token}
      </div>
    );
  }

  return (
    <div className="lt-task lt-reorder">
      <div className="instruction">{t("lesson.instruction_reorder")}</div>

      <p className="lt-reorder-label-row">{t("lesson.your_sentence")}</p>
      <div
        ref={targetRowRef}
        className="chip-container lt-reorder-target"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => dropInto(true, e)}
      >
        {target.map((c) => renderChip(c, true))}
      </div>

      <p className="lt-reorder-label-row">{t("lesson.available_words")}</p>
      <div
        ref={sourceRowRef}
        className="chip-container lt-reorder-source"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => dropInto(false, e)}
      >
        {source.map((c) => renderChip(c, false))}
      </div>

      {answered && outcome !== "correct" ? (
        <div className="lt-reorder-feedback">
          <span className="lt-reorder-label">{t("lesson.correct_answer_label")}</span>{" "}
          <span className="lt-reorder-answer">{task.correct_answer}</span>
        </div>
      ) : null}

      {buttonPortal}
    </div>
  );
}
