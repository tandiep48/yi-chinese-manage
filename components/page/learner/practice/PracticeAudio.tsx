"use client";

// components/page/learner/practice/PracticeAudio.tsx
// Single shared <audio> for a practice session — playing one control stops the
// others, matching the engine's activeAudioControl behavior. Provides a scrubber
// (elapsed — draggable progress — duration) with ±5s seek, ported from
// makeAudioBtn()/playAudio()/seekAudio() in practice_engine.js.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faStop, faBackward, faForward } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { practiceAudioUrl } from "@/lib/gcs";
import type { PracticeCategory } from "@/lib/types/practice";

interface AudioCtx {
  activeSrc: string;
  playing: boolean;
  currentTime: number;
  duration: number;
  toggle: (src: string) => void;
  seek: (src: string, delta: number) => void;
  seekTo: (src: string, seconds: number) => void;
  stop: () => void;
}

const Ctx = createContext<AudioCtx | null>(null);

export function PracticeAudioProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [activeSrc, setActiveSrc] = useState("");
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const stop = useCallback(() => {
    const el = ref.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
    }
    setActiveSrc("");
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const ensureSrc = useCallback((src: string) => {
    const el = ref.current;
    if (!el) return;
    if (el.src !== src) {
      el.src = src;
      setDuration(0);
      setCurrentTime(0);
    }
    setActiveSrc(src);
  }, []);

  const toggle = useCallback(
    (src: string) => {
      const el = ref.current;
      if (!el) return;
      if (activeSrc === src && !el.paused) {
        el.pause();
        setPlaying(false);
        return;
      }
      const resuming = activeSrc === src && el.paused;
      ensureSrc(src);
      if (!resuming) el.currentTime = 0;
      el.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    },
    [activeSrc, ensureSrc]
  );

  const seek = useCallback(
    (src: string, delta: number) => {
      const el = ref.current;
      if (!el) return;
      if (activeSrc !== src) ensureSrc(src);
      const dur = Number.isFinite(el.duration) ? el.duration : null;
      const next = (Number.isFinite(el.currentTime) ? el.currentTime : 0) + delta;
      el.currentTime = dur === null ? Math.max(0, next) : Math.max(0, Math.min(dur, next));
      setCurrentTime(el.currentTime);
    },
    [activeSrc, ensureSrc]
  );

  const seekTo = useCallback(
    (src: string, seconds: number) => {
      const el = ref.current;
      if (!el) return;
      if (activeSrc !== src) ensureSrc(src);
      const dur = Number.isFinite(el.duration) ? el.duration : null;
      el.currentTime = dur === null ? Math.max(0, seconds) : Math.max(0, Math.min(dur, seconds));
      setCurrentTime(el.currentTime);
    },
    [activeSrc, ensureSrc]
  );

  const value = useMemo<AudioCtx>(
    () => ({ activeSrc, playing, currentTime, duration, toggle, seek, seekTo, stop }),
    [activeSrc, playing, currentTime, duration, toggle, seek, seekTo, stop]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <audio
        ref={ref}
        preload="auto"
        onEnded={() => {
          setPlaying(false);
          setActiveSrc("");
          setCurrentTime(0);
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />
    </Ctx.Provider>
  );
}

function usePracticeAudio(): AudioCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePracticeAudio must be used within PracticeAudioProvider");
  return ctx;
}

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function AudioControl({
  audioKey,
  level,
  category,
  label,
}: {
  audioKey: string;
  level: number | string;
  category: PracticeCategory;
  label?: string;
}) {
  const { t } = useT();
  const audio = usePracticeAudio();
  const src = practiceAudioUrl(audioKey, level, category);
  const isActive = audio.activeSrc === src;
  const playing = isActive && audio.playing;
  const cur = isActive ? audio.currentTime : 0;
  const dur = isActive ? audio.duration : 0;
  const labelText = label || t("lesson.audio_fallback");

  return (
    <div className={`p-audio-control${playing ? " playing" : ""}`}>
      <button
        type="button"
        className="p-audio-seek-btn"
        title={t("practice.back_5_seconds")}
        aria-label={t("practice.back_5_seconds")}
        onClick={() => audio.seek(src, -5)}
      >
        <FontAwesomeIcon icon={faBackward} />
      </button>
      <button
        type="button"
        className="p-audio-btn p-audio-play-btn"
        title={playing ? t("practice.stop_audio") : t("lesson.play_audio")}
        aria-label={t("practice.play_label", { label: labelText })}
        onClick={() => audio.toggle(src)}
      >
        <FontAwesomeIcon icon={playing ? faStop : faPlay} />
      </button>
      <button
        type="button"
        className="p-audio-seek-btn"
        title={t("practice.forward_5_seconds")}
        aria-label={t("practice.forward_5_seconds")}
        onClick={() => audio.seek(src, 5)}
      >
        <FontAwesomeIcon icon={faForward} />
      </button>
      <div className="p-audio-scrubber">
        <span className="p-audio-time p-audio-elapsed">{formatTime(cur)}</span>
        <input
          type="range"
          className="p-audio-progress"
          min={0}
          max={Math.max(1, Math.floor(dur))}
          step={1}
          value={Math.floor(cur)}
          aria-label={t("practice.seek_slider")}
          onChange={(e) => audio.seekTo(src, Number(e.currentTarget.value))}
        />
        <span className="p-audio-time p-audio-duration">{formatTime(dur)}</span>
      </div>
    </div>
  );
}

export { usePracticeAudio };
