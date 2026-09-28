"use client";

// hooks/home/useLearnerHome.ts
// URL state for the tabbed learner home (docs/plans/dashboard-tabs.md Phase 1).
// `?tab=` picks the panel and `?run=` names the activity running inside it, so a
// refresh lands back where the learner was. An in-flight run is what makes a tab
// switch dangerous, so `?run=` doubles as the guard's source of truth: it survives
// the reload that React state would not.
//
// Writes go through router.replace, not push: the tabs are one screen, and a
// learner who walked through all three should still get Back to the page before
// the dashboard rather than three dead stops inside it.

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const HOME_TABS = ["review", "lesson", "recommend"] as const;
export type HomeTab = (typeof HOME_TABS)[number];

export const DEFAULT_TAB: HomeTab = "review";

export interface UseLearnerHome {
  tab: HomeTab;
  // The activity running in the current panel ("vocab-trainer", a milestone step,
  // …), or null when the panel is idle. Panels own the vocabulary.
  run: string | null;
  sessionActive: boolean;
  // The tab a guarded switch is waiting on, or null when nothing is pending.
  pendingTab: HomeTab | null;
  setRun: (run: string | null) => void;
  // Switch tabs, or raise the guard when a run is in flight.
  requestTab: (next: HomeTab) => void;
  confirmSwitch: () => void;
  cancelSwitch: () => void;
}

function parseTab(raw: string | null): HomeTab {
  return (HOME_TABS as readonly string[]).includes(raw ?? "") ? (raw as HomeTab) : DEFAULT_TAB;
}

export function useLearnerHome(): UseLearnerHome {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [pendingTab, setPendingTab] = useState<HomeTab | null>(null);

  const tab = parseTab(searchParams.get("tab"));
  const run = searchParams.get("run");

  // The query string as it is *now*, not as it was when this closure was created.
  // A panel can call setRun from an unmount cleanup, which runs after a tab switch
  // has already written a new URL; rebuilding from the captured searchParams would
  // silently put the old tab back. router.replace updates window.location
  // synchronously, so the live URL is the one source that is never a render behind.
  const liveParams = useCallback(() => {
    if (typeof window !== "undefined") return new URLSearchParams(window.location.search);
    return new URLSearchParams(searchParams.toString());
  }, [searchParams]);

  const push = useCallback(
    (params: URLSearchParams) => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router]
  );

  // Owns `run` and nothing else. Writing `tab` here is what made a tab switch
  // race with the outgoing panel's cleanup.
  const setRun = useCallback(
    (nextRun: string | null) => {
      const params = liveParams();
      if (nextRun) params.set("run", nextRun);
      else params.delete("run");
      push(params);
    },
    [liveParams, push]
  );

  // Owns `tab`, and clears `run` because the panel that owned it is going away.
  const writeTab = useCallback(
    (nextTab: HomeTab) => {
      const params = liveParams();
      params.set("tab", nextTab);
      params.delete("run");
      push(params);
    },
    [liveParams, push]
  );

  const requestTab = useCallback(
    (next: HomeTab) => {
      if (next === tab) return;
      // Leaving mid-run needs a confirmation; the panel flushes on unmount either way.
      if (run) {
        setPendingTab(next);
        return;
      }
      writeTab(next);
    },
    [tab, run, writeTab]
  );

  const confirmSwitch = useCallback(() => {
    if (!pendingTab) return;
    setPendingTab(null);
    // Dropping ?run= is what ends the session: the panel unmounts with the tab.
    writeTab(pendingTab);
  }, [pendingTab, writeTab]);

  const cancelSwitch = useCallback(() => setPendingTab(null), []);

  return useMemo(
    () => ({
      tab,
      run,
      sessionActive: run !== null,
      pendingTab,
      setRun,
      requestTab,
      confirmSwitch,
      cancelSwitch,
    }),
    [tab, run, pendingTab, setRun, requestTab, confirmSwitch, cancelSwitch]
  );
}
