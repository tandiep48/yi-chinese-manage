"use client";

// components/shared/customer_ui/GcsImage/GcsImage.tsx
// An <img> for a bucket asset that retries from the local mirror (public/gcs/...,
// lib/gcs.ts gcsLocalFallback) when GCS fails, and calls onFallbackFailed once no
// source is left so the caller can show its own placeholder.

import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { gcsLocalFallback } from "@/lib/gcs";

type GcsImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError"> & {
  src: string;
  // Called with the broken <img> after the bucket and the local copy both failed.
  onFallbackFailed?: (img: HTMLImageElement) => void;
};

export function GcsImage({ src, onFallbackFailed, alt = "", ...props }: GcsImageProps) {
  const local = gcsLocalFallback(src);
  const sources = local ? [src, local] : [src];

  // The attempt restarts whenever the caller swaps the image.
  const [state, setState] = useState({ src, attempt: 0, failed: false });
  const current = state.src === src ? state : { src, attempt: 0, failed: false };
  if (current !== state) setState(current);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const failedRef = useRef(onFallbackFailed);
  useEffect(() => {
    failedRef.current = onFallbackFailed;
  });

  const fail = () => {
    if (current.failed) return;
    if (current.attempt + 1 < sources.length) {
      setState({ src, attempt: current.attempt + 1, failed: false });
    } else {
      setState({ ...current, failed: true });
    }
  };

  useEffect(() => {
    if (state.failed && imgRef.current) failedRef.current?.(imgRef.current);
  }, [state.failed]);

  // A server-rendered image can fail before React attaches onError; catch that
  // already-broken state once mounted (and again after each source swap).
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0 && img.getAttribute("src")) fail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.src, state.attempt]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} ref={imgRef} src={sources[current.attempt]} alt={alt} onError={fail} />
  );
}
