"use client";

// components/page/learner/home/HomeTabs.tsx
// The learner home's tab bar. A real tablist: arrow keys move between tabs with
// roving tabindex (only the selected tab is in the page's tab order), Home/End
// jump to the ends, and selection follows focus the way the WAI-ARIA tabs pattern
// specifies for an automatically-activated tablist.
//
// Every class here belongs to home-shell.css — see the §2 invariant in
// docs/plans/dashboard-tabs.md. Nothing in this subtree may be styled by a
// descendant selector the container doesn't own.

import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockRotateLeft, faBookOpen, faCompass } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { HOME_TABS, type HomeTab } from "@/hooks/home/useLearnerHome";

const ICONS: Record<HomeTab, IconDefinition> = {
  review: faClockRotateLeft,
  lesson: faBookOpen,
  recommend: faCompass,
};

const LABEL_KEYS: Record<HomeTab, string> = {
  review: "home.tab_review",
  lesson: "home.tab_lesson",
  recommend: "home.tab_recommend",
};

interface HomeTabsProps {
  tab: HomeTab;
  // Per-tab count badge; a tab with no entry (or 0) shows none.
  counts?: Partial<Record<HomeTab, number>>;
  onSelect: (tab: HomeTab) => void;
}

export function HomeTabs({ tab, counts, onSelect }: HomeTabsProps) {
  const { t } = useT();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = HOME_TABS.length - 1;
    let next: number;
    if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;

    e.preventDefault();
    refs.current[next]?.focus();
    onSelect(HOME_TABS[next]);
  }

  return (
    <nav className="learner-home-tabs" role="tablist" aria-label={t("home.tabs_label")}>
      {HOME_TABS.map((name, i) => {
        const selected = name === tab;
        const count = counts?.[name];
        return (
          <button
            key={name}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`learner-home-tab-${name}`}
            aria-selected={selected}
            aria-controls={`learner-home-panel-${name}`}
            tabIndex={selected ? 0 : -1}
            className={`learner-home-tab${selected ? " is-selected" : ""}`}
            onClick={() => onSelect(name)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            <FontAwesomeIcon icon={ICONS[name]} aria-hidden />
            <span className="learner-home-tab-label">{t(LABEL_KEYS[name])}</span>
            {!!count && <span className="learner-home-tab-count">{count}</span>}
          </button>
        );
      })}
    </nav>
  );
}
