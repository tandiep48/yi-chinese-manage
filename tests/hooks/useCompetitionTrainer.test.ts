// tests/hooks/useCompetitionTrainer.test.ts
// The in-room trainer: it resolves the room's words once, reports answers straight to
// the caller (the socket), and — the regression that matters — is keyed on the passage
// ids rather than the room object, so the room_state broadcasts that arrive whenever a
// member joins or the host saves settings can neither cancel the word fetch nor
// rebuild the activities mid-game.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCompetitionTrainer } from "@/hooks/useCompetitionTrainer";
import * as trainerApi from "@/lib/api/vocabTrainer";
import type { CompetitionRoom, VocabRow } from "@/lib/types/types";

vi.mock("@/lib/api/vocabTrainer");
vi.mock("@/components/i18n/I18nProvider", () => ({
  useT: () => ({ t: (key: string) => key, lang: "en" }),
}));

const WORDS: VocabRow[] = Array.from({ length: 5 }, (_, i) => ({
  word: `字${i}`,
  cn: `字${i}`,
  pinyin: `zi${i}`,
  meaning_en: `char ${i}`,
  meaning_vn: `chu ${i}`,
  audio_key: `k${i}`,
  level: "HSK1",
}));

function room(over: Partial<CompetitionRoom> = {}): CompetitionRoom {
  return {
    id: 1,
    room_code: "ABC123",
    host_user_id: 1,
    level: 1,
    passage_ids: ["H1_10_1"],
    word_count: 5,
    max_users: 8,
    section_timeout_minutes: 15,
    status: "running",
    created_at: null,
    updated_at: null,
    category: "vocab",
    activity_type: "typing",
    members: [],
    chat: [],
    session: null,
    ...over,
  } as CompetitionRoom;
}

describe("useCompetitionTrainer", () => {
  beforeEach(() => vi.resetAllMocks());

  it("resolves the room's words and starts playing", async () => {
    vi.mocked(trainerApi.resolveTrainerWords).mockResolvedValue(WORDS);
    const { result } = renderHook(() =>
      useCompetitionTrainer({ room: room(), onAnswer: vi.fn(), onFinish: vi.fn() })
    );

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("playing"));
    expect(trainerApi.resolveTrainerWords).toHaveBeenCalledWith({ passage_ids: ["H1_10_1"] });
    expect(result.current.activity?.type).toBe("typing");
    expect(result.current.counterText).toBe("vocab_trainer.group_counter");
  });

  it("does not refetch or rebuild when a room_state brings an equal room object", async () => {
    vi.mocked(trainerApi.resolveTrainerWords).mockResolvedValue(WORDS);
    const { result, rerender } = renderHook(
      ({ r }: { r: CompetitionRoom }) =>
        useCompetitionTrainer({ room: r, onAnswer: vi.fn(), onFinish: vi.fn() }),
      { initialProps: { r: room() } }
    );
    await waitFor(() => expect(result.current.status).toBe("playing"));
    const before = result.current.activity;
    const calls = vi.mocked(trainerApi.resolveTrainerWords).mock.calls.length;

    // A member joined: same room, new object, new passage_ids array.
    rerender({ r: room({ members: [{ user_id: 2, username: "u2", role: "member", status: "online", joined_at: null }] }) });

    expect(vi.mocked(trainerApi.resolveTrainerWords).mock.calls.length).toBe(calls);
    expect(result.current.activity).toBe(before);
  });

  it("reports the word and score fields of an answer", async () => {
    vi.mocked(trainerApi.resolveTrainerWords).mockResolvedValue(WORDS);
    const onAnswer = vi.fn();
    const { result } = renderHook(() =>
      useCompetitionTrainer({ room: room(), onAnswer, onFinish: vi.fn() })
    );
    await waitFor(() => expect(result.current.status).toBe("playing"));

    act(() => result.current.recordAnswer(WORDS[0], "listen", "answer", true, 1200, 2));

    expect(onAnswer).toHaveBeenCalledWith("字0", "listen", true, 1200, 2);
  });

  it("finishes after the last activity instead of advancing past it", async () => {
    vi.mocked(trainerApi.resolveTrainerWords).mockResolvedValue(WORDS);
    const onFinish = vi.fn();
    const { result } = renderHook(() =>
      useCompetitionTrainer({ room: room(), onAnswer: vi.fn(), onFinish })
    );
    await waitFor(() => expect(result.current.status).toBe("playing"));

    // One typing activity for five words, so a single advance ends the run.
    act(() => result.current.advance());
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state when the room's parts have no vocabulary", async () => {
    vi.mocked(trainerApi.resolveTrainerWords).mockResolvedValue([]);
    const { result } = renderHook(() =>
      useCompetitionTrainer({ room: room(), onAnswer: vi.fn(), onFinish: vi.fn() })
    );
    await waitFor(() => expect(result.current.status).toBe("empty"));
  });
});
