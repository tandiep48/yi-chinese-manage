"use client";

// components/page/learner/support/SupportContext.tsx
// Lets any learner page open the support panel, optionally pre-filled with the item
// being viewed:  openSupport({ item_type: "vocab", item_id: "42", label: "你好" }).

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { SupportItemType } from "@/lib/types/support";

export interface SupportPrefill {
  item_type: SupportItemType;
  item_id: string;
  /** Human-readable name shown on the form, e.g. the word itself. */
  label?: string;
}

interface SupportContextValue {
  isOpen: boolean;
  prefill: SupportPrefill | null;
  openSupport: (prefill?: SupportPrefill) => void;
  closeSupport: () => void;
}

const SupportCtx = createContext<SupportContextValue>({
  isOpen: false,
  prefill: null,
  openSupport: () => {},
  closeSupport: () => {},
});

export function SupportProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState<SupportPrefill | null>(null);

  const openSupport = useCallback((next?: SupportPrefill) => {
    setPrefill(next ?? null);
    setIsOpen(true);
  }, []);
  const closeSupport = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, prefill, openSupport, closeSupport }),
    [isOpen, prefill, openSupport, closeSupport]
  );
  return <SupportCtx.Provider value={value}>{children}</SupportCtx.Provider>;
}

export function useSupport(): SupportContextValue {
  return useContext(SupportCtx);
}
