// app/learner/lesson/basic-pinyin/page.tsx
// HSK 1 Lesson 1 — Basic Pinyin guide. Ported from Flask /lesson/basic-pinyin.

import { PinyinGuideLayout } from "@/components/page/learner/pinyin/PinyinGuideLayout";
import { BasicPinyinTable } from "@/components/page/learner/pinyin/BasicPinyinTable";

export default function BasicPinyinPage() {
  return (
    <PinyinGuideLayout active="basic">
      <BasicPinyinTable />
    </PinyinGuideLayout>
  );
}
