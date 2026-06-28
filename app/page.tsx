// app/page.tsx
// Dashboard — stat cards showing total vocab, total passages, and HSK breakdown.

import { TopBar } from "@/components/layout/TopBar";
import { Badge } from "@/components/ui/Badge";
import { listVocab, listPassages } from "@/lib/api";
import { HSK_LEVELS } from "@/lib/types";
import Link from "next/link";

async function fetchStats() {
  try {
    const [vocabRes, passageRes, ...hskResults] = await Promise.allSettled([
      listVocab(1, 1),
      listPassages(1, 1),
      ...HSK_LEVELS.map((level) => listVocab(1, 1, level)),
    ]);

    const totalVocab =
      vocabRes.status === "fulfilled" ? vocabRes.value.total : null;
    const totalPassages =
      passageRes.status === "fulfilled" ? passageRes.value.total : null;

    const hskBreakdown = HSK_LEVELS.map((level, i) => ({
      level,
      count:
        hskResults[i].status === "fulfilled"
          ? (hskResults[i] as PromiseFulfilledResult<{ total: number }>).value.total
          : 0,
    }));

    return { totalVocab, totalPassages, hskBreakdown };
  } catch {
    return { totalVocab: null, totalPassages: null, hskBreakdown: [] };
  }
}

export default async function DashboardPage() {
  const { totalVocab, totalPassages, hskBreakdown } = await fetchStats();

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
              value={totalVocab}
              icon="📖"
              href="/vocab"
              colour="from-indigo-500 to-violet-500"
            />
            <StatCard
              id="stat-passages"
              label="Total Passages"
              value={totalPassages}
              icon="📝"
              href="/passage"
              colour="from-sky-500 to-cyan-400"
            />
            <StatCard
              id="stat-levels"
              label="HSK Levels"
              value={HSK_LEVELS.length}
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
            {hskBreakdown.map(({ level, count }) => (
              <Link
                key={level}
                href={`/vocab?hsk_level=${level}`}
                id={`hsk-card-${level}`}
                className="flex flex-col items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-5 hover:border-indigo-200 hover:shadow-md transition-all group"
              >
                <Badge label={level} hskLevel={level} />
                <span className="text-2xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {count}
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
              href="/vocab"
              id="quick-manage-vocab"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600 transition-colors shadow-sm"
            >
              📖 Manage Vocabulary
            </Link>
            <Link
              href="/passage"
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
  icon: string;
  colour: string;
  href?: string;
}

function StatCard({ id, label, value, icon, colour, href }: StatCardProps) {
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
            {value === null ? (
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
