"use client";

// app/manage/passage/[passageId]/page.tsx
// Editor for one passage: details, lines (edit, add, reorder) and vocabulary.

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePassageEditor } from "@/hooks/manage/usePassageEditor";
import { useToast } from "@/components/shared/manager_ui/Toast/Toast";
import { TopBar } from "@/components/layout/TopBar";
import { PassageDetailsForm } from "@/components/page/passage/PassageDetailsForm";
import { LineCard, toLineDraft } from "@/components/page/passage/LineCard";
import { PassageVocabManager } from "@/components/page/passage/PassageVocabManager";
import { errorCls, secondaryButtonCls } from "@/components/page/passage/formStyles";
import { lessonAudioFolder } from "@/lib/audio";

export default function PassageEditorPage() {
  const { passageId } = useParams<{ passageId: string }>();
  // Keyed so that moving between passages never carries drafts across.
  return <PassageEditor key={passageId} passageId={passageId} />;
}

function PassageEditor({ passageId }: { passageId: string }) {
  const { passage, lines, error, reordering, nextLineId, saveDetails, saveLine, addLine, moveLine } =
    usePassageEditor(passageId);
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);

  const move = async (index: number, step: -1 | 1) => {
    try {
      await moveLine(index, step);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Reorder failed.", "error");
    }
  };

  // Lines without a number cannot be addressed by the reorder endpoint.
  const canReorder = !reordering && lines.every((l) => l.line_id !== null);
  const audioFolder = passage ? lessonAudioFolder(passage) : "";

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar
        title={passageId}
        subtitle={passage ? `${lines.length} lines` : "Passage"}
        actions={
          <Link href="/manage/passage" className={secondaryButtonCls}>
            ← All passages
          </Link>
        }
      />

      <main className="flex-1 p-6 space-y-4">
        {error ? (
          <div role="alert" className={errorCls}>{error}</div>
        ) : !passage ? (
          <p role="status" className="text-sm text-slate-400 animate-pulse">Loading passage…</p>
        ) : (
          <>
            <PassageDetailsForm passage={passage} onSave={saveDetails} />

            <section aria-label="Lines" className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Lines</h2>

              {lines.length === 0 && !adding && (
                <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
                  No lines in this passage.
                </p>
              )}

              {lines.map((line, index) => (
                <LineCard
                  // The row id, which stays put when line numbers are reordered.
                  key={line.id}
                  lineId={line.line_id}
                  initial={toLineDraft(line)}
                  audioFolder={audioFolder}
                  onSave={(data) => saveLine(line.line_id as number, data)}
                  onMoveUp={canReorder && index > 0 ? () => move(index, -1) : undefined}
                  onMoveDown={
                    canReorder && index < lines.length - 1 ? () => move(index, 1) : undefined
                  }
                />
              ))}

              {adding ? (
                <LineCard
                  isNew
                  lineId={nextLineId}
                  initial={{
                    speaker: "",
                    content: "",
                    pinyin: "",
                    audio_key: `${passageId}_${nextLineId}`,
                    translation_en: "",
                    translation_vi: "",
                    tokens: [],
                    flag: 1,
                  }}
                  audioFolder={audioFolder}
                  onSave={async (data) => {
                    const saved = await addLine(data);
                    setAdding(false);
                    return saved;
                  }}
                  onCancel={() => setAdding(false)}
                />
              ) : (
                <button type="button" onClick={() => setAdding(true)} className={secondaryButtonCls}>
                  + Add line
                </button>
              )}
            </section>

            <PassageVocabManager passageId={passageId} />
          </>
        )}
      </main>
    </div>
  );
}
