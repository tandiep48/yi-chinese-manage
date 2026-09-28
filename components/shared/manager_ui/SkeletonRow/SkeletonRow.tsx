// components/shared/manager_ui/SkeletonRow/SkeletonRow.tsx
// Animated loading placeholder for table rows.
import { SKELETON_DESIGN } from './constants';

interface SkeletonRowProps {
  cols: number;
}

function SkeletonCell() {
  return (
    <td className={SKELETON_DESIGN.cell}>
      <div className={SKELETON_DESIGN.bar} />
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
