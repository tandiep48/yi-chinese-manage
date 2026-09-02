"use client";

// components/page/learner/vocab/VocabTable.tsx
// The study grid of the vocab selection page. Ports renderVocabTable() and the
// study-tool interactions from Learning/web_app/static/vocab/vocab_select.js:
//   - per-row select checkbox + select-all-on-page
//   - stroke-order and audio buttons per row
//   - hide/show whole columns (eye toggle) with per-cell reveal
//   - click a cell to hide/reveal it (flash-card study)
//   - hide a whole row's answers, shuffle the visible rows
//   - play one row's audio (revealing that row) or play every row in sequence
// Column-hide, cell-hide and row-hide state is keyed by word so it survives
// pagination, exactly like the legacy module-level Sets.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShuffle,
  faPaintbrush,
  faPlay,
  faPause,
  faVolumeHigh,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { vocabAudioUrl } from "@/lib/audio";
import type { VocabRow } from "@/lib/types/types";

type ColKey = "cn" | "py" | "vn";

const HANZI_RE = /[一-鿿]/;

function wordOf(row: VocabRow): string {
  return row.word || row.cn || "";
}

function cellValue(row: VocabRow, col: ColKey): string {
  if (col === "cn") return wordOf(row);
  if (col === "py") return row.pinyin || "";
  return row.meaning_vn || row.meaning_en || "";
}

interface VocabTableProps {
  rows: VocabRow[];
  isSelected: (row: VocabRow) => boolean;
  allOnPageSelected: boolean;
  onToggleWord: (row: VocabRow, checked: boolean) => void;
  onTogglePage: (rows: VocabRow[], checked: boolean) => void;
  onOpenStroke: (word: string, pinyin: string) => void;
  onStrokeAll: (rows: VocabRow[]) => void;
}

export function VocabTable({
  rows,
  isSelected,
  allOnPageSelected,
  onToggleWord,
  onTogglePage,
  onOpenStroke,
  onStrokeAll,
}: VocabTableProps) {
  const { t } = useT();

  // Local display order — shuffle mutates this; resets when a new page loads.
  const [displayRows, setDisplayRows] = useState<VocabRow[]>(rows);

  // Study state keyed by word / word::col so it survives pagination.
  const [hiddenColumns, setHiddenColumns] = useState<Set<ColKey>>(new Set());
  const [hiddenCells, setHiddenCells] = useState<Set<string>>(new Set());
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());

  // Audio playback.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playingAllRef = useRef(false);
  const [playingKey, setPlayingKey] = useState<string | null>(null); // active row audio_key
  const [playingAll, setPlayingAll] = useState(false);
  const [revealWord, setRevealWord] = useState<string | null>(null);
  const [highlightWord, setHighlightWord] = useState<string | null>(null);

  // When a new page loads (rows identity changes) reset the display order and
  // playback flags during render — the endorsed alternative to a setState effect.
  const [prevRows, setPrevRows] = useState(rows);
  if (rows !== prevRows) {
    setPrevRows(rows);
    setDisplayRows(rows);
    setPlayingKey(null);
    setPlayingAll(false);
    setRevealWord(null);
    setHighlightWord(null);
    // The <audio> element and playingAllRef are torn down by the rows-keyed
    // effect cleanup below — refs must not be touched during render.
  }

  const cols = useMemo(
    () =>
      [
        { key: "cn" as ColKey, cls: "vocab-cn", label: t("dashboard.table_character") },
        { key: "py" as ColKey, cls: "vocab-pinyin", label: t("dashboard.table_pinyin") },
        { key: "vn" as ColKey, cls: "vocab-meaning-vn", label: t("dashboard.table_meaning_vn") },
      ],
    [t]
  );

  const stopAudio = useCallback(() => {
    playingAllRef.current = false;
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingKey(null);
    setPlayingAll(false);
    setRevealWord(null);
    setHighlightWord(null);
  }, []);

  // Pause the actual <audio> element when the page's rows change or on unmount
  // (the playback flags themselves are reset in the render block above). No
  // setState here, so this stays a pure external-system sync.
  useEffect(() => {
    return () => {
      playingAllRef.current = false;
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [rows]);

  const cellKey = (word: string, col: ColKey) => `${word}::${col}`;

  function toggleColumn(col: ColKey) {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
    // Clear per-cell overrides for this column so the toggle is authoritative.
    setRevealedCells((prev) => {
      const next = new Set(prev);
      displayRows.forEach((r) => next.delete(cellKey(wordOf(r), col)));
      return next;
    });
    setHiddenCells((prev) => {
      if (hiddenColumns.has(col)) return prev; // was hidden -> showing; keep cell state
      const next = new Set(prev);
      displayRows.forEach((r) => next.delete(cellKey(wordOf(r), col)));
      return next;
    });
  }

  function toggleCell(word: string, col: ColKey) {
    const key = cellKey(word, col);
    if (hiddenColumns.has(col)) {
      // Column hidden: clicking reveals just this cell.
      setRevealedCells((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      return;
    }
    setHiddenCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function shuffle() {
    stopAudio();
    setDisplayRows((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
  }

  function playRow(row: VocabRow) {
    const key = row.audio_key;
    if (!key) return;
    stopAudio();
    const word = wordOf(row);
    setRevealWord(word);
    const audio = new Audio(vocabAudioUrl(key));
    audioRef.current = audio;
    setPlayingKey(key);
    const done = () => {
      setPlayingKey(null);
      setRevealWord(null);
      audioRef.current = null;
    };
    audio.onended = done;
    audio.onerror = done;
    audio.play().catch(done);
  }

  async function playAll() {
    if (playingAllRef.current) {
      stopAudio();
      return;
    }
    stopAudio();
    playingAllRef.current = true;
    setPlayingAll(true);
    const playable = displayRows.filter((r) => r.audio_key);
    for (const row of playable) {
      if (!playingAllRef.current) break;
      const word = wordOf(row);
      setHighlightWord(word);
      setRevealWord(word);
      await new Promise<void>((resolve) => {
        const audio = new Audio(vocabAudioUrl(row.audio_key));
        audioRef.current = audio;
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      });
      setRevealWord(null);
      await new Promise((r) => setTimeout(r, 400));
    }
    if (playingAllRef.current) stopAudio();
    else {
      setPlayingAll(false);
      setHighlightWord(null);
    }
  }

  const tableCls = ["vocab-table", ...[...hiddenColumns].map((c) => `hide-${c}`)].join(" ");

  return (
    <div className="vocab-table-wrap">
      <table className={tableCls}>
        <thead>
          <tr>
            <th className="vocab-no-col">
              <button
                type="button"
                className="vocab-header-icon-btn"
                onClick={shuffle}
                title={t("vocab.shuffle_visible_aria")}
                aria-label={t("vocab.shuffle_visible_aria")}
              >
                <FontAwesomeIcon icon={faShuffle} />
              </button>
            </th>
            <th className="vocab-select-col">
              <input
                type="checkbox"
                checked={allOnPageSelected}
                onChange={(e) => onTogglePage(displayRows, e.target.checked)}
                title={t("vocab.select_visible_rows_aria")}
                aria-label={t("vocab.select_visible_rows_aria")}
              />
            </th>
            <th className="vocab-tools-col">
              <button
                type="button"
                className="vocab-header-icon-btn"
                onClick={() => onStrokeAll(displayRows)}
                title={t("vocab.stroke_all_aria")}
                aria-label={t("vocab.stroke_all_aria")}
              >
                <FontAwesomeIcon icon={faPaintbrush} />
              </button>
              <button
                type="button"
                className="vocab-header-icon-btn"
                onClick={playAll}
                title={t("vocab.play_all_visible_aria")}
                aria-label={t("vocab.play_all_visible_aria")}
              >
                <FontAwesomeIcon icon={playingAll ? faPause : faPlay} className={playingAll ? "" : "play-icon"} />
              </button>
            </th>
            {cols.map((col) => {
              const isHidden = hiddenColumns.has(col.key);
              const actionLabel = `${isHidden ? t("vocab.show") : t("vocab.hide")} ${col.label}`;
              return (
                <th key={col.key}>
                  <span className="vocab-column-header-label">{col.label}</span>
                  <button
                    type="button"
                    className="vocab-column-toggle"
                    onClick={() => toggleColumn(col.key)}
                    title={actionLabel}
                    aria-label={actionLabel}
                  >
                    <FontAwesomeIcon icon={isHidden ? faEye : faEyeSlash} />
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, index) => {
            const word = wordOf(row);
            const revealed = revealWord === word;
            const rowCls = [
              revealed ? "audio-revealed" : "",
              highlightWord === word ? "playing-highlight" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <tr key={`${word}-${index}`} className={rowCls || undefined}>
                <td className="vocab-no-cell">{index + 1}</td>
                <td className="vocab-select-col">
                  <input
                    type="checkbox"
                    className="vocab-row-checkbox"
                    checked={isSelected(row)}
                    onChange={(e) => onToggleWord(row, e.target.checked)}
                  />
                </td>
                <td className="vocab-tools-cell">
                  {HANZI_RE.test(word) && (
                    <button
                      type="button"
                      className="vocab-stroke-row-btn"
                      onClick={() => onOpenStroke(word, row.pinyin || "")}
                      title={t("vocab.write_character_aria")}
                      aria-label={t("vocab.write_character_aria")}
                    >
                      <FontAwesomeIcon icon={faPaintbrush} />
                    </button>
                  )}
                  {row.audio_key ? (
                    <button
                      type="button"
                      className="vocab-audio-btn"
                      onClick={() => playRow(row)}
                      title={t("lesson.play_audio")}
                      aria-label={t("lesson.play_audio")}
                    >
                      <FontAwesomeIcon icon={playingKey === row.audio_key ? faPause : faVolumeHigh} />
                    </button>
                  ) : (
                    <span className="vocab-no-audio">-</span>
                  )}
                </td>
                {cols.map((col) => {
                  const key = cellKey(word, col.key);
                  const classes = [
                    col.cls,
                    "clickable-cell",
                    hiddenCells.has(key) ? "hidden-cell" : "",
                    revealedCells.has(key) ? "column-cell-revealed" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <td
                      key={col.key}
                      className={classes}
                      onClick={() => toggleCell(word, col.key)}
                      lang={col.key === "cn" ? "zh-CN" : undefined}
                    >
                      {cellValue(row, col.key)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
