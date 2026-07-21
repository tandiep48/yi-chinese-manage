"use client";

// components/passage/PassageVocabManager.tsx
// Manage the vocabulary words linked to a single passage:
//  - lists linked words as removable chips
//  - a searchable picker to add an existing vocabulary word
// Self-contained: owns its own fetch/add/remove state per passageId.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  listPassageVocab,
  addPassageVocab,
  removePassageVocab,
  listVocab,
} from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { Vocab } from "@/lib/types";

interface PassageVocabManagerProps {
  passageId: string;
}

export function PassageVocabManager({ passageId }: PassageVocabManagerProps) {
  const { toast } = useToast();

  const [linked, setLinked] = useState<Vocab[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyCn, setBusyCn] = useState<string | null>(null);

  // Add-picker state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Vocab[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // ── Load linked words ──────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPassageVocab(passageId);
      setLinked(res.items);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to load words.", "error");
    } finally {
      setLoading(false);
    }
  }, [passageId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Debounced search for suggestions ───────────────────────────────────────
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const res = await listVocab(1, 8, undefined, q);
        setSuggestions(res.items);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  // ── Close dropdown on outside click ────────────────────────────────────────
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const linkedSet = new Set(linked.map((v) => v.cn));

  // ── Add / remove ───────────────────────────────────────────────────────────
  const handleAdd = async (word: Vocab) => {
    if (linkedSet.has(word.cn)) return;
    setBusyCn(word.cn);
    try {
      await addPassageVocab(passageId, word.cn);
      setLinked((prev) =>
        [...prev, word].sort((a, b) => a.cn.localeCompare(b.cn))
      );
      toast(`Added "${word.cn}".`, "success");
      setQuery("");
      setSuggestions([]);
      setOpen(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to add word.", "error");
    } finally {
      setBusyCn(null);
    }
  };

  const handleRemove = async (cn: string) => {
    setBusyCn(cn);
    try {
      await removePassageVocab(passageId, cn);
      setLinked((prev) => prev.filter((v) => v.cn !== cn));
      toast(`Removed "${cn}".`, "info");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to remove word.", "error");
    } finally {
      setBusyCn(null);
    }
  };

  return (
    <div className="mt-4 rounded-lg bg-white border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Linked Vocabulary
        </h4>
        <span className="text-[10px] text-slate-400">
          {loading ? "…" : `${linked.length} word${linked.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {/* Linked chips */}
      {loading ? (
        <p className="text-xs text-slate-400 animate-pulse">Loading words…</p>
      ) : linked.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No words linked yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {linked.map((v) => (
            <span
              key={v.cn}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 pl-3 pr-1.5 py-1 text-sm text-slate-700 ring-1 ring-slate-200"
            >
              <span className="font-medium">{v.cn}</span>
              {v.pinyin && (
                <span className="text-xs text-slate-400">{v.pinyin}</span>
              )}
              <button
                type="button"
                title={`Remove ${v.cn}`}
                disabled={busyCn === v.cn}
                onClick={() => handleRemove(v.cn)}
                className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors disabled:opacity-40"
              >
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add picker */}
      <div ref={boxRef} className="relative mt-3 max-w-sm">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search a word to add (Chinese or pinyin)…"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
        />

        {open && query.trim() && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            {searching ? (
              <p className="px-3 py-2 text-xs text-slate-400 animate-pulse">Searching…</p>
            ) : suggestions.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400 italic">
                No matching words. Create the word in Vocabulary first.
              </p>
            ) : (
              <ul className="max-h-56 overflow-y-auto">
                {suggestions.map((v) => {
                  const already = linkedSet.has(v.cn);
                  return (
                    <li key={v.cn}>
                      <button
                        type="button"
                        disabled={already || busyCn === v.cn}
                        onClick={() => handleAdd(v)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="flex items-baseline gap-2 min-w-0">
                          <span className="font-medium text-slate-800">{v.cn}</span>
                          {v.pinyin && (
                            <span className="text-xs text-slate-400 truncate">{v.pinyin}</span>
                          )}
                        </span>
                        <span className="text-xs text-slate-400 shrink-0">
                          {already ? "Added" : "+ Add"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
