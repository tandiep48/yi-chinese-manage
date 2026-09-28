"use client";

// components/shared/customer_ui/MultiSelect/MultiSelect.tsx
// Checkbox dropdown that replaces a clunky native <select multiple>. A controlled
// port of Learning/web_app/static/shared/multi_select.js: a toggle button whose
// label collapses to a placeholder / the single label / "N selected", a pinned
// "select all" row, and options that can be grouped under sticky group labels.
// Closes on outside-click or Escape.

import { useEffect, useId, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

export interface MultiSelectOption {
  value: string;
  label: string;
  group?: string | null;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  selectAllLabel: string;
  // Renders the collapsed label when more than one option is selected.
  renderCount: (n: number) => string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  values,
  onChange,
  placeholder,
  selectAllLabel,
  renderCount,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const isDisabled = disabled || options.length === 0;
  const selected = new Set(values);
  const allSelected = options.length > 0 && selected.size === options.length;

  // Close when the toggle becomes disabled (mirrors _setDisabled removing .open).
  if (isDisabled && open) setOpen(false);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggleValue(value: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(value);
    else next.delete(value);
    // Preserve option order in the emitted array.
    onChange(options.map((o) => o.value).filter((v) => next.has(v)));
  }

  function toggleAll(checked: boolean) {
    onChange(checked ? options.map((o) => o.value) : []);
  }

  const label =
    selected.size === 0
      ? placeholder
      : selected.size === 1
        ? (options.find((o) => o.value === values[0])?.label ?? "1")
        : renderCount(selected.size);

  return (
    <div className={`ms-dropdown${open ? " open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="ms-toggle"
        disabled={isDisabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`ms-label${selected.size === 0 ? " ms-placeholder" : ""}`}>
          {label}
        </span>
        <FontAwesomeIcon icon={faChevronDown} className="ms-caret" aria-hidden />
      </button>
      <div className="ms-panel" id={panelId} role="listbox" aria-multiselectable>
        {options.length > 0 && (
          <label className="ms-option ms-option-all">
            <input
              type="checkbox"
              className="ms-select-all"
              checked={allSelected}
              onChange={(e) => toggleAll(e.target.checked)}
            />
            <span>{selectAllLabel}</span>
          </label>
        )}
        {options.map((opt, i) => {
          // Show a group header when this option starts a new group.
          const showGroup = opt.group && opt.group !== options[i - 1]?.group;
          return (
            <div key={opt.value}>
              {showGroup && <div className="ms-group-label">{opt.group}</div>}
              <label className="ms-option">
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={selected.has(opt.value)}
                  onChange={(e) => toggleValue(opt.value, e.target.checked)}
                />
                <span>{opt.label}</span>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
