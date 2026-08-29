"use client";

// components/page/learner/pinyin/PinyinGuideLayout.tsx
// Shared chrome for the two pinyin guides (HSK 1 Lesson 1): back link, heading,
// and the Basic / Advanced tab switcher. Ported from the header block shared by
// Learning/web_app/templates/lesson/{basic,advanced}_pinyin.html.

import Link from "next/link";
import { useT } from "@/components/i18n/I18nProvider";

export function PinyinGuideLayout({
  active,
  children,
}: {
  active: "basic" | "advanced";
  children: React.ReactNode;
}) {
  const { t } = useT();

  return (
    <div className="pinyin-guide mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-5">
        <Link href="/hsk/HSK1" className="text-sm font-semibold text-[var(--learner-primary)] hover:underline">
          ← {t("pinyin.back_to_lesson_select")}
        </Link>
      </div>

      <div className="mb-6 flex flex-col items-center">
        <h2 className="mb-2 text-center text-2xl font-bold text-[var(--learner-text)]">
          {t("pinyin.lesson_heading")}
        </h2>
        <nav className="pinyin-toggle">
          <Link href="/lesson/basic-pinyin" className={active === "basic" ? "active" : ""}>
            {t("pinyin.basic")}
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href="/lesson/advanced-pinyin" className={active === "advanced" ? "active" : ""}>
            {t("pinyin.advanced")}
          </Link>
        </nav>
      </div>

      {children}
    </div>
  );
}
