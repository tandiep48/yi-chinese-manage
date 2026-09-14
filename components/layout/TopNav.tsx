"use client";

// components/layout/TopNav.tsx
// Shared top navigation bar for the learner-facing pages.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/i18n/I18nProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { HanziSettingsControl } from "@/components/han/HanziSettingsControl";
import { useAuth } from "@/components/auth/AuthProvider";

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

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function TopNav() {
  const pathname = usePathname();
  const { t } = useT();
  const { user, loading, logout } = useAuth();

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
        {loading ? null : user ? (
          <>
            {/* Avatar + name, like site_nav.html's #site-user-link. The image comes
                from the shared auth user, so an upload on the profile page shows here
                immediately. */}
            <Link
              href="/profile"
              className={`${linkClass("/profile")} flex items-center gap-2`}
            >
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- GCS-hosted, arbitrary host
                <img
                  src={user.avatar_url}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-xs font-bold">
                  {user.username.slice(0, 1).toUpperCase()}
                </span>
              )}
              {user.username}
            </Link>
            <button
              type="button"
              id="topnav-logout-btn"
              onClick={() => logout()}
              className="rounded-lg px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-white/15"
            >
              {t("nav.logout")}
            </button>
            <HanziSettingsControl />
          </>
        ) : (
          <>
            <Link href="/login" className={linkClass("/login")}>
              {t("nav.login")}
            </Link>
            <Link href="/register" className={linkClass("/register")}>
              {t("nav.register")}
            </Link>
          </>
        )}
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
