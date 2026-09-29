"use client";

// app/manage/page.tsx
// Dashboard — stat cards showing total vocab, total passages, and HSK breakdown.
// Client component (like every other /manage page): the counts are fetched in
// the browser, where the same-origin "/api" URL resolves and the Flask-Login
// session cookie is sent. A server-side fetch here would have neither, and would
// also stall static prerendering at build time.

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Badge } from "@/components/shared/manager_ui/Badge/Badge";
import { listVocab } from "@/lib/api/manage/vocab";
import { listPassages } from "@/lib/api/manage/passage";
import { HSK_LEVELS } from "@/lib/types/common";
import Link from "next/link";

interface Stats {
  totalVocab: number | null;
  totalPassages: number | null;
  hskCounts: Record<string, number>;
}

async function fetchStats(): Promise<Stats> {
  const [vocabRes, passageRes, ...hskResults] = await Promise.allSettled([
    listVocab(1, 1),
    listPassages(1, 1),
    ...HSK_LEVELS.map((level) => listVocab(1, 1, level)),
  ]);

  const totalVocab =
    vocabRes.status === "fulfilled" ? vocabRes.value.total : null;
  const totalPassages =
    passageRes.status === "fulfilled" ? passageRes.value.total : null;

  const hskCounts: Record<string, number> = {};
  HSK_LEVELS.forEach((level, i) => {
    const res = hskResults[i];
    hskCounts[level] = res.status === "fulfilled" ? res.value.total : 0;
  });

  return { totalVocab, totalPassages, hskCounts };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchStats()
      .then((s) => active && setStats(s))
      .catch(
        () =>
          active &&
          setStats({ totalVocab: null, totalPassages: null, hskCounts: {} })
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <TopBar
        title="Dashboard"
        subtitle="Overview of your Yi Chinese content"
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Stat cards */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Content Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              id="stat-vocab"
              label="Total Vocabulary"
              value={stats?.totalVocab ?? null}
              loading={loading}
              icon="📖"
              href="/manage/vocab"
              colour="from-indigo-500 to-violet-500"
            />
            <StatCard
              id="stat-passages"
              label="Total Passages"
              value={stats?.totalPassages ?? null}
              loading={loading}
              icon="📝"
              href="/manage/passage"
              colour="from-sky-500 to-cyan-400"
            />
            <StatCard
              id="stat-levels"
              label="HSK Levels"
              value={HSK_LEVELS.length}
              loading={false}
              icon="🎯"
              colour="from-emerald-500 to-teal-400"
            />
          </div>
        </section>

        {/* HSK breakdown */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Vocabulary by HSK Level
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {HSK_LEVELS.map((level) => (
              <Link
                key={level}
                href={`/manage/vocab?hsk_level=${level}`}
                id={`hsk-card-${level}`}
                className="flex flex-col items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-5 hover:border-indigo-200 hover:shadow-md transition-all group"
              >
                <Badge label={level} hskLevel={level} />
                <span className="text-2xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {loading ? (
                    <span className="text-slate-300">…</span>
                  ) : (
                    stats?.hskCounts[level] ?? 0
                  )}
                </span>
                <span className="text-[10px] text-slate-400">words</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick links */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/manage/vocab"
              id="quick-manage-vocab"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600 transition-colors shadow-sm"
            >
              📖 Manage Vocabulary
            </Link>
            <Link
              href="/manage/passage"
              id="quick-manage-passages"
              className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              📝 Manage Passages
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  id: string;
  label: string;
  value: number | null;
  loading: boolean;
  icon: string;
  colour: string;
  href?: string;
}

function StatCard({ id, label, value, loading, icon, colour, href }: StatCardProps) {
  const content = (
    <div
      id={id}
      className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colour} rounded-t-2xl`} />
      <div className="flex items-start justify-between mt-1">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-800">
            {loading ? (
              <span className="text-slate-300 text-lg">…</span>
            ) : value === null ? (
              <span className="text-slate-300 text-lg">Unavailable</span>
            ) : (
              value.toLocaleString()
            )}
          </p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
