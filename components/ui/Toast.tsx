"use client";

// components/ui/Toast.tsx
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
        className="fixed bottom-5 right-5 z-[999] flex flex-col gap-2 pointer-events-none"
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

  const variantStyles: Record<ToastVariant, string> = {
    success: "border-l-4 border-green-500 bg-green-50 text-green-800",
    error:   "border-l-4 border-red-500   bg-red-50   text-red-800",
    info:    "border-l-4 border-indigo-500 bg-indigo-50 text-indigo-800",
  };

  const icons: Record<ToastVariant, string> = {
    success: "✓",
    error:   "✕",
    info:    "ℹ",
  };

  return (
    <div
      role="alert"
      onClick={onDismiss}
      className={[
        "pointer-events-auto flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg",
        "min-w-[280px] max-w-sm cursor-pointer select-none",
        "transition-all duration-300",
        variantStyles[item.variant],
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      ].join(" ")}
    >
      <span className="mt-0.5 text-sm font-bold shrink-0">{icons[item.variant]}</span>
      <p className="text-sm leading-snug">{item.message}</p>
    </div>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  return useContext(ToastCtx);
}
