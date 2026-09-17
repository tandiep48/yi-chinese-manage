import { use } from "react";
import { PracticeLessonSelect } from "@/components/page/learner/practice/PracticeLessonSelect";

export default function PracticeLessonSelectPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = use(params);
  return <PracticeLessonSelect category="practice" number={number} />;
}
