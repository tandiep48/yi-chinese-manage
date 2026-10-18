"use client";

// components/page/learner/LearningTabs.tsx
// The learning-page tab bar. Ported from the .learning-tabs markup +
// switchLearningTab() in Learning/web_app's learning.html / learning.js, extended
// so Practice and Exam are tabs here rather than separate sidebar entries. Each tab
// is a route, so the active one follows the pathname.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/i18n/I18nProvider";
import "./learning-tabs.css";

export function LearningTabs() {
  const { t } = useT();
  const pathname = usePathname();

  const tabs = [
    { href: "/learner/hsk", label: t("books.tab_hsk") },
    { href: "/learner/books", label: t("books.tab_books") },
    { href: "/learner/practice", label: t("nav.practice") },
    { href: "/learner/exam", label: t("nav.exam") },
  ];

  // The four routes are distinct prefixes, so a startsWith match also lights the
  // tab up on their sub-routes (e.g. /learner/practice/3).
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <div className="learning-tabs" role="tablist">
      {tabs.map((tab) => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={`learning-tab${active ? " active" : ""}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
