// Asserts that the per-scope CSS files still reproduce the pre-split
// app/globals.css, allowing only the scope prefixes listed in SCOPING below.
//
// app/globals.css was a single 5709-line file until it was split into one file
// per page scope. To keep the cascade provably unchanged, globals.css is now an
// ordered @import manifest and each imported file is a verbatim slice of the
// original: line 1 (the Tailwind import) plus the files in manifest order must
// equal the original.
//
// A few selectors were later anchored to the root they render under, so that
// generic names like .sp-title cannot leak. Each such rewrite is recorded in
// SCOPING and applied to the baseline before comparing, which keeps this an
// exact check: it still fails on any change that is not one of these.
//
// Run with: node scripts/check-css-split.mjs
// The baseline is read from git, so this keeps working as the files move.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GLOBALS = join(ROOT, "app", "globals.css");

// The commit in which globals.css was still the single pre-split file.
const BASELINE_REV = process.env.CSS_BASELINE_REV ?? "1eecc32";

// Selectors deliberately anchored to the root they render under, applied to the
// baseline before comparing. Add an entry here when you scope another rule --
// never to silence an unexpected diff.
const SCOPING = [
  [".pinyin-tooltip {", ".pinyin-guide .pinyin-tooltip {"],
  [".pinyin-popover {", ".pinyin-guide .pinyin-popover {"],
  [".pinyin-popover .tone-button {", ".pinyin-guide .pinyin-popover .tone-button {"],
  [".pinyin-popover .tone-button:hover {", ".pinyin-guide .pinyin-popover .tone-button:hover {"],

  // The train-type picker is opened from four different page scopes, so its
  // rules are anchored to its own overlay root rather than to a page scope.
  // .ttp-overlay and .ttp-overlay.open are that root and are unchanged.
  [".ttp-card {", ".ttp-overlay .ttp-card {"],
  [".ttp-title {", ".ttp-overlay .ttp-title {"],
  [".ttp-subtitle {", ".ttp-overlay .ttp-subtitle {"],
  [".ttp-options {", ".ttp-overlay .ttp-options {"],
  [".ttp-option {", ".ttp-overlay .ttp-option {"],
  [".ttp-option:hover {", ".ttp-overlay .ttp-option:hover {"],
  [".ttp-option input {", ".ttp-overlay .ttp-option input {"],
  [".ttp-error {", ".ttp-overlay .ttp-error {"],
  [".ttp-actions {", ".ttp-overlay .ttp-actions {"],
  [".ttp-actions .btn {", ".ttp-overlay .ttp-actions .btn {"],
  [".ttp-actions .btn.primary {", ".ttp-overlay .ttp-actions .btn.primary {"],
  [".ttp-actions .btn.primary:hover {", ".ttp-overlay .ttp-actions .btn.primary:hover {"],
  [".ttp-actions .btn.secondary {", ".ttp-overlay .ttp-actions .btn.secondary {"],
  [".ttp-actions .btn.secondary:hover {", ".ttp-overlay .ttp-actions .btn.secondary:hover {"],

  // The success popup renders as a sibling of TrainerShell, not inside it, so
  // it is likewise anchored to its own root. .success-popup-overlay and
  // .success-popup-overlay.open are that root and are unchanged.
  [".success-popup {", ".success-popup-overlay .success-popup {"],
  [".success-popup::before {", ".success-popup-overlay .success-popup::before {"],
  [".sp-icon-wrap {", ".success-popup-overlay .sp-icon-wrap {"],
  [".sp-icon-wrap.perfect {", ".success-popup-overlay .sp-icon-wrap.perfect {"],
  [".sp-icon-wrap.has-missed {", ".success-popup-overlay .sp-icon-wrap.has-missed {"],
  [".sp-title {", ".success-popup-overlay .sp-title {"],
  [".sp-stats {", ".success-popup-overlay .sp-stats {"],
  [".sp-stat {", ".success-popup-overlay .sp-stat {"],
  [".sp-stat:nth-child(1) {", ".success-popup-overlay .sp-stat:nth-child(1) {"],
  [".sp-stat:nth-child(2) {", ".success-popup-overlay .sp-stat:nth-child(2) {"],
  [".sp-stat:nth-child(3) {", ".success-popup-overlay .sp-stat:nth-child(3) {"],
  [".sp-stat-value {", ".success-popup-overlay .sp-stat-value {"],
  [".sp-stat-value.correct {", ".success-popup-overlay .sp-stat-value.correct {"],
  [".sp-stat-value.accuracy {", ".success-popup-overlay .sp-stat-value.accuracy {"],
  [".sp-stat-label {", ".success-popup-overlay .sp-stat-label {"],
  [".sp-confetti-canvas {", ".success-popup-overlay .sp-confetti-canvas {"],
  [".success-popup > *:not(canvas) {", ".success-popup-overlay .success-popup > *:not(canvas) {"],
];

function applyScoping(text) {
  for (const [from, to] of SCOPING) {
    // Anchor at line start so ".pinyin-popover {" does not also rewrite the
    // longer ".pinyin-popover .tone-button {" rules.
    const pattern = new RegExp("^" + from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gm");
    const before = text;
    text = text.replace(pattern, to);
    if (text === before) {
      console.error(`SCOPING entry never matched the baseline: ${from}`);
      process.exit(2);
    }
  }
  return text;
}

function baseline() {
  try {
    return execFileSync("git", ["show", `${BASELINE_REV}:app/globals.css`], {
      cwd: ROOT,
      encoding: "buffer",
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch {
    console.error(
      `Could not read app/globals.css at ${BASELINE_REV}. Set CSS_BASELINE_REV ` +
        `to the last commit that still had the single-file globals.css.`
    );
    process.exit(2);
  }
}

// Pull the import specifiers out of the manifest, in order.
const manifest = readFileSync(GLOBALS, "utf8");
const specs = [...manifest.matchAll(/^@import\s+"([^"]+)";/gm)].map((m) => m[1]);
const scoped = specs.filter((s) => s !== "tailwindcss");

if (scoped.length === 0) {
  console.error(
    "app/globals.css has no relative @imports. If the manifest was dissolved " +
      "into per-component imports (a later phase of the split), delete this " +
      "script -- it can no longer prove anything."
  );
  process.exit(2);
}

const appDir = join(ROOT, "app");
const parts = scoped.map((spec) => readFileSync(resolve(appDir, spec)));

// git stores these files LF-normalized while the working tree checks them out
// CRLF, so compare with endings normalized. Line endings carry no meaning in
// CSS; everything else must match exactly.
const normalize = (buf) => Buffer.from(buf.toString("utf8").replace(/\r\n/g, "\n"), "utf8");

// Line 1 of the original is the Tailwind import, which stays in the manifest.
const firstLine = Buffer.from('@import "tailwindcss";\n', "utf8");
const rebuilt = Buffer.concat([firstLine, ...parts.map(normalize)]);
const original = Buffer.from(applyScoping(normalize(baseline()).toString("utf8")), "utf8");

if (rebuilt.equals(original)) {
  console.log(
    `OK: ${scoped.length} files reproduce app/globals.css@${BASELINE_REV} ` +
      `exactly (${original.length} bytes, ${SCOPING.length} declared scope rewrites).`
  );
  process.exit(0);
}

console.error(
  `MISMATCH: rebuilt ${rebuilt.length} bytes, baseline ${original.length} bytes.`
);

// Point at the first difference so the offending file is obvious.
const len = Math.min(rebuilt.length, original.length);
let i = 0;
while (i < len && rebuilt[i] === original[i]) i++;
const lineNo = original.subarray(0, i).toString("utf8").split("\n").length;
console.error(`First difference at byte ${i} (original line ~${lineNo}).`);
console.error(`  baseline: ${JSON.stringify(original.subarray(i, i + 80).toString("utf8"))}`);
console.error(`  rebuilt:  ${JSON.stringify(rebuilt.subarray(i, i + 80).toString("utf8"))}`);
process.exit(1);
