// app/learner/lesson/advanced-pinyin/page.tsx
// HSK 1 Lesson 1 — Advanced Pinyin guide. Ported from Flask /lesson/advanced-pinyin.

import { PinyinGuideLayout } from "@/components/page/learner/pinyin/PinyinGuideLayout";
import { AdvancedPinyinTable } from "@/components/page/learner/pinyin/AdvancedPinyinTable";

export default function AdvancedPinyinPage() {
  return (
    <PinyinGuideLayout active="advanced">
      <AdvancedPinyinTable />
    </PinyinGuideLayout>
  );
}
