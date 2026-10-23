"use client";

// components/layout/LearnerSessionContext.tsx
// A tiny shared flag for "a learning activity is running in the home right now".
// The learner sidebar lives in the layout, a sibling of the page content, so it
// cannot read the home's `?run=` state through HomeShell's own tree. This provider
// sits above both in the layout: HomeShell registers the active run, and the
// sidebar reads it to confirm before a nav click abandons the session.

import { createContext, useContext, useMemo, useState } from "react";

interface LearnerSessionValue {
  active: boolean;
  setActive: (active: boolean) => void;
}

const LearnerSessionContext = createContext<LearnerSessionValue>({
  active: false,
  setActive: () => {},
});

export function LearnerSessionProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const value = useMemo(() => ({ active, setActive }), [active]);
  return <LearnerSessionContext.Provider value={value}>{children}</LearnerSessionContext.Provider>;
}

export function useLearnerSession(): LearnerSessionValue {
  return useContext(LearnerSessionContext);
}
