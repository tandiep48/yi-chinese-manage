"use client";

// components/page/learner/competition/RankingList.tsx
// The score rows shared by the live scoreboard, the waiting screen and the final
// ranking — renderScoreList() in Learning/web_app/static/competition/competition.js.

import type { CompetitionScore } from "@/lib/types/competition";

export function RankingList({ scores }: { scores: CompetitionScore[] }) {
  return (
    <div className="ranking-list">
      {scores.map((score, index) => (
        <div className="ranking-row" key={score.user_id}>
          <span className="ranking-rank">#{score.rank || index + 1}</span>
          <strong>{score.username}</strong>
          <span>{score.total_points || 0} pts</span>
        </div>
      ))}
    </div>
  );
}
