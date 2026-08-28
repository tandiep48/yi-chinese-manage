"use client";

// components/layout/Sidebar.tsx
// Collapsible left navigation — 240px expanded / 64px icon-only.

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/manage",
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 10a8 8 0 1 1 16 0A8 8 0 0 1 2 10Zm8-5a.75.75 0 0 1 .75.75v3.5h3.5a.75.75 0 0 1 0 1.5h-3.5v3.5a.75.75 0 0 1-1.5 0v-3.5H5.75a.75.75 0 0 1 0-1.5h3.5v-3.5A.75.75 0 0 1 10 5Z" />
      </svg>
    ),
  },
  {
    label: "Vocabulary",
    href: "/manage/vocab",
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3.505 2.365A41.369 41.369 0 0 1 9 2c1.863 0 3.678.124 5.46.365.782.104 1.36.836 1.36 1.648V18a.75.75 0 0 1-1.09.67L9 16.409l-5.73 2.261A.75.75 0 0 1 2.25 18V4.013c0-.812.578-1.544 1.255-1.648Z" />
      </svg>
    ),
  },
  {
    label: "Passages",
    href: "/manage/passage",
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Users",
    href: "/manage/user",
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
      </svg>
    ),
  },
  {
    label: "Questions",
    href: "/manage/question",
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM8.94 6.94a.75.75 0 1 1-1.061-1.061 3 3 0 1 1 2.871 5.026v.345a.75.75 0 0 1-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 1 0 8.94 6.94ZM10 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Grammar Rules",
    href: "/manage/grammar_rule",
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.75 2A2.75 2.75 0 0 0 2 4.75v10.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25V4.75A2.75 2.75 0 0 0 15.25 2H4.75ZM5.5 6.25a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75Zm0 3.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75Zm0 3.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Grammar Contexts",
    href: "/manage/grammar_context",
    icon: (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 10 2.5c1.73 0 3.437.09 5.152.271a.75.75 0 0 1 .663.643 61.32 61.32 0 0 1 0 8.172.75.75 0 0 1-.663.643 49.144 49.144 0 0 1-5.152.271 49.144 49.144 0 0 1-5.152-.271.75.75 0 0 1-.663-.643 61.32 61.32 0 0 1 0-8.172.75.75 0 0 1 .663-.643Zm5.4 6.4a.75.75 0 0 0-1.06-1.06L7.72 9.58a.75.75 0 0 0 0 1.06l1.47 1.47a.75.75 0 1 0 1.06-1.06l-.94-.94.94-.94Zm2.088-1.06a.75.75 0 1 0-1.06 1.06l.94.94-.94.94a.75.75 0 1 0 1.06 1.06l1.47-1.47a.75.75 0 0 0 0-1.06l-1.47-1.47Z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const w = collapsed ? "w-16" : "w-60";

  return (
    <aside
      className={[
        "flex flex-col h-screen bg-white border-r border-slate-200",
        "transition-all duration-300 ease-in-out shrink-0 sticky top-0",
        w,
      ].join(" ")}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100 overflow-hidden">
        <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-white font-bold text-sm">易</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-800 leading-none truncate">
              Yi Chinese
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate uppercase tracking-wider">
              Admin
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/manage"
              ? pathname === "/manage"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={[
                "flex items-center gap-3 rounded-xl px-3 py-2.5 mb-1",
                "text-sm font-medium transition-all duration-150",
                active
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800",
              ].join(" ")}
            >
              <span className={active ? "text-indigo-500" : "text-slate-400"}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-slate-100 p-2">
        <button
          id="sidebar-toggle"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={[
            "flex items-center gap-3 w-full rounded-xl px-3 py-2.5",
            "text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors",
          ].join(" ")}
        >
          <svg
            className={["h-5 w-5 shrink-0 transition-transform duration-300", collapsed ? "rotate-180" : ""].join(" ")}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
          </svg>
          {!collapsed && <span className="truncate">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
