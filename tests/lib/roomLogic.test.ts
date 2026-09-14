import { describe, expect, it } from "vitest";
import {
  buildLessonOptions,
  buildPartOptions,
  canManageRoom,
  collectRoomSettings,
  groupPassagesByLesson,
  isRoomHost,
  lessonItemKey,
  lessonKeySort,
  numericSort,
  parsePassageId,
  parseTypeValues,
  roomSummary,
  vocabActivityTypes,
} from "@/lib/competition/roomLogic";
import type { CompetitionRoom, PickerPassage } from "@/lib/types/types";

const LABELS = { lessonPrefix: "Lesson", partPrefix: "Part", other: "Other" };

function passage(passage_id: string, hsk_level = "HSK1"): PickerPassage {
  return { passage_id, hsk_level };
}

describe("parsePassageId", () => {
  // Real ids use the "H1_" prefix, not "HSK1_".
  it("splits a real passage id", () => {
    expect(parsePassageId("H1_10_2")).toEqual({
      passage_id: "H1_10_2",
      hsk: "H1",
      level: 1,
      lesson: "10",
      part: "2",
      lessonKey: "H1_10",
    });
  });

  it("also accepts the HSK-prefixed form", () => {
    expect(parsePassageId("HSK3_4_1")).toMatchObject({ level: 3, lesson: "4", part: "1" });
  });

  it("falls back to Other for an unstructured id", () => {
    expect(parsePassageId("AML")).toMatchObject({
      level: 0,
      lesson: "Other",
      part: "AML",
      lessonKey: "AML",
    });
  });
});

describe("sorting", () => {
  it("orders numerically and pushes Other last", () => {
    expect(["10", "2", "Other", "1"].sort(numericSort)).toEqual(["1", "2", "10", "Other"]);
  });

  it("orders lesson keys by level then lesson", () => {
    expect(["H2_1", "H1_10", "H1_2"].sort(lessonKeySort)).toEqual(["H1_2", "H1_10", "H2_1"]);
  });
});

describe("lesson / part options", () => {
  const byLevel = {
    1: [passage("H1_1_1"), passage("H1_1_2"), passage("H1_2_1")],
    2: [passage("H2_1_1", "HSK2")],
  };

  it("groups passages by lesson key across levels", () => {
    const grouped = groupPassagesByLesson([1, 2], byLevel);
    expect(Object.keys(grouped).sort()).toEqual(["H1_1", "H1_2", "H2_1"]);
    expect(grouped["H1_1"]).toHaveLength(2);
  });

  it("drops a level's lessons when it is deselected", () => {
    expect(Object.keys(groupPassagesByLesson([1], byLevel))).not.toContain("H2_1");
  });

  it("labels lessons and only groups them when several levels are picked", () => {
    const grouped = groupPassagesByLesson([1, 2], byLevel);
    expect(buildLessonOptions(grouped, 2, LABELS)).toEqual([
      { value: "H1_1", label: "Lesson 1", group: "HSK 1" },
      { value: "H1_2", label: "Lesson 2", group: "HSK 1" },
      { value: "H2_1", label: "Lesson 1", group: "HSK 2" },
    ]);
    expect(buildLessonOptions(grouped, 1, LABELS)[0].group).toBeNull();
  });

  it("builds part options carrying the passage id, sorted by part number", () => {
    const grouped = groupPassagesByLesson([1], byLevel);
    expect(buildPartOptions(["H1_1"], grouped, LABELS)).toEqual([
      { value: "H1_1_1", label: "Part 1", group: null },
      { value: "H1_1_2", label: "Part 2", group: null },
    ]);
  });

  it("groups parts under HSK + lesson when several lessons are picked", () => {
    const grouped = groupPassagesByLesson([1, 2], byLevel);
    const options = buildPartOptions(["H2_1", "H1_2"], grouped, LABELS);
    expect(options.map((o) => o.group)).toEqual(["HSK 1 · Lesson 2", "HSK 2 · Lesson 1"]);
  });

  it("skips lesson keys with no loaded passages", () => {
    expect(buildPartOptions(["H9_9"], {}, LABELS)).toEqual([]);
  });
});

describe("activity types", () => {
  it("expands 'all' to every type of the mode", () => {
    expect(parseTypeValues("all", "vocab")).toEqual(["typing", "listening", "reading"]);
    expect(parseTypeValues(null, "lesson")).toEqual([
      "listening",
      "meaning",
      "typing",
      "reorder",
    ]);
  });

  it("keeps only the types belonging to the mode, in option order", () => {
    expect(parseTypeValues("reading,typing", "vocab")).toEqual(["typing", "reading"]);
    expect(parseTypeValues("reorder", "vocab")).toEqual(["typing", "listening", "reading"]);
  });

  it("maps vocab types onto the trainer's internal activities", () => {
    expect(vocabActivityTypes("listening,reading")).toEqual(["listen", "reading"]);
    expect(vocabActivityTypes("all")).toEqual(["typing", "listen", "reading"]);
  });
});

describe("collectRoomSettings", () => {
  const form = {
    mode: "vocab" as const,
    types: ["typing"],
    passageIds: ["H2_1_1", "H1_3_2"],
    maxUsers: 8,
    sectionTimeoutMinutes: 15,
  };

  it("sends the lowest level of the picked parts", () => {
    expect(collectRoomSettings(form)).toEqual({
      category: "vocab",
      activity_type: "typing",
      level: 1,
      passage_ids: ["H2_1_1", "H1_3_2"],
      max_users: 8,
      section_timeout_minutes: 15,
    });
  });

  it("falls back to 'all' when no type is selected", () => {
    expect(collectRoomSettings({ ...form, types: [] })?.activity_type).toBe("all");
  });

  it("defaults the level when the ids carry none", () => {
    expect(collectRoomSettings({ ...form, passageIds: ["AML"] })?.level).toBe(1);
  });

  it("rejects a form with no part picked", () => {
    expect(collectRoomSettings({ ...form, passageIds: [] })).toBeNull();
  });
});

describe("roomSummary", () => {
  const room = {
    id: 1,
    room_code: "ABC123",
    host_user_id: 7,
    level: 1,
    passage_ids: ["H1_1_1", "H1_1_2", "H2_3_1"],
    word_count: 12,
    max_users: 8,
    section_timeout_minutes: 15,
    status: "waiting",
    created_at: null,
    updated_at: null,
    category: "vocab",
    activity_type: "typing,listening",
    members: [{ user_id: 7, username: "user1", role: "host", status: "online", joined_at: null }],
    chat: [],
    session: null,
  } as CompetitionRoom;

  it("summarizes levels, lessons, parts and members", () => {
    expect(roomSummary(room)).toMatchObject({
      hskLabel: "HSK 1, HSK 2",
      lessonCount: 2,
      partCount: 3,
      count: 12,
      memberCount: 1,
      isLesson: false,
      allTypes: false,
      typeKeys: ["competition.type_typing", "competition.type_listening"],
    });
  });

  it("reports an all-rounder room so the component can use one label", () => {
    expect(roomSummary({ ...room, activity_type: "all" })).toMatchObject({
      allTypes: true,
      typeKeys: [],
    });
  });

  it("falls back to the room's own level when the ids carry none", () => {
    expect(roomSummary({ ...room, passage_ids: [], level: 4 }).hskLabel).toBe("HSK 4");
  });
});

describe("lessonItemKey", () => {
  it("joins the passage and line the answer belongs to", () => {
    expect(lessonItemKey({ passage_id: "H1_10_1", line_id: 4 })).toBe("H1_10_1:4");
  });

  it("keeps line 0 and blanks a missing line", () => {
    expect(lessonItemKey({ passage_id: "H1_10_1", line_id: 0 })).toBe("H1_10_1:0");
    expect(lessonItemKey({ passage_id: "H1_10_1", line_id: null })).toBe("H1_10_1:");
    expect(lessonItemKey({})).toBe(":");
  });
});

describe("host controls", () => {
  const room = { host_user_id: 7, status: "waiting" } as CompetitionRoom;

  it("identifies the host", () => {
    expect(isRoomHost(room, 7)).toBe(true);
    expect(isRoomHost(room, 8)).toBe(false);
    expect(isRoomHost(null, 7)).toBe(false);
  });

  it("hides the host controls once the room is running", () => {
    expect(canManageRoom(room, 7)).toBe(true);
    expect(canManageRoom({ ...room, status: "running" }, 7)).toBe(false);
  });
});
