"use client";

// components/page/learner/trainer/SuccessPopup.tsx
// Celebration popup shown at the end of a training round, ported from
// Learning/web_app/static/shared/success_popup.js (+ success_popup.css): tasks /
// correct / accuracy stats, a confetti burst on a perfect score, auto-close after
// 3s, and click-anywhere to continue to the recap.

import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import "./overlays.css";

const CONFETTI_COLORS = ["#4ade80", "#818cf8", "#f472b6", "#facc15", "#38bdf8", "#fb923c"];

interface Particle {
  x: number;
  y: number;
  r: number;
  color: string;
  speed: number;
  drift: number;
  rot: number;
  spin: number;
  shape: "rect" | "circle";
}

export function SuccessPopup({
  open,
  total,
  correct,
  onContinue,
}: {
  open: boolean;
  total: number;
  correct: number;
  onContinue: () => void;
}) {
  const { t } = useT();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);

  const missed = total - correct;
  const isPerfect = missed === 0 && total > 0;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  useEffect(() => {
    if (!open) return;

    // Auto-close after 3s, exactly like the legacy popup.
    const timer = window.setTimeout(onContinue, 3000);

    // Confetti only on a perfect score.
    if (isPerfect && canvasRef.current && cardRef.current) {
      const canvas = canvasRef.current;
      const W = cardRef.current.clientWidth;
      const H = cardRef.current.clientHeight;
      canvas.width = W;
      canvas.height = H;
      const particles: Particle[] = Array.from({ length: 80 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H * -0.5,
        r: Math.random() * 5 + 3,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        speed: Math.random() * 2.5 + 1.2,
        drift: (Math.random() - 0.5) * 1.5,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.15,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      }));

      const ctx = canvas.getContext("2d");
      const tick = () => {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        particles.forEach((p) => {
          p.y += p.speed;
          p.x += p.drift;
          p.rot += p.spin;
          if (p.y < canvas.height + 10) alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height);
          if (p.shape === "rect") ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
          else {
            ctx.beginPath();
            ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        });
        if (alive) frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    }

    return () => {
      window.clearTimeout(timer);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="success-popup-overlay open" onClick={onContinue}>
      <div className="success-popup" ref={cardRef} onClick={(e) => e.stopPropagation()}>
        <canvas className="sp-confetti-canvas" ref={canvasRef} />
        <div className={`sp-icon-wrap ${isPerfect ? "perfect" : "has-missed"}`}>
          <FontAwesomeIcon icon={isPerfect ? faTrophy : faCircleCheck} />
        </div>
        <h2 className="sp-title">
          {isPerfect ? t("success_popup.perfect_title") : t("success_popup.complete_title")}
        </h2>
        <div className="sp-stats">
          <div className="sp-stat">
            <div className="sp-stat-value">{total}</div>
            <div className="sp-stat-label">{t("success_popup.stat_tasks")}</div>
          </div>
          <div className="sp-stat">
            <div className="sp-stat-value correct">{correct}</div>
            <div className="sp-stat-label">{t("success_popup.stat_correct")}</div>
          </div>
          <div className="sp-stat">
            <div className="sp-stat-value accuracy">{accuracy}%</div>
            <div className="sp-stat-label">{t("success_popup.stat_accuracy")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
