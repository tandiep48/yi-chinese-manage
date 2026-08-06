"use client";

// components/shared/manager_ui/Toast/Toast.tsx
// Self-contained toast notification system:
//  - ToastProvider — wraps the app (added in layout.tsx)
//  - useToast()   — hook to trigger toasts from any client component

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { TOAST_DESIGN, TOAST_ICONS } from "./constants";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastCtx = createContext<ToastContextValue>({ toast: () => {} });

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = `t-${Date.now()}-${counterRef.current++}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      {/* Toast stack */}
      <div
        aria-live="polite"
        className={TOAST_DESIGN.container}
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={() =>
            setToasts((prev) => prev.filter((x) => x.id !== t.id))
          } />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ─── Toast card ──────────────────────────────────────────────────────────────

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      role="alert"
      onClick={onDismiss}
      className={[
        TOAST_DESIGN.cardBase,
        TOAST_DESIGN.variantStyles[item.variant],
        visible ? TOAST_DESIGN.cardVisible : TOAST_DESIGN.cardHidden,
      ].join(" ")}
    >
      <span className={TOAST_DESIGN.iconContainer}>{TOAST_ICONS[item.variant]}</span>
      <p className={TOAST_DESIGN.message}>{item.message}</p>
    </div>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  return useContext(ToastCtx);
}
