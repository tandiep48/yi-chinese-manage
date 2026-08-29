"use client";

// components/page/learner/pinyin/AdvancedPinyinTable.tsx
// The advanced pinyin chart: the full initial×final matrix (3 tables). Click any
// syllable to open a popover of its four tones; click a tone to hear it. Ported
// from Learning/web_app/templates/lesson/advanced_pinyin.html + pinyin.js.

import { useCallback, useEffect, useRef, useState } from "react";
import { ADVANCED_PINYIN, getTones, playTone } from "@/lib/lessons/pinyin";

interface PopoverState {
  syllable: string;
  top: number;
  left: number;
}

export function AdvancedPinyinTable() {
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setPopover(null), []);

  const openFor = useCallback(
    (syllable: string, el: HTMLElement) => {
      setPopover((prev) => {
        if (prev?.syllable === syllable) return null; // toggle off
        const rect = el.getBoundingClientRect();
        return { syllable, top: rect.bottom, left: rect.left };
      });
    },
    []
  );

  // Close when clicking anywhere outside the popover or a trigger, or on Escape.
  useEffect(() => {
    if (!popover) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".pinyin-popover") && !target.closest(".btn-pinyin")) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [popover, close]);

  const { initials, tables } = ADVANCED_PINYIN;

  return (
    <div className="pinyin-advanced">
      {tables.map((rows, ti) => (
        <div className="pinyin-table-wrap" key={ti}>
          <table className="pinyin-advanced-table">
            <thead>
              <tr>
                <th className="pinyin-corner" aria-hidden="true">
                  &nbsp;
                </th>
                <th className="pinyin-corner" aria-hidden="true">
                  &nbsp;
                </th>
                {initials.map((ini) => (
                  <th key={ini}>{ini}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.final}>
                  <td className="pinyin-final-head">{row.final}</td>
                  {row.cells.map((syl, ci) =>
                    syl ? (
                      <td className="pinyin-cell" key={ci}>
                        <span
                          className="btn-pinyin"
                          role="button"
                          tabIndex={0}
                          onClick={(e) => openFor(syl, e.currentTarget)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openFor(syl, e.currentTarget);
                            }
                          }}
                        >
                          {syl}
                        </span>
                      </td>
                    ) : (
                      <td className="pinyin-cell" key={ci} aria-hidden="true" />
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {popover && (
        <div
          ref={popoverRef}
          className="pinyin-popover"
          style={{ top: popover.top, left: popover.left }}
        >
          {getTones(popover.syllable).map((tone) => (
            <button
              type="button"
              key={tone}
              className="tone-button"
              onClick={() => {
                playTone(tone);
                close();
              }}
            >
              {tone}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
