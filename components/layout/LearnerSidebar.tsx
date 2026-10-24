"use client";

// components/layout/LearnerSidebar.tsx
// Learner-facing navigation.
//   - md and up: a persistent left rail that lives in the page flow (so the main
//     column sits beside it) and toggles between a full width (icon + label) and
//     an icon-only rail. The collapsed choice is remembered per browser.
//   - below md: the rail slides off-canvas; a small floating hamburger opens it as
//     a drawer over the content (a backdrop dims the page) and the drawer's close
//     button or the backdrop dismisses it.
// The logo lives inside the rail. The hanzi script / font / language controls open
// in a settings modal (LearnerSettingsModal).

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "./learner-nav.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGaugeHigh,
  faLayerGroup,
  faBook,
  faStar,
  faUsers,
  faGear,
  faRightFromBracket,
  faRightToBracket,
  faUserPlus,
  faBars,
  faXmark,
  faChevronLeft,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useT } from "@/components/i18n/I18nProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLearnerSession } from "./LearnerSessionContext";
import { LearnerSettingsModal } from "./LearnerSettingsModal";

interface NavItem {
  labelKey: string;
  href: string;
  icon: IconDefinition;
}

const LEARNER_HOME = "/learner";
const COLLAPSED_KEY = "learnerNavCollapsed";

// Practice and Exam are not here: they live as tabs on the learning page
// (LearningTabs) alongside HSK and Books.
const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.dashboard", href: LEARNER_HOME, icon: faGaugeHigh },
  { labelKey: "nav.hsk", href: "/learner/hsk", icon: faLayerGroup },
  { labelKey: "nav.vocabulary", href: "/learner/vocab", icon: faBook },
  { labelKey: "nav.recommend", href: "/learner/recommend", icon: faStar },
  { labelKey: "nav.learn_together", href: "/learner/learn-together", icon: faUsers },
];

// The learner home is "/learner", a prefix of every other learner route, so it
// only counts as active on an exact match.
function isActive(pathname: string, href: string): boolean {
  return href === LEARNER_HOME ? pathname === LEARNER_HOME : pathname.startsWith(href);
}

export function LearnerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useT();
  const { user, loading, logout } = useAuth();
  const { active: sessionActive } = useLearnerSession();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // The nav target a leave-confirm is waiting on, while a home activity is running.
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Restore the collapsed choice after mount. It can't be read during render —
  // localStorage is client-only and would diverge from the server-rendered
  // (expanded) markup — so this is a deliberate one-time sync, not a
  // render-driving effect. Per-viewer only, wrapped for private / blocked storage.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(COLLAPSED_KEY) === "1") setCollapsed(true);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* storage unavailable */
      }
      return next;
    });

  const closeDrawer = () => setDrawerOpen(false);

  // Primary-nav clicks while a home activity is running: hold the navigation and ask
  // first, so a stray click doesn't abandon the session (and so the home panel's
  // unmount cleanup can't bounce the learner back — see useLearnerHome). Confirming
  // navigates straight to the target in one step.
  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (sessionActive) {
      e.preventDefault();
      closeDrawer();
      setPendingHref(href);
      return;
    }
    closeDrawer();
  };

  const confirmLeave = () => {
    const href = pendingHref;
    setPendingHref(null);
    if (href) router.push(href);
  };

  // Collapse only ever hides labels / centers icons at md and up; the mobile
  // drawer is always full width, so its labels stay visible regardless.
  const hideLabel = collapsed ? "md:hidden" : "";
  const rowCls = (active: boolean) =>
    [
      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
      collapsed ? "md:justify-center" : "",
      active ? "bg-white/20 text-white" : "text-white/90 hover:bg-white/15",
    ].join(" ");

  return (
    <>
      {/* Floating hamburger (mobile only): opens the drawer. Hidden while the
          drawer is open — the drawer's own close button takes over. */}
      {!drawerOpen && (
        <button
          type="button"
          aria-label={t("nav.open_menu")}
          onClick={() => setDrawerOpen(true)}
          className="fixed left-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-md hover:brightness-110 md:hidden"
          style={{ backgroundColor: "var(--learner-nav)" }}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
      )}

      {/* Backdrop behind the open drawer (mobile only). */}
      {drawerOpen && <div className="learner-drawer-backdrop md:hidden" onClick={closeDrawer} />}

      <aside
        className={[
          "z-40 flex flex-col text-white shadow-lg transition-all duration-300 ease-in-out",
          // Mobile: off-canvas fixed drawer.
          "fixed inset-y-0 left-0 w-64",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: in-flow persistent rail whose width toggles.
          "md:static md:z-auto md:h-full md:translate-x-0 md:shrink-0",
          collapsed ? "md:w-16" : "md:w-64",
        ].join(" ")}
        style={{ backgroundColor: "var(--learner-nav)" }}
      >
        {/* Drawer close (mobile only) — the brand logo was removed, so on desktop
            the rail starts straight at the nav and this row collapses away. */}
        <div className="flex items-center justify-end px-4 py-4 md:hidden">
          <button
            type="button"
            aria-label={t("widgets.close")}
            onClick={closeDrawer}
            className="rounded-lg px-2 py-1.5 hover:bg-white/15"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Collapse toggle — desktop rail only, sitting above the nav; the mobile
            drawer uses its own close button instead. */}
        <div className="hidden px-2 pt-2 md:block">
          <button
            type="button"
            aria-label={collapsed ? t("nav.expand_menu") : t("nav.collapse_menu")}
            onClick={toggleCollapsed}
            className={`${rowCls(false)} w-full`}
          >
            <FontAwesomeIcon
              icon={faChevronLeft}
              className={`h-4 w-4 shrink-0 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
              fixedWidth
            />
            <span className={`truncate ${hideLabel}`}>{t("nav.collapse_menu")}</span>
          </button>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              title={collapsed ? t(item.labelKey) : undefined}
              className={rowCls(isActive(pathname, item.href))}
            >
              <FontAwesomeIcon icon={item.icon} className="h-4 w-4 shrink-0" fixedWidth />
              <span className={`truncate ${hideLabel}`}>{t(item.labelKey)}</span>
            </Link>
          ))}
        </nav>

        {/* Account + settings — ordered username, settings, logout. */}
        <div className="space-y-1 border-t border-white/15 px-2 py-2">
          {loading ? null : user ? (
            <Link
              href="/learner/profile"
              onClick={closeDrawer}
              title={collapsed ? user.username : undefined}
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
              <span className={`truncate ${hideLabel}`}>{user.username}</span>
            </Link>
          ) : (
            <>
              <Link
                href="/learner/login"
                onClick={closeDrawer}
                title={collapsed ? t("nav.login") : undefined}
                className={rowCls(isActive(pathname, "/learner/login"))}
              >
                <FontAwesomeIcon icon={faRightToBracket} className="h-4 w-4 shrink-0" fixedWidth />
                <span className={`truncate ${hideLabel}`}>{t("nav.login")}</span>
              </Link>
              <Link
                href="/learner/register"
                onClick={closeDrawer}
                title={collapsed ? t("nav.register") : undefined}
                className={rowCls(isActive(pathname, "/learner/register"))}
              >
                <FontAwesomeIcon icon={faUserPlus} className="h-4 w-4 shrink-0" fixedWidth />
                <span className={`truncate ${hideLabel}`}>{t("nav.register")}</span>
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              closeDrawer();
              setSettingsOpen(true);
            }}
            title={collapsed ? t("nav.settings") : undefined}
            className={`${rowCls(false)} w-full`}
          >
            <FontAwesomeIcon icon={faGear} className="h-4 w-4 shrink-0" fixedWidth />
            <span className={`truncate ${hideLabel}`}>{t("nav.settings")}</span>
          </button>

          {!loading && user && (
            <button
              type="button"
              id="topnav-logout-btn"
              onClick={() => {
                closeDrawer();
                logout();
              }}
              title={collapsed ? t("nav.logout") : undefined}
              className={`${rowCls(false)} w-full`}
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4 shrink-0" fixedWidth />
              <span className={`truncate ${hideLabel}`}>{t("nav.logout")}</span>
            </button>
          )}
        </div>
      </aside>

      <LearnerSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {pendingHref && (
        <div
          className="learner-nav-guard"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPendingHref(null);
          }}
        >
          <div
            className="learner-nav-guard-box"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="learner-nav-guard-title"
          >
            <h2 id="learner-nav-guard-title" className="learner-nav-guard-title">
              {t("nav.leave_session_title")}
            </h2>
            <p className="learner-nav-guard-body">{t("nav.leave_session_body")}</p>
            <div className="learner-nav-guard-actions">
              <button
                type="button"
                className="learner-nav-guard-stay"
                onClick={() => setPendingHref(null)}
              >
                {t("nav.leave_session_stay")}
              </button>
              <button type="button" className="learner-nav-guard-leave" onClick={confirmLeave}>
                {t("nav.leave_session_leave")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
