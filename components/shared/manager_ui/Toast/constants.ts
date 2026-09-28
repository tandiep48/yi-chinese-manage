export const TOAST_DESIGN = {
  container: "fixed bottom-5 right-5 z-[999] flex flex-col gap-2 pointer-events-none",
  cardBase: "pointer-events-auto flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg min-w-[280px] max-w-sm cursor-pointer select-none transition-all duration-300",
  cardVisible: "opacity-100 translate-y-0",
  cardHidden: "opacity-0 translate-y-4",
  iconContainer: "mt-0.5 text-sm font-bold shrink-0",
  message: "text-sm leading-snug",
  variantStyles: {
    success: "border-l-4 border-green-500 bg-green-50 text-green-800",
    error:   "border-l-4 border-red-500   bg-red-50   text-red-800",
    info:    "border-l-4 border-indigo-500 bg-indigo-50 text-indigo-800",
  } as Record<string, string>
};

export const TOAST_ICONS = {
  success: "✓",
  error:   "✕",
  info:    "ℹ",
} as Record<string, string>;
