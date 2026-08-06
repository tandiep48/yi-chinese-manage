// components/shared/manager_ui/Badge/Badge.tsx
import { BADGE_DESIGN } from './constants';

interface BadgeProps {
  label: string;
  /** Auto-colours by HSK level when provided */
  hskLevel?: string;
}

export function Badge({ label, hskLevel }: BadgeProps) {
  const colourClass = hskLevel
    ? (BADGE_DESIGN.hskColours[hskLevel] ?? BADGE_DESIGN.defaultColour)
    : BADGE_DESIGN.defaultColour;

  return (
    <span className={`${BADGE_DESIGN.base} ${colourClass}`}>
      {label}
    </span>
  );
}
