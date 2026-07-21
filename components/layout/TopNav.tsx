"use client";

// components/layout/TopNav.tsx
// Shared top navigation bar for the learner-facing pages.

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "HSK", href: "/hsk" },
  { label: "Recommend", href: "/recommend" },
  { label: "Practice", href: "/practice" },
  { label: "Exam", href: "/exam" },
  { label: "Learn Together", href: "/learn-together" },
];

const RIGHT_ITEMS: NavItem[] = [
  { label: "Profile", href: "/profile" },
  { label: "Login", href: "/login" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function TopNav() {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    [
      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isActive(pathname, href)
        ? "bg-indigo-50 text-indigo-600"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-800",
    ].join(" ");

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5 shadow-sm">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 pr-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold text-white shadow-sm">
          易
        </span>
        <span className="hidden text-sm font-bold text-slate-800 sm:block">Yi Chinese</span>
      </Link>

      {/* Primary nav */}
      <nav className="flex flex-1 flex-wrap items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className={linkClass(item.href)}>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Account nav */}
      <nav className="flex items-center gap-1">
        {RIGHT_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className={linkClass(item.href)}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
