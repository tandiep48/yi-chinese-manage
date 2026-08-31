"use client";

// components/page/learner/LearningTabs.tsx
// HSK / Books tab bar shared by the learning-page routes. Ported from the
// .learning-tabs markup + switchLearningTab() in Learning/web_app's
// learning.html / learning.js. In this app the two tabs are routes (/hsk and
// /books) rather than in-page panels, so active state follows the pathname.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/i18n/I18nProvider";

export function LearningTabs() {
  const { t } = useT();
  const pathname = usePathname();
  const onBooks = pathname.startsWith("/books");

  return (
    <div className="learning-tabs" role="tablist">
      <Link
        href="/hsk"
        role="tab"
        aria-selected={!onBooks}
        className={`learning-tab${onBooks ? "" : " active"}`}
      >
        {t("books.tab_hsk")}
      </Link>
      <Link
        href="/books"
        role="tab"
        aria-selected={onBooks}
        className={`learning-tab${onBooks ? " active" : ""}`}
      >
        {t("books.tab_books")}
      </Link>
    </div>
  );
}
