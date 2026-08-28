"use client";

// app/(learner)/lesson/page.tsx
// Lesson Overview + Vocab Overview for one lesson part — the read-only
// "before you start training" screens ported from Learning/web_app's
// /reading page. The graded lesson/vocab trainers themselves aren't wired
// yet (no such screens exist in this app), so this stops at overview.

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLessonOverview } from "@/hooks/useLessonOverview";
import { LessonOverview } from "@/components/page/learner/LessonOverview";
import { VocabOverview } from "@/components/page/learner/VocabOverview";
import { useT } from "@/components/i18n/I18nProvider";

export default function LessonPage() {
  return (
    <Suspense fallback={null}>
      <LessonPageContent />
    </Suspense>
  );
}

function LessonPageContent() {
  const { t } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const passageId = searchParams.get("passage_id") ?? "";

  const { loading, error, passage, vocab, vocabError } = useLessonOverview(passageId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm font-semibold text-[var(--learner-primary)] hover:underline"
      >
        ← {t("picker.back_to_lessons")}
      </button>

      {!passageId ? (
        <p className="text-sm text-[var(--learner-text-muted)]">{t("reading.failed_load_passage")}</p>
      ) : (
        <>
          <VocabOverview vocab={vocab} loading={loading} error={vocabError} />
          <LessonOverview passage={passage} loading={loading} error={error} />
        </>
      )}
    </div>
  );
}
