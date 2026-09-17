"use client";

// components/page/learner/practice/QuestionGroup.tsx
// Declarative React port of the question-type renderers in
// Learning/web_app/static/practice/practice_engine.js (buildGroupContent /
// renderQuestion and the type-2/5/6 group layouts). The engine mutated the DOM
// imperatively; here rendering is derived from the per-group state held by
// usePracticeEngine, so a "check" simply re-renders with feedback/highlights.
//
// This file is only the dispatcher: the layouts and the widgets they share
// live in ./question-types/.

import { classifyGroupLayout } from "@/lib/practice/practiceEngine";
import { SingleGroup } from "./question-types/SingleGroup";
import { T5ListeningGroup } from "./question-types/T5ListeningGroup";
import { T5ReadingMatchGroup } from "./question-types/T5ReadingMatchGroup";
import { Type2Group } from "./question-types/Type2Group";
import { Type6Group } from "./question-types/Type6Group";
import type { GroupProps } from "./question-types/types";

export function QuestionGroup(props: GroupProps) {
  const layout = classifyGroupLayout(props.group);
  switch (layout) {
    case "type2":
      return <Type2Group {...props} />;
    case "t5-listening":
      return <T5ListeningGroup {...props} />;
    case "t5-reading-match":
      return <T5ReadingMatchGroup {...props} imageMode={false} />;
    case "t5-reading-image":
      return <T5ReadingMatchGroup {...props} imageMode />;
    case "type6-group":
      return <Type6Group {...props} />;
    default:
      return <SingleGroup {...props} />;
  }
}
