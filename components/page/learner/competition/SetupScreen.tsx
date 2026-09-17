"use client";

// components/page/learner/competition/SetupScreen.tsx
// The Learn Together setup screen: the create-room form (mode, skill types, source ->
// lesson -> part multi-selects, capacity, time limit) beside the join-by-code panel.
// Ported from the #screen-setup section of
// Learning/web_app/templates/competition/learn_together.html.
//
// The source picker is mode-dependent and mutually exclusive: book rooms pick from the
// host's saved books, every other mode picks HSK levels.

import { useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { MultiSelect } from "@/components/shared/customer_ui/MultiSelect/MultiSelect";
import { HSK_LEVELS } from "@/lib/competition/roomLogic";
import { TIMEOUT_OPTIONS, type CompetitionSetup } from "@/hooks/useCompetitionSetup";
import type { CompetitionCategory } from "@/lib/types/competition";
import "./competition-multiselect.css";

export function SetupScreen({
  setup,
  editing,
  error,
  onSubmit,
  onCancelEdit,
  onJoin,
}: {
  setup: CompetitionSetup;
  editing: boolean;
  error: string;
  onSubmit: () => void;
  onCancelEdit: () => void;
  onJoin: (code: string) => void;
}) {
  const { t } = useT();
  const [joinCode, setJoinCode] = useState("");

  const levelOptions = HSK_LEVELS.map((n) => ({ value: String(n), label: `HSK ${n}` }));
  const countLabel = (n: number) => t("vocab.n_selected", { n });

  return (
    <section className="competition-screen active">
      <div className="competition-header">
        <h1>{t("nav.learn_together")}</h1>
        <p className="subtitle">{t("competition.subtitle")}</p>
      </div>

      <div className="competition-setup-grid">
        <section className="competition-panel">
          <h2>{editing ? t("competition.edit_settings") : t("competition.create_room")}</h2>
          <div className="competition-form">
            <label>
              {t("competition.mode")}
              <select
                value={setup.mode}
                onChange={(e) => void setup.setMode(e.target.value as CompetitionCategory)}
              >
                <option value="vocab">{t("competition.mode_vocab")}</option>
                <option value="lesson">{t("competition.mode_lesson")}</option>
                <option value="book">{t("competition.mode_book")}</option>
              </select>
            </label>

            {setup.isBook && (
              <label>
                {t("competition.book")}
                <MultiSelect
                  options={setup.bookOptions}
                  values={setup.books}
                  onChange={(v) => void setup.setBooks(v)}
                  placeholder={t("competition.select_book")}
                  selectAllLabel={t("vocab.select_all")}
                  renderCount={countLabel}
                />
              </label>
            )}

            <label>
              {t("competition.type")}
              <MultiSelect
                options={setup.typeOptions}
                values={setup.types}
                onChange={setup.setTypes}
                placeholder={t("competition.type_all")}
                selectAllLabel={t("competition.type_all")}
                renderCount={countLabel}
              />
            </label>

            {!setup.isBook && (
              <label>
                HSK
                <MultiSelect
                  options={levelOptions}
                  values={setup.levels}
                  onChange={(v) => void setup.setLevels(v)}
                  placeholder={t("vocab.select_hsk")}
                  selectAllLabel={t("vocab.select_all")}
                  renderCount={countLabel}
                />
              </label>
            )}

            <label>
              {t("picker.lesson_prefix")}
              <MultiSelect
                options={setup.lessonOptions}
                values={setup.lessonKeys}
                onChange={setup.setLessonKeys}
                placeholder={t("vocab.select_lesson_option")}
                selectAllLabel={t("vocab.select_all")}
                renderCount={countLabel}
              />
            </label>

            <label>
              {t("picker.part_prefix")}
              <MultiSelect
                options={setup.partOptions}
                values={setup.partIds}
                onChange={setup.setPartIds}
                placeholder={t("vocab.select_part_option")}
                selectAllLabel={t("vocab.select_all")}
                renderCount={countLabel}
              />
            </label>

            <label>
              {t("competition.max_users")}
              <input
                type="number"
                min={2}
                max={30}
                value={setup.maxUsers}
                onChange={(e) => setup.setMaxUsers(Number(e.target.value))}
              />
            </label>

            <label>
              {t("competition.time_limit")}
              <select
                value={setup.timeoutMinutes}
                onChange={(e) => setup.setTimeoutMinutes(Number(e.target.value))}
              >
                {TIMEOUT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {t("competition.minutes", { n })}
                  </option>
                ))}
              </select>
            </label>

            {error && <p className="competition-error">{error}</p>}

            <div className="competition-setup-actions">
              <button type="button" className="btn primary" onClick={onSubmit}>
                {editing ? t("competition.save_changes") : t("competition.create_room")}
              </button>
              {editing && (
                <button type="button" className="btn secondary" onClick={onCancelEdit}>
                  {t("competition.cancel")}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* The join panel is hidden while the host edits an existing room. */}
        {!editing && (
          <section className="competition-panel">
            <h2>{t("competition.join_room")}</h2>
            <div className="competition-form">
              <label>
                {t("competition.room_code")}
                <input
                  type="text"
                  maxLength={12}
                  placeholder="ABC123"
                  autoComplete="off"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onJoin(joinCode);
                  }}
                />
              </label>
              <button type="button" className="btn primary" onClick={() => onJoin(joinCode)}>
                {t("competition.join_room")}
              </button>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
