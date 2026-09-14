"use client";

// components/page/learner/competition/WaitingScreen.tsx
// Shown after this player finishes, while the others are still playing. The subtitle
// lists whoever has finished so far (participant_waiting events) and the scores keep
// updating live. Ported from #screen-waiting + renderWaitingUsers() in competition.js.

import { useT } from "@/components/i18n/I18nProvider";
import type { CompetitionScore } from "@/lib/types/types";
import { RankingList } from "./RankingList";

export function WaitingScreen({
  waitingUsers,
  scores,
}: {
  waitingUsers: string[];
  scores: CompetitionScore[];
}) {
  const { t } = useT();

  return (
    <section className="competition-screen active">
      <div className="competition-panel waiting-panel">
        <h1>{t("competition.you_finished")}</h1>
        <p className="subtitle">
          {waitingUsers.length
            ? t("competition.finished_list", { names: waitingUsers.join(", ") })
            : t("competition.waiting_others")}
        </p>
        <RankingList scores={scores} />
      </div>
    </section>
  );
}
