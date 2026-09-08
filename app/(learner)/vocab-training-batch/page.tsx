"use client";

// app/(learner)/vocab-training-batch/page.tsx
// Batch vocab trainer route. Resolves its selection from sessionStorage (a /vocab
// selection) or a ?passage_id deep link and runs the grouped typing / listening /
// reading activities. Ported from Learning/web_app/templates/vocab/
// vocab_training_batch.html (Flask route /vocab-training-batch).

import { Suspense } from "react";
import { VocabTrainerPage } from "@/components/page/learner/vocab-training/VocabTrainerPage";

export default function VocabTrainingBatchPage() {
  return (
    <Suspense fallback={null}>
      <VocabTrainerPage />
    </Suspense>
  );
}
