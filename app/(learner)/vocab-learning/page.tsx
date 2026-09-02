"use client";

// app/(learner)/vocab-learning/page.tsx
// Flash-cards study page. Resolves its word list from the URL (a /vocab
// selection stashed in sessionStorage, or a ?passage_id lesson deep link) and
// hands it to the shared FlashcardStudy flow. Ported from
// Learning/web_app/templates/vocab_learning/vocab_learning.html.

import { Suspense } from "react";
import { useFlashcardSource } from "@/hooks/useFlashcardSource";
import { FlashcardStudy } from "@/components/page/learner/vocab-learning/FlashcardStudy";

function VocabLearningContent() {
  const { words, loading, error, passageId } = useFlashcardSource();
  return <FlashcardStudy words={words} loading={loading} error={error} passageId={passageId} />;
}

export default function VocabLearningPage() {
  return (
    <Suspense fallback={null}>
      <VocabLearningContent />
    </Suspense>
  );
}
