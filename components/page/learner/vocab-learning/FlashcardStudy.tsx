"use client";

// components/page/learner/vocab-learning/FlashcardStudy.tsx
// Shareable flash-cards experience: a Word Summary screen that leads into the
// flash-card review screen, for any list of vocab words. Two entries feed it the
// same item shape (LessonVocabRow) — the /vocab selection flow and a lesson-part
// deep link — so the whole flow lives in one component. Ported from the
// selection path of Learning/web_app/static/vocab_learning/vocab_learning.js
// (startSelectedFlashcards → summary → startLearningCards + goToTrainer). Speaking
// practice from the original is deferred.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n/I18nProvider";
import { LessonStudyShell } from "@/components/page/learner/lesson/LessonStudyShell";
import { WordSummary } from "@/components/page/learner/lesson/WordSummary";
import { TrainTypePicker } from "@/components/page/learner/trainer/TrainTypePicker";
import {
  VocabStrokeModal,
  type StrokeModalState,
  type StrokeAllItem,
} from "@/components/page/learner/vocab/VocabStrokeModal";
import { FlashcardView } from "./FlashcardView";
import type { LessonVocabRow } from "@/lib/types/types";

const HANZI_RE = /[一-鿿]/;

export function FlashcardStudy({
  words,
  loading,
  error,
  passageId,
}: {
  words: LessonVocabRow[];
  loading: boolean;
  error: string | null;
  // When present, LessonStudyShell shows the lesson sidebar (lesson deep-link
  // flow). Absent for the /vocab selection flow, where we show a back link.
  passageId?: string;
}) {
  const { t } = useT();
  const router = useRouter();
  // A lesson deep link ("Learn These Words") lands straight on the cards — the learner
  // already reviewed the word summary on the study page. The /vocab selection flow
  // (no passageId) still opens on its summary so the picked words can be reviewed.
  const [screen, setScreen] = useState<"summary" | "learning">(passageId ? "learning" : "summary");
  const [learningWords, setLearningWords] = useState<LessonVocabRow[]>([]);
  const [stroke, setStroke] = useState<StrokeModalState>(null);
  const [trainPickerOpen, setTrainPickerOpen] = useState(false);
  // The on-screen word order captured when the train picker opens (selection flow).
  const [trainItems, setTrainItems] = useState<LessonVocabRow[]>([]);

  // "Train These Vocab" → the batch vocab trainer. A lesson-part deep link auto-starts
  // from the passage (mode 6); the /vocab selection flow stashes the chosen words.
  function startTraining(types: string[]) {
    setTrainPickerOpen(false);
    try {
      sessionStorage.setItem("vocabTrainerActivityTypes", JSON.stringify(types));
      if (!passageId) {
        sessionStorage.setItem(
          "selectedVocabTrainerWords",
          JSON.stringify(trainItems.map((row) => row.cn))
        );
      }
    } catch {
      // sessionStorage unavailable (private mode); the trainer still starts.
    }
    router.push(
      passageId
        ? `/vocab-training-batch?mode=6&passage_id=${encodeURIComponent(passageId)}`
        : "/vocab-training-batch"
    );
  }

  function openStrokeAll(items: LessonVocabRow[]) {
    const queue: StrokeAllItem[] = [];
    items.forEach((row) => {
      [...(row.cn || "")]
        .filter((ch) => HANZI_RE.test(ch))
        .forEach((ch) => queue.push({ ch, word: row.cn, pinyin: row.pinyin || "" }));
    });
    if (queue.length) setStroke({ mode: "all", queue });
  }

  const openStroke = (word: string, pinyin: string) => setStroke({ mode: "word", word, pinyin });

  return (
    <LessonStudyShell passageId={passageId ?? ""} domain="lesson">
      {!passageId && (
        <div className="vl-back-row">
          <Link href="/vocab" className="vl-back">
            &larr; {t("vocab_learning.back_to_vocab")}
          </Link>
        </div>
      )}

      {screen === "summary" ? (
        <WordSummary
          vocab={words}
          loading={loading}
          error={error}
          onLearn={(items) => {
            setLearningWords(items);
            setScreen("learning");
          }}
          onTrain={(items) => {
            setTrainItems(items);
            setTrainPickerOpen(true);
          }}
          onOpenStroke={openStroke}
          onStrokeAll={openStrokeAll}
        />
      ) : (
        <FlashcardView
          words={learningWords.length ? learningWords : words}
          onOpenStroke={openStroke}
          onShowSummary={() => setScreen("summary")}
        />
      )}

      <VocabStrokeModal state={stroke} onClose={() => setStroke(null)} />

      {trainPickerOpen && (
        <TrainTypePicker
          engine="vocab"
          onStart={startTraining}
          onCancel={() => setTrainPickerOpen(false)}
        />
      )}
    </LessonStudyShell>
  );
}
