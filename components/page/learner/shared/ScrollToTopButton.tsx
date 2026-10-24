"use client";

// components/page/learner/shared/ScrollToTopButton.tsx
// A floating "back to top" button for long learner pages. It finds its own scroll
// container (the nearest scrollable ancestor — the learner layout's <main> — falling
// back to the window), shows itself once that container is scrolled past `threshold`,
// and smooth-scrolls back to the top on click. Hidden (not unmounted) while near the
// top so its ref stays in the DOM to track the scroller.

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import "./scroll-to-top.css";

// Walk up from the button to the nearest vertically scrollable ancestor; the window
// is the fallback when nothing in the tree scrolls on its own.
function findScroller(from: HTMLElement | null): HTMLElement | Window {
  let node = from?.parentElement ?? null;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return window;
}

export function ScrollToTopButton({ threshold = 300 }: { threshold?: number }) {
  const { t } = useT();
  const btnRef = useRef<HTMLButtonElement>(null);
  const scrollerRef = useRef<HTMLElement | Window | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scroller = findScroller(btnRef.current);
    scrollerRef.current = scroller;
    const getTop = () => (scroller === window ? window.scrollY : (scroller as HTMLElement).scrollTop);
    const onScroll = () => setVisible(getTop() > threshold);
    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [threshold]);

  const toTop = () => {
    scrollerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      ref={btnRef}
      type="button"
      className={`scroll-to-top${visible ? " is-visible" : ""}`}
      onClick={toTop}
      aria-label={t("widgets.scroll_to_top")}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <FontAwesomeIcon icon={faArrowUp} aria-hidden />
    </button>
  );
}
