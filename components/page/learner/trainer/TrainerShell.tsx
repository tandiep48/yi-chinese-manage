"use client";

// components/page/learner/trainer/TrainerShell.tsx
// Shared chrome for the learner trainers (vocab batch + lesson), porting
// Learning/web_app/templates/shared/trainer_base.html: the loading / training /
// complete screens, the topbar subtitle, progress bar + task counter, the task
// card, the sticky bottom bar (Quit + a per-activity primary action), and the
// quit-confirm modal.
//
// The bottom bar's primary action (Check / Continue / Next) is supplied by whatever
// activity is on screen — mirroring the legacy mountBottomAction(). The activity
// renders its button into the action slot via a portal (useTrainerActionSlot),
// which keeps the button's state local to the activity while it lives in the bar.

import { createContext, useContext, useState, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";

const ActionSlotContext = createContext<HTMLElement | null>(null);

// Portal target for an activity's primary action button, or null before the
// bottom bar has mounted.
export function useTrainerActionSlot(): HTMLElement | null {
  return useContext(ActionSlotContext);
}

// Publishes an action slot for callers that host the activities outside this shell —
// Learn Together mounts them in its own action bar (the legacy mountAction hook).
export function TrainerActionSlotProvider({
  slot,
  children,
}: {
  slot: HTMLElement | null;
  children: ReactNode;
}) {
  return <ActionSlotContext.Provider value={slot}>{children}</ActionSlotContext.Provider>;
}

export type TrainerScreen = "loading" | "training" | "complete";

interface TrainerShellProps {
  screen: TrainerScreen;
  loadingText?: string;
  // Training header
  subtitle?: string;
  progress?: number; // 0..1
  counterText?: string;
  // Called when the learner confirms Quit in the modal.
  onQuit: () => void;
  // Training-screen task content.
  children?: ReactNode;
  // Complete-screen content.
  complete?: ReactNode;
  // Extra class on the shell root (e.g. per-trainer theme scope).
  scopeClass?: string;
  // Icon in the quit modal (the lesson trainer shows a warning triangle).
  quitIcon?: boolean;
}

export function TrainerShell({
  screen,
  loadingText,
  subtitle,
  progress = 0,
  counterText,
  onQuit,
  children,
  complete,
  scopeClass = "vocab-trainer",
  quitIcon = false,
}: TrainerShellProps) {
  const { t } = useT();
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [quitOpen, setQuitOpen] = useState(false);

  return (
    <ActionSlotContext.Provider value={slot}>
      <div className={`trainer-shell ${scopeClass}`}>
        <div className="app-container">
          <div className={`screen trainer-loading-screen${screen === "loading" ? " active" : ""}`}>
            <div className="loader" />
            <p>{loadingText ?? t("trainer.loading")}</p>
          </div>

          <div className={`screen${screen === "training" ? " active" : ""}`}>
            <div className="trainer-topbar">
              <div className="trainer-subtitle">{subtitle}</div>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
              />
            </div>
            <div className="task-counter">{counterText}</div>

            <div className="task-card">{screen === "training" ? children : null}</div>

            <div className="trainer-bottom-bar">
              <button
                type="button"
                className="btn secondary trainer-quit-btn"
                onClick={() => setQuitOpen(true)}
              >
                <FontAwesomeIcon icon={faRightFromBracket} aria-hidden />
                <span>{t("trainer.quit_session_btn")}</span>
              </button>
              <div className="trainer-action-slot" ref={setSlot} />
            </div>
          </div>

          <div className={`screen trainer-complete-screen${screen === "complete" ? " active" : ""}`}>
            {screen === "complete" ? complete : null}
          </div>
        </div>

        <div
          className={`quit-modal-overlay${quitOpen ? " open" : ""}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setQuitOpen(false);
          }}
        >
          <div className="quit-modal">
            {quitIcon && (
              <div className="quit-modal-icon" aria-hidden>
                <FontAwesomeIcon icon={faTriangleExclamation} />
              </div>
            )}
            <h3>{t("trainer.quit_modal_title")}</h3>
            <p dangerouslySetInnerHTML={{ __html: t("trainer.quit_modal_body") }} />
            <div className="quit-modal-btns">
              <button type="button" className="btn secondary" onClick={() => setQuitOpen(false)}>
                {t("trainer.cancel")}
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => {
                  setQuitOpen(false);
                  onQuit();
                }}
              >
                {t("trainer.yes_quit")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ActionSlotContext.Provider>
  );
}
