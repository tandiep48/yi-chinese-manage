"use client";

// hooks/useCompetitionTrainer.ts
// The in-room vocab trainer for Learn Together, porting startTrainer() /
// resolveRoomWords() / resolveBookWords() / emitVocabAnswer() from
// Learning/web_app/static/competition/competition.js. It reuses the solo trainer's
// activity builder and activity components; only the scoring destination differs —
// every answer goes straight out over the socket instead of being batched to REST.
//
// Where the words come from depends on the room: a vocab room resolves the public
// passage vocabulary on the client, while a book room fetches the pool the server
// froze at session start from the participant set — every player must call that
// endpoint rather than compute locally, so all players get an identical list.

import { useCallback, useEffect, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { resolveTrainerWords } from "@/lib/api/learner/vocabTrainer";
import { getSessionBookWords } from "@/lib/api/learner/competition";
import { vocabActivityTypes } from "@/lib/competition/roomLogic";
import { buildActivities, type Activity, type TrainerWord } from "@/lib/lessons/vocabTrainer";
import type { CompetitionRoom, CompetitionSession } from "@/lib/types/competition";

export type CompetitionTrainerStatus = "loading" | "playing" | "empty";

export function useCompetitionTrainer({
  room,
  session,
  onAnswer,
  onFinish,
}: {
  room: CompetitionRoom | null;
  session: CompetitionSession | null;
  onAnswer: (
    word: string,
    activityType: string,
    isCorrect: boolean,
    responseMs: number,
    wrongAttempts: number
  ) => void;
  onFinish: () => void;
}) {
  const { t } = useT();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [noWords, setNoWords] = useState(false);
  const [index, setIndex] = useState(0);

  // Keyed on a primitive, not the room object: every room_state broadcast (a member
  // joining, the host saving settings) hands back a fresh room with a fresh
  // passage_ids array, which would otherwise cancel the in-flight word fetch and
  // rebuild the activities mid-game.
  const passageKey = (room?.passage_ids ?? []).join(",");
  const activityType = room?.activity_type;
  const isBook = room?.category === "book";
  const sessionId = session?.id ?? null;

  useEffect(() => {
    let cancelled = false;
    const passageIds = passageKey ? passageKey.split(",") : [];
    if (!passageIds.length) return;
    if (isBook && !sessionId) return;

    const load = isBook
      ? getSessionBookWords(sessionId as number)
      : resolveTrainerWords({ passage_ids: passageIds });

    load.then((rows) => {
      if (cancelled) return;
      if (!rows.length) {
        setNoWords(true);
        return;
      }
      setActivities(buildActivities(rows as TrainerWord[], vocabActivityTypes(activityType)));
      setIndex(0);
    });
    return () => {
      cancelled = true;
    };
  }, [passageKey, activityType, isBook, sessionId]);

  // Derived rather than stored, so the effect never sets state synchronously.
  const status: CompetitionTrainerStatus =
    !passageKey || noWords ? "empty" : activities.length ? "playing" : "loading";

  // The activity components report (row, type, answer, isCorrect, ms, wrongAttempts);
  // the socket only needs the word and the score-relevant fields.
  const recordAnswer = useCallback(
    (
      row: TrainerWord,
      type: string,
      _userAnswer: string,
      isCorrect: boolean,
      responseMs: number,
      wrongAttempts = 0
    ) => {
      onAnswer(row.word, type, isCorrect, responseMs, wrongAttempts);
    },
    [onAnswer]
  );

  const advance = useCallback(() => {
    setIndex((i) => {
      const next = i + 1;
      if (next >= activities.length) {
        onFinish();
        return i;
      }
      return next;
    });
  }, [activities.length, onFinish]);

  const activity = activities[index] ?? null;
  const totalGroups = activities.length ? activities[activities.length - 1].groupIndex + 1 : 1;
  const counterText = activity
    ? t("vocab_trainer.group_counter", { current: activity.groupIndex + 1, total: totalGroups })
    : "";

  return { status, activity, activityKey: index, counterText, recordAnswer, advance };
}
