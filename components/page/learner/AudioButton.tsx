"use client";

// components/page/learner/AudioButton.tsx
// Minimal play/pause control for a single audio_key — used by both the
// Lesson Overview (passage lines) and Vocab Overview (word list).

import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";

export function AudioButton({ src, ariaLabel }: { src: string | null; ariaLabel: string }) {
  const { t } = useT();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  if (!src) {
    return (
      <span className="text-xs text-[var(--learner-text-muted)]">{t("reading.no_audio_available")}</span>
    );
  }

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.currentTime = 0;
      audio.play().catch(() => setPlaying(false));
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={ariaLabel}
      title={t("reading.play_audio")}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--learner-primary)]/10 text-[var(--learner-primary)] hover:bg-[var(--learner-primary)]/20 transition-colors"
    >
      <FontAwesomeIcon icon={playing ? faPause : faPlay} className="h-3.5 w-3.5" />
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
    </button>
  );
}
