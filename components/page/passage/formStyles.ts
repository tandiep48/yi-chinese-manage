// components/page/passage/formStyles.ts
// Form classes shared by the passage create modal and the passage editor.

export const inputCls =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm " +
  "text-slate-800 placeholder:text-slate-400 " +
  "focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all";

export const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

export const primaryButtonCls =
  "rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm " +
  "hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

export const secondaryButtonCls =
  "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 " +
  "hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

export const errorCls = "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600";
