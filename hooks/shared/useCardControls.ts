"use client";

// hooks/shared/useCardControls.ts
// Keyboard-driven controls shared by the vocab FlashcardView and the lesson
// LessonCardStudy. Pinyin + meaning start hidden and reset to hidden on each new
// card; the learner drives everything from the keyboard:
//   A prev · D next · S show/hide pinyin+meaning · W reveal + play audio
//   Space shuffle (when onShuffle is given) · Q stroke order (when onStroke is given)
// S toggles so the text can be hidden again (a listening/recall self-check); W always
// reveals, since it also plays the audio. Keys are ignored while a text field is
// focused (the typing self-check) and when a modifier is held, so browser shortcuts
// still work.

import { useCallback, useEffect, useRef, useState } from "react";

export interface CardControls {
  revealed: boolean;
  // Force the text shown (the W / audio-reveal button, which also plays audio).
  reveal: () => void;
  // Show or hide the text (the S button): lets the learner hide it again.
  toggleReveal: () => void;
}

export function useCardControls({
  resetKey,
  onPrev,
  onNext,
  onPlayAudio,
  onShuffle,
  onStroke,
}: {
  // Changes whenever the visible card changes (the index, or the word), which hides
  // pinyin + meaning again for the new card.
  resetKey: unknown;
  onPrev: () => void;
  onNext: () => void;
  onPlayAudio: () => void;
  onShuffle?: () => void;
  onStroke?: () => void;
}): CardControls {
  const [revealed, setRevealed] = useState(false);
  const reveal = useCallback(() => setRevealed(true), []);
  const toggleReveal = useCallback(() => setRevealed((r) => !r), []);

  // Reset reveal when the card changes (render-phase, matching the sibling typing
  // resets in FlashcardView / LessonCardStudy).
  const [prevKey, setPrevKey] = useState(resetKey);
  if (resetKey !== prevKey) {
    setPrevKey(resetKey);
    setRevealed(false);
  }

  // Latest callbacks in a ref so the key listener binds once and never goes stale.
  const handlers = useRef({ onPrev, onNext, onPlayAudio, onShuffle, onStroke });
  useEffect(() => {
    handlers.current = { onPrev, onNext, onPlayAudio, onShuffle, onStroke };
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const h = handlers.current;
      switch (e.key.toLowerCase()) {
        case "a":
          h.onPrev();
          break;
        case "d":
          h.onNext();
          break;
        case "w":
          setRevealed(true);
          h.onPlayAudio();
          break;
        case "s":
          setRevealed((r) => !r);
          break;
        case " ":
          if (h.onShuffle) {
            e.preventDefault();
            h.onShuffle();
          }
          break;
        case "q":
          h.onStroke?.();
          break;
        default:
          break;
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return { revealed, reveal, toggleReveal };
}
