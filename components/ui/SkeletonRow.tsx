// components/ui/SkeletonRow.tsx
// Animated loading placeholder for table rows.

interface SkeletonRowProps {
  cols: number;
}

function SkeletonCell() {
  return (
    <td className="px-4 py-3">
      <div className="h-4 rounded-md bg-slate-200 animate-pulse" />
    </td>
  );
}

export function SkeletonRow({ cols }: SkeletonRowProps) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonCell key={i} />
      ))}
    </tr>
  );
}

export function SkeletonTable({
  rows = 5,
  cols,
}: {
  rows?: number;
  cols: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  );
}
