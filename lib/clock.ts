// lib/clock.ts
// Single indirection for wall-clock reads used by the trainers' per-answer timing.
// Centralising it keeps `Date.now()` out of component render bodies (the trainers
// only read it inside event handlers / refs) and gives tests one place to stub.
export const now = (): number => Date.now();
