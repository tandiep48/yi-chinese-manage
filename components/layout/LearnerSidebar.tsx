"use client";

// components/layout/LearnerSidebar.tsx
// Learner-facing navigation. A small floating hamburger button (top-left, over
// the page) opens an off-canvas drawer that slides in over the content (backdrop
// dims the page) and is dismissed by the backdrop or its close button. The logo
// lives inside the drawer. The hanzi script / font / language controls that used
// to sit inline in the old TopNav now open in a settings modal
// (LearnerSettingsModal).

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./learner-nav.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGaugeHigh,
  faLayerGroup,
  faBook,
  faStar,
  faDumbbell,
  faPenToSquare,
  faUsers,
  faGear,
  faRightFromBracket,
  faRightToBracket,
  faUserPlus,
  faBars,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useT } from "@/components/i18n/I18nProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { LearnerSettingsModal } from "./LearnerSettingsModal";

interface NavItem {
  labelKey: string;
  href: string;
  icon: IconDefinition;
}

const LEARNER_HOME = "/learner";

const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.dashboard", href: LEARNER_HOME, icon: faGaugeHigh },
  { labelKey: "nav.hsk", href: "/learner/hsk", icon: faLayerGroup },
  { labelKey: "nav.vocabulary", href: "/learner/vocab", icon: faBook },
  { labelKey: "nav.recommend", href: "/learner/recommend", icon: faStar },
  { labelKey: "nav.practice", href: "/learner/practice", icon: faDumbbell },
  { labelKey: "nav.exam", href: "/learner/exam", icon: faPenToSquare },
  { labelKey: "nav.learn_together", href: "/learner/learn-together", icon: faUsers },
];

// The learner home is "/learner", a prefix of every other learner route, so it
// only counts as active on an exact match.
function isActive(pathname: string, href: string): boolean {
  return href === LEARNER_HOME ? pathname === LEARNER_HOME : pathname.startsWith(href);
}

export function LearnerSidebar() {
  const pathname = usePathname();
  const { t } = useT();
  const { user, loading, logout } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const closeDrawer = () => setDrawerOpen(false);

  const rowCls = (active: boolean) =>
    [
      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
      active ? "bg-white/20 text-white" : "text-white/90 hover:bg-white/15",
    ].join(" ");

  return (
    <>
      {/* Floating hamburger: opens the drawer, sits over the page top-left.
          Hidden while the drawer is open (the drawer's own close button takes
          over). */}
      {!drawerOpen && (
        <button
          type="button"
          aria-label={t("nav.open_menu")}
          onClick={() => setDrawerOpen(true)}
          className="fixed left-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-md hover:brightness-110"
          style={{ backgroundColor: "var(--learner-nav)" }}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
      )}

      {/* Backdrop behind the open drawer. */}
      {drawerOpen && <div className="learner-drawer-backdrop" onClick={closeDrawer} />}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col text-white shadow-lg",
          "transition-transform duration-300 ease-in-out",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        style={{ backgroundColor: "var(--learner-nav)" }}
      >
        {/* Logo + close */}
        <div className="flex items-center gap-2 px-4 py-4">
          <Link href={LEARNER_HOME} className="flex flex-1 items-center gap-2 overflow-hidden" onClick={closeDrawer}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-sm font-bold">
              易
            </span>
            <span className="truncate text-sm font-extrabold">Yi Chinese</span>
          </Link>
          <button
            type="button"
            aria-label={t("widgets.close")}
            onClick={closeDrawer}
            className="rounded-lg px-2 py-1.5 hover:bg-white/15"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeDrawer}
              className={rowCls(isActive(pathname, item.href))}
            >
              <FontAwesomeIcon icon={item.icon} className="h-4 w-4 shrink-0" fixedWidth />
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          ))}
        </nav>

        {/* Account + settings */}
        <div className="space-y-1 border-t border-white/15 px-2 py-2">
          {loading ? null : user ? (
            <>
              <Link
                href="/learner/profile"
                onClick={closeDrawer}
                className={rowCls(isActive(pathname, "/learner/profile"))}
              >
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- GCS-hosted, arbitrary host
                  <img src={user.avatar_url} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/25 text-xs font-bold">
                    {user.username.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="truncate">{user.username}</span>
              </Link>
              <button
                type="button"
                id="topnav-logout-btn"
                onClick={() => {
                  closeDrawer();
                  logout();
                }}
                className={`${rowCls(false)} w-full`}
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4 shrink-0" fixedWidth />
                <span className="truncate">{t("nav.logout")}</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/learner/login"
                onClick={closeDrawer}
                className={rowCls(isActive(pathname, "/learner/login"))}
              >
                <FontAwesomeIcon icon={faRightToBracket} className="h-4 w-4 shrink-0" fixedWidth />
                <span className="truncate">{t("nav.login")}</span>
              </Link>
              <Link
                href="/learner/register"
                onClick={closeDrawer}
                className={rowCls(isActive(pathname, "/learner/register"))}
              >
                <FontAwesomeIcon icon={faUserPlus} className="h-4 w-4 shrink-0" fixedWidth />
                <span className="truncate">{t("nav.register")}</span>
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              closeDrawer();
              setSettingsOpen(true);
            }}
            className={`${rowCls(false)} w-full`}
          >
            <FontAwesomeIcon icon={faGear} className="h-4 w-4 shrink-0" fixedWidth />
            <span className="truncate">{t("nav.settings")}</span>
          </button>
        </div>
      </aside>

      <LearnerSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
