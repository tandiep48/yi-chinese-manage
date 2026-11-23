"use client";

// components/page/learner/support/SupportWidget.tsx
// Floating "Help" button + panel for signed-in learners: report a mistake in an item
// or ask a question, and read the replies from our editors.

import { useState } from "react";
import "./support.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faCircleQuestion, faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { useT } from "@/components/i18n/I18nProvider";
import { useSupportPanel } from "@/hooks/support/useSupportPanel";
import { useSupport } from "./SupportContext";

export function SupportWidget() {
  const { user } = useAuth();
  const { t } = useT();
  const { isOpen, prefill, openSupport, closeSupport } = useSupport();
  const panel = useSupportPanel(isOpen && !!user, prefill);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");

  if (!user) return null;

  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await panel.submitNew(subject.trim(), body.trim())) {
      setSubject("");
      setBody("");
    }
  };

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await panel.sendReply(reply.trim())) setReply("");
  };

  return (
    <div className="support-widget">
      {isOpen && (
        <section className="support-panel" role="dialog" aria-label={t("support.title")}>
          <header className="support-head">
            {panel.view !== "list" && (
              <button type="button" className="support-icon-btn" onClick={panel.showList} aria-label={t("support.back")}>
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
            )}
            <h2>{panel.view === "thread" && panel.ticket ? panel.ticket.subject : t("support.title")}</h2>
            <button type="button" className="support-icon-btn" onClick={closeSupport} aria-label={t("support.close")}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </header>

          <div className="support-body">
            {panel.view === "list" && (
              <>
                <button type="button" className="support-primary" onClick={panel.showNew}>
                  <FontAwesomeIcon icon={faPlus} /> {t("support.new")}
                </button>
                {panel.loading && panel.tickets.length === 0 && (
                  <p className="support-muted">{t("support.loading")}</p>
                )}
                {!panel.loading && panel.tickets.length === 0 && (
                  <p className="support-muted">{t("support.empty")}</p>
                )}
                <ul className="support-list">
                  {panel.tickets.map((tk) => (
                    <li key={tk.id}>
                      <button type="button" onClick={() => panel.openTicket(tk.id)}>
                        <span className="support-subject">{tk.subject}</span>
                        <span className={`support-status ${tk.status}`}>
                          {t(`support.status_${tk.status}`)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {panel.view === "new" && (
              <form onSubmit={submitNew} className="support-form">
                {prefill && (
                  <p className="support-chip">
                    {t("support.about_item", { item: prefill.label ?? `${prefill.item_type} #${prefill.item_id}` })}
                  </p>
                )}
                <label htmlFor="support-subject">{t("support.subject")}</label>
                <input
                  id="support-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("support.subject_placeholder")}
                  maxLength={200}
                  required
                />
                <label htmlFor="support-message">{t("support.message")}</label>
                <textarea
                  id="support-message"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={t("support.message_placeholder")}
                  maxLength={2000}
                  rows={5}
                  required
                />
                <button type="submit" className="support-primary" disabled={panel.sending}>
                  {panel.sending ? t("support.sending") : t("support.send")}
                </button>
              </form>
            )}

            {panel.view === "thread" && (
              <>
                {panel.loading && !panel.ticket && <p className="support-muted">{t("support.loading")}</p>}
                {panel.ticket && (
                  <>
                    <ul className="support-thread">
                      {panel.ticket.messages.map((m) => (
                        <li key={m.id} className={m.is_staff ? "staff" : "mine"}>
                          <span className="support-who">{m.is_staff ? t("support.staff") : t("support.you")}</span>
                          <p>{m.body}</p>
                        </li>
                      ))}
                    </ul>
                    <form onSubmit={submitReply} className="support-reply">
                      <textarea
                        aria-label={t("support.reply")}
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder={t("support.reply_placeholder")}
                        maxLength={2000}
                        rows={2}
                        required
                      />
                      <button type="submit" className="support-primary" disabled={panel.sending}>
                        {t("support.reply")}
                      </button>
                    </form>
                  </>
                )}
              </>
            )}

            {panel.error && (
              <p role="alert" className="support-error">
                {t("support.failed")}
              </p>
            )}
          </div>
        </section>
      )}

      <button
        type="button"
        className="support-fab"
        onClick={() => (isOpen ? closeSupport() : openSupport())}
        aria-expanded={isOpen}
      >
        <FontAwesomeIcon icon={faCircleQuestion} /> <span>{t("support.button")}</span>
      </button>
    </div>
  );
}
