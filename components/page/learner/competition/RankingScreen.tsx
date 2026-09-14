"use client";

// components/page/learner/competition/RankingScreen.tsx
// The final ranking once every player has finished (or the section timed out), with
// the Back to Lobby button that returns the whole room. Ported from #screen-ranking
// + returnToLobby() in competition.js.

import { useT } from "@/components/i18n/I18nProvider";
import type { CompetitionScore } from "@/lib/types/types";
import { RankingList } from "./RankingList";

export function RankingScreen({
  scores,
  onBackToLobby,
}: {
  scores: CompetitionScore[];
  onBackToLobby: () => void;
}) {
  const { t } = useT();

  return (
    <section className="competition-screen active">
      <div className="competition-panel">
        <h1>{t("competition.ranking")}</h1>
        <RankingList scores={scores} />
        <button
          type="button"
          className="btn primary competition-start-btn"
          onClick={onBackToLobby}
        >
          {t("competition.back_to_lobby")}
        </button>
      </div>
    </section>
  );
}
