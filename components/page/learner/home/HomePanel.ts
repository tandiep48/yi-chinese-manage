// components/page/learner/home/HomePanel.ts
// What HomeShell hands every panel. A panel that runs an activity in place flips
// `?run=` through setRun, which is what keeps the run across a refresh and what
// arms the shell's mid-session guard (docs/plans/dashboard-tabs.md Phase 1-2).
//
// Panels that don't run anything yet ignore both and declare no props at all.

export interface HomePanelProps {
  run: string | null;
  setRun: (run: string | null) => void;
}
