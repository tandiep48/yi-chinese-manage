export const BUTTON_DESIGN = {
  baseStyles: "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-left",
  variants: {
    primary: "bg-[#576856] text-white hover:bg-[#455544] hover:-translate-y-[2px] focus:ring-[#576856] shadow-sm",
    secondary: "bg-[#f0f4f1] text-[#576856] hover:bg-[#e0e8e1] hover:-translate-y-[2px] focus:ring-[#576856]",
    warning: "bg-[#f59e0b] text-white hover:bg-[#d97706] focus:ring-[#f59e0b] shadow-sm",
    danger: "border-l-4 border-[#ef4444] bg-white text-[#576856] hover:bg-gray-50 focus:ring-[#ef4444]",
    outline: "border border-[#576856] text-[#576856] hover:bg-[#576856] hover:text-white focus:ring-[#576856]",
    ghost: "text-[#576856] hover:bg-[#f0f4f1] focus:ring-[#576856]"
  },
  sizes: {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-[15px] text-base",
    lg: "px-6 py-4 text-lg"
  }
};
