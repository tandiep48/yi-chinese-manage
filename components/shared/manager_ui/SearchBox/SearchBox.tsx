"use client";

// components/shared/manager_ui/SearchBox/SearchBox.tsx
// Search box for the manage tables. Searches on Enter; the clear button (and
// Enter on an empty box) shows the full list again.

import { useState } from "react";

interface SearchBoxProps {
  id: string;
  label: string;
  placeholder: string;
  onSearch: (term: string) => void;
}

export function SearchBox({ id, label, placeholder, onSearch }: SearchBoxProps) {
  const [draft, setDraft] = useState("");

  return (
    <form
      role="search"
      className="relative w-full sm:w-72"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(draft.trim());
      }}
    >
      <input
        id={id}
        type="search"
        aria-label={label}
        placeholder={placeholder}
        maxLength={100}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-9 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all [&::-webkit-search-cancel-button]:appearance-none"
      />
      {draft && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setDraft("");
            onSearch("");
          }}
          className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      )}
    </form>
  );
}
