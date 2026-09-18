"use client";

// app/learner/page.tsx
// Learner home dashboard — layout ported from the Learning app
// (templates/dashboard/dashboard.html + static/dashboard/dashboard.css).
// Data wiring ported from static/dashboard/dashboard.js, against the same
// (non-enveloped) JSON endpoints — see hooks/useDashboardHome.ts.
//
// The page is composition only; each block lives in
// components/page/learner/dashboard/.

import { Inter } from "next/font/google";
import { useDashboardHome } from "@/hooks/profile/useDashboardHome";
import { CurrentLessonCard } from "@/components/page/learner/dashboard/CurrentLessonCard";
import { LearningStatistics } from "@/components/page/learner/dashboard/LearningStatistics";
import { RecommendedSection } from "@/components/page/learner/dashboard/RecommendedSection";
import { ReviewCard } from "@/components/page/learner/dashboard/ReviewCard";
import "@/components/page/learner/dashboard/dashboard.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function DashboardPage() {
  const {
    loading,
    signedOut,
    hasRecent,
    lesson,
    stats,
    wordsDays,
    timeDays,
    recommendations,
    recommendError,
    error,
  } = useDashboardHome();

  return (
    <div className={`${inter.variable} ui2-dashboard`}>
      <main className="dashboard-main">
        <div className="top-grid">
          <CurrentLessonCard
            loading={loading}
            signedOut={signedOut}
            error={error}
            hasRecent={hasRecent}
            lesson={lesson}
          />
          <ReviewCard />
        </div>

        <RecommendedSection
          loading={loading}
          recommendError={recommendError}
          recommendations={recommendations}
        />

        <LearningStatistics stats={stats} wordsDays={wordsDays} timeDays={timeDays} />
      </main>
    </div>
  );
}
