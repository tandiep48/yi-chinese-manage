// components/ui/Badge.tsx
// HSK level colour-coded badge + generic variant badge.

interface BadgeProps {
  label: string;
  /** Auto-colours by HSK level when provided */
  hskLevel?: string;
}

const HSK_COLOURS: Record<string, string> = {
  HSK1: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  HSK2: "bg-teal-50    text-teal-700    ring-1 ring-teal-200",
  HSK3: "bg-sky-50     text-sky-700     ring-1 ring-sky-200",
  HSK4: "bg-indigo-50  text-indigo-700  ring-1 ring-indigo-200",
  HSK5: "bg-violet-50  text-violet-700  ring-1 ring-violet-200",
  HSK6: "bg-rose-50    text-rose-700    ring-1 ring-rose-200",
};

const DEFAULT_COLOUR = "bg-slate-100 text-slate-600 ring-1 ring-slate-200";

export function Badge({ label, hskLevel }: BadgeProps) {
  const colourClass = hskLevel
    ? (HSK_COLOURS[hskLevel] ?? DEFAULT_COLOUR)
    : DEFAULT_COLOUR;

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5",
        "text-xs font-semibold leading-none whitespace-nowrap",
        colourClass,
      ].join(" ")}
    >
      {label}
    </span>
  );
}
