import { describe, it, expect } from "vitest";
import {
  groupSizes,
  buildGroups,
  buildGroupsAvoidingKey,
  buildActivities,
  pinyinKey,
  GROUP_SIZE,
  type TrainerWord,
} from "@/lib/lessons/vocabTrainer";
import { pickMeaning, pickLang } from "@/lib/lessons/meaning";

function w(word: string, pinyin: string, meaning_vn = "", meaning_en = ""): TrainerWord {
  return { word, cn: word, pinyin, meaning_vn, meaning_en, audio_key: "", level: "HSK1" };
}

describe("groupSizes", () => {
  it("packs words into groups of GROUP_SIZE", () => {
    expect(groupSizes(0)).toEqual([]);
    expect(groupSizes(1)).toEqual([1]);
    expect(groupSizes(5)).toEqual([5]);
    expect(groupSizes(10)).toEqual([5, 5]);
  });

  it("avoids a lone trailing word by borrowing from the previous group", () => {
    expect(groupSizes(6)).toEqual([4, 2]);
    expect(groupSizes(11)).toEqual([5, 4, 2]);
    expect(groupSizes(16)).toEqual([5, 5, 4, 2]);
  });

  it("never grows a group past GROUP_SIZE", () => {
    for (let n = 1; n <= 60; n++) {
      const sizes = groupSizes(n);
      expect(sizes.reduce((a, b) => a + b, 0)).toBe(n);
      sizes.forEach((s) => expect(s).toBeLessThanOrEqual(GROUP_SIZE));
      if (sizes.length > 1) expect(sizes[sizes.length - 1]).not.toBe(1);
    }
  });
});

describe("buildGroups", () => {
  it("partitions all rows in order with no loss", () => {
    const rows = Array.from({ length: 13 }, (_, i) => w(`w${i}`, `p${i}`));
    const groups = buildGroups(rows);
    expect(groups.flat().map((r) => r.word)).toEqual(rows.map((r) => r.word));
  });
});

describe("pinyinKey", () => {
  it("is case- and space-insensitive, tone marks kept", () => {
    expect(pinyinKey(w("他", "tā"))).toBe(pinyinKey(w("她", " Tā ")));
    expect(pinyinKey(w("的", "de"))).not.toBe(pinyinKey(w("得", "dé")));
  });

  it("falls back to the word when pinyin is blank", () => {
    expect(pinyinKey(w("x", ""))).toBe("__x");
    expect(pinyinKey(w("y", ""))).not.toBe(pinyinKey(w("z", "")));
  });
});

describe("buildGroupsAvoidingKey", () => {
  // The engine grows the group count to at least the max homophone frequency and
  // places the most-constrained words first, so realistic homophone sets (a pair or
  // triple among otherwise-distinct words) separate cleanly. It is best-effort — the
  // same greedy as the original vocab_trainer_core.js — so we assert the realistic
  // guarantee rather than optimality on adversarial exactly-full packings.
  function noKeyRepeatsWithinGroup(rows: TrainerWord[]) {
    const groups = buildGroupsAvoidingKey(rows, pinyinKey);
    groups.forEach((g) => {
      const keys = g.map(pinyinKey);
      expect(new Set(keys).size).toBe(keys.length);
    });
    expect(groups.flat().length).toBe(rows.length);
  }

  it("separates a homophone pair among distinct words", () => {
    const rows = [w("他", "tā"), w("她", "tā"), ...Array.from({ length: 8 }, (_, i) => w(`w${i}`, `p${i}`))];
    for (let trial = 0; trial < 50; trial++) noKeyRepeatsWithinGroup(rows);
  });

  it("separates a homophone triple by growing the group count", () => {
    const rows = [
      w("是", "shì"),
      w("事", "shì"),
      w("市", "shì"),
      ...Array.from({ length: 7 }, (_, i) => w(`w${i}`, `p${i}`)),
    ];
    for (let trial = 0; trial < 50; trial++) noKeyRepeatsWithinGroup(rows);
  });

  it("keeps every word exactly once", () => {
    const rows = Array.from({ length: 13 }, (_, i) => w(`w${i}`, `p${i % 4}`));
    const groups = buildGroupsAvoidingKey(rows, pinyinKey);
    expect(groups.flat().map((r) => r.word).sort()).toEqual(rows.map((r) => r.word).sort());
  });
});

describe("buildActivities", () => {
  const rows = Array.from({ length: 12 }, (_, i) => w(`w${i}`, `p${i}`));

  it("runs every word once per selected skill", () => {
    const activities = buildActivities(rows, ["typing", "listen", "reading"]);
    for (const type of ["typing", "listen", "reading"] as const) {
      const seen = activities.filter((a) => a.type === type).flatMap((a) => a.words.map((r) => r.word));
      expect(seen.sort()).toEqual(rows.map((r) => r.word).sort());
    }
  });

  it("restricts to the chosen skills only", () => {
    const activities = buildActivities(rows, ["typing"]);
    expect(new Set(activities.map((a) => a.type))).toEqual(new Set(["typing"]));
  });

  it("defaults to all three skills when none are given", () => {
    const activities = buildActivities(rows, []);
    expect(new Set(activities.map((a) => a.type))).toEqual(new Set(["typing", "listen", "reading"]));
  });

  it("returns no activities for an empty selection", () => {
    expect(buildActivities([], ["typing"])).toEqual([]);
  });
});

describe("pickMeaning", () => {
  it("prefers the Vietnamese gloss in VI, English in EN", () => {
    const row = w("好", "hǎo", "tốt", "good");
    expect(pickMeaning(row, "vi")).toBe("tốt");
    expect(pickMeaning(row, "en")).toBe("good");
  });

  it("falls back to the other language when one is blank", () => {
    expect(pickLang("", "good", "vi")).toBe("good");
    expect(pickLang("tốt", "", "en")).toBe("tốt");
    expect(pickLang("", "", "en")).toBe("");
  });
});
