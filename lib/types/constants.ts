export const TYPE_CONSTANTS = {
  HSK_LEVELS: ["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"] as const,
  QUESTION_CATEGORIES: ["practice", "exam"] as const,
  QUESTION_SKILLS: ["listening", "reading"] as const,
  // static/grammar/grammar.js renders types 1-5 (section header, ... example dialogue)
  GRAMMAR_TYPES: [1, 2, 3, 4, 5] as const,
};
