"use client";

// components/layout/TopNav.tsx
// Shared top navigation bar for the learner-facing pages.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

interface NavItem {
  labelKey: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.dashboard", href: "/" },
  { labelKey: "nav.hsk", href: "/hsk" },
  { labelKey: "nav.vocabulary", href: "/vocab" },
  { labelKey: "nav.recommend", href: "/recommend" },
  { labelKey: "nav.practice", href: "/practice" },
  { labelKey: "nav.exam", href: "/exam" },
  { labelKey: "nav.learn_together", href: "/learn-together" },
];

const RIGHT_ITEMS: NavItem[] = [
  { labelKey: "nav.profile", href: "/profile" },
  { labelKey: "nav.login", href: "/login" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function TopNav() {
  const pathname = usePathname();
  const { t } = useT();

  const linkClass = (href: string) =>
    [
      "rounded-lg px-3 py-2 text-sm font-bold text-white transition-colors",
      isActive(pathname, href)
        ? "bg-white/20"
        : "hover:bg-white/15",
    ].join(" ");

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 bg-[#007a61] px-4 py-2.5 text-white shadow-sm">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 pr-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-sm font-bold text-white">
          易
        </span>
        <span className="hidden text-sm font-extrabold text-white sm:block">Yi Chinese</span>
      </Link>

      {/* Primary nav */}
      <nav className="flex flex-1 flex-wrap items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className={linkClass(item.href)}>
            {t(item.labelKey)}
          </Link>
        ))}
      </nav>

      {/* Account nav */}
      <nav className="flex items-center gap-1">
        {RIGHT_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className={linkClass(item.href)}>
            {t(item.labelKey)}
          </Link>
        ))}
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
