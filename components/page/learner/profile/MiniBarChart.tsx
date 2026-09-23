"use client";

// components/page/learner/dashboard/MiniBarChart.tsx
// The dashboard's three-day bar charts. The legacy page drew these on a canvas
// with Chart.js; a handful of divs is enough for three bars and keeps the
// dependency out.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-09-17" -> "Sep 17"; anything that isn't a y-m-d triple passes through.
export function formatChartDate(iso: string): string {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || !MONTHS[parts[1] - 1]) return iso;
  return `${MONTHS[parts[1] - 1]} ${parts[2]}`;
}

export function MiniBarChart({
  values,
  labels,
  suffix = "",
}: {
  values: number[];
  labels: string[];
  suffix?: string;
}) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-[240px] items-end justify-around gap-4 px-2">
      {values.map((value, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text-main)]">
            {value}
            {suffix}
          </span>
          <div
            className="w-full max-w-10 rounded-t-md bg-[var(--primary)]"
            style={{ height: `${Math.max(4, (value / max) * 160)}px` }}
          />
          <span className="text-xs text-[var(--text-light)]">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
