"use client";

// components/page/learner/profile/ReviewAudioButton.tsx
// Lightweight play/pause audio button for the review detail (no scrubber, per
// review.js audioButton/toggleAudio). Only one button plays at a time: the
// parent tracks the active id and pauses the rest.

import { useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import { practiceAudioUrl } from "@/lib/gcs";
import type { PracticeCategory } from "@/lib/types/types";

interface Props {
  id: string;
  audioKey: string;
  level: number | string;
  category: PracticeCategory;
  activeId: string | null;
  onActivate: (id: string | null) => void;
}

export function ReviewAudioButton({
  id,
  audioKey,
  level,
  category,
  activeId,
  onActivate,
}: Props) {
  const ref = useRef<HTMLAudioElement>(null);
  const isActive = activeId === id;

  // Pause + rewind whenever another button becomes the active one.
  useEffect(() => {
    const el = ref.current;
    if (!el || isActive) return;
    el.pause();
    el.currentTime = 0;
  }, [isActive]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => onActivate(null));
      onActivate(id);
    } else {
      el.pause();
      onActivate(null);
    }
  };

  return (
    <div className="q-audio">
      <button type="button" className="q-audio-btn" onClick={toggle}>
        <FontAwesomeIcon icon={isActive ? faPause : faPlay} />
      </button>
      <audio
        ref={ref}
        src={practiceAudioUrl(audioKey, level, category)}
        preload="none"
        onEnded={() => onActivate(null)}
      />
    </div>
  );
}
