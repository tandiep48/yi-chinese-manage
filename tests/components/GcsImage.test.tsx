// tests/components/GcsImage.test.tsx
// A bucket image retries from the local mirror (public/gcs/...) when GCS fails —
// a 500 reaches the <img> as an error event like any other non-2xx — and reports
// back once no source is left.

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GcsImage } from "@/components/shared/customer_ui/GcsImage/GcsImage";
import { GCS_BUCKET_URL, gcsLocalFallback, lessonImageUrl } from "@/lib/gcs";

describe("gcsLocalFallback", () => {
  it("maps a bucket URL onto the same path under /gcs", () => {
    expect(gcsLocalFallback(`${GCS_BUCKET_URL}/hsk_images/hsk1.png`)).toBe("/gcs/hsk_images/hsk1.png");
    expect(gcsLocalFallback(lessonImageUrl("HSK1", 2))).toBe("/gcs/lesson_images/H1/H1-lesson 2.png");
  });

  it("returns null for a URL outside the bucket", () => {
    expect(gcsLocalFallback("https://example.com/a.png")).toBeNull();
    expect(gcsLocalFallback("/images/a.png")).toBeNull();
  });
});

describe("GcsImage", () => {
  const SRC = `${GCS_BUCKET_URL}/badge/HSK3.png`;

  it("loads from the bucket, then from the local mirror after a failure", () => {
    const onFallbackFailed = vi.fn();
    render(<GcsImage src={SRC} alt="badge" onFallbackFailed={onFallbackFailed} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", SRC);

    fireEvent.error(img);
    expect(img).toHaveAttribute("src", "/gcs/badge/HSK3.png");
    expect(onFallbackFailed).not.toHaveBeenCalled();
  });

  it("reports once with the <img> when the local copy fails too", () => {
    const onFallbackFailed = vi.fn();
    render(<GcsImage src={SRC} alt="badge" onFallbackFailed={onFallbackFailed} />);
    const img = screen.getByRole("img");
    fireEvent.error(img);
    fireEvent.error(img);
    fireEvent.error(img);
    expect(onFallbackFailed).toHaveBeenCalledTimes(1);
    expect(onFallbackFailed).toHaveBeenCalledWith(img);
  });

  it("starts from the bucket again when the image changes", () => {
    const { rerender } = render(<GcsImage src={SRC} alt="badge" />);
    fireEvent.error(screen.getByRole("img"));
    const next = `${GCS_BUCKET_URL}/badge/HSK4.png`;
    rerender(<GcsImage src={next} alt="badge" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", next);
  });

  it("reports straight away for a URL with no local mirror", () => {
    const onFallbackFailed = vi.fn();
    render(<GcsImage src="https://example.com/a.png" alt="x" onFallbackFailed={onFallbackFailed} />);
    fireEvent.error(screen.getByRole("img"));
    expect(onFallbackFailed).toHaveBeenCalledTimes(1);
  });
});
