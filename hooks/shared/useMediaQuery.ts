"use client";

import { useEffect, useState } from "react";

/**
 * Tracks a CSS media query. Returns false on the server and the first client
 * paint (so SSR and hydration agree), then the real value after mount. Callers
 * that must not flash the wrong layout should gate on their own loading state,
 * which resolves after mount — by then this holds the correct value.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Guard matchMedia: absent under SSR and in jsdom (test env), where the
    // false default is the right answer.
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}
