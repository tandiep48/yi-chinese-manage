// components/page/learner/practice/question-types/types.ts
// The prop contract every group layout shares. QuestionGroup picks a layout
// with classifyGroupLayout and hands it exactly these props.

import type { GroupUIState } from "@/lib/practice/groupState";
import type { PracticeCategory, PracticeGroup } from "@/lib/types/practice";

export type TFn = (key: string, vars?: Record<string, string | number>) => string;

export interface GroupProps {
  group: PracticeGroup;
  state: GroupUIState;
  category: PracticeCategory;
  onSelectMC: (blockId: string, key: string) => void;
  onSelectKey: (blockId: string, key: string) => void;
  onToggleChip: (blockId: string, key: string) => void;
  onBlankClick: (blockId: string, index: number) => void;
  onAssignT6: (key: string) => void;
}
