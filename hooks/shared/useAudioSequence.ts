"use client";

// hooks/shared/useAudioSequence.ts
// Small audio controller shared by the lesson-study summaries. Supports playing
// one clip (with the played item highlighted) and playing a whole sequence in
// order — the "Auto Play" (Lesson Summary) and "Play All" (Word Summary)
// behaviours from Learning/web_app/static/reading/reading.js and
// vocab_learning.js. `activeKey` marks the currently sounding item so the UI can
// highlight it.

import { useCallback, useEffect, useRef, useState } from "react";

export interface AudioItem {
  key: string;
  src: string;
}

export function useAudioSequence() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const seqRef = useRef<{ items: AudioItem[]; i: number; active: boolean }>({
    items: [],
    i: 0,
    active: false,
  });
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [sequenceActive, setSequenceActive] = useState(false);

  const stop = useCallback(() => {
    seqRef.current.active = false;
    setSequenceActive(false);
    const a = audioRef.current;
    if (a) {
      a.onended = null;
      a.onerror = null;
      a.pause();
    }
    setActiveKey(null);
  }, []);

  const playSingle = useCallback(
    (key: string, src: string) => {
      stop();
      const a = new Audio(src);
      audioRef.current = a;
      setActiveKey(key);
      const clear = () => setActiveKey((cur) => (cur === key ? null : cur));
      a.onended = clear;
      a.onerror = clear;
      a.play().catch(clear);
    },
    [stop]
  );

  const toggleSequence = useCallback(
    (items: AudioItem[]) => {
      if (seqRef.current.active) {
        stop();
        return;
      }
      if (!items.length) return;
      seqRef.current = { items, i: 0, active: true };
      setSequenceActive(true);

      // Local recursive stepper — plays the current item, then advances on end.
      const run = () => {
        const s = seqRef.current;
        if (!s.active) return;
        if (s.i >= s.items.length) {
          stop();
          return;
        }
        const item = s.items[s.i];
        setActiveKey(item.key);
        const a = new Audio(item.src);
        audioRef.current = a;
        const advance = () => {
          if (!seqRef.current.active) return;
          seqRef.current.i += 1;
          run();
        };
        a.onended = advance;
        a.onerror = advance;
        a.play().catch(advance);
      };
      run();
    },
    [stop]
  );

  // Stop any playback when the component using this unmounts.
  useEffect(() => () => stop(), [stop]);

  return { activeKey, sequenceActive, playSingle, toggleSequence, stop };
}
