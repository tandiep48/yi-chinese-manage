"use client";

// components/page/learner/dashboard/ReviewCard.tsx
// The dashboard's static entry point into vocabulary review. Shown whatever the
// session state, matching the legacy page.

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate, faPlay } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";

export function ReviewCard() {
  const { t } = useT();
  return (
    <div className="card review-card">
      <div className="tag text-primary">
        <FontAwesomeIcon icon={faArrowsRotate} /> {t("dashboard.review_kicker")}
      </div>
      <h2>{t("dashboard.review_title")}</h2>
      <p className="description">{t("dashboard.review_subtitle")}</p>

      <Link className="btn btn-primary w-100 mt-auto" href="/learner/vocab-review">
        {t("dashboard.review_button")} <FontAwesomeIcon icon={faPlay} />
      </Link>
    </div>
  );
}
