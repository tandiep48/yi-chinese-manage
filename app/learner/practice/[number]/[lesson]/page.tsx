import { use } from "react";
import { PracticeRunner } from "@/components/page/learner/practice/PracticeRunner";

export default function PracticeRunPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string; lesson: string }>;
  searchParams: Promise<{ progress?: string }>;
}) {
  const { number, lesson } = use(params);
  const { progress } = use(searchParams);
  return (
    <PracticeRunner category="practice" number={number} lessonId={lesson} progress={progress} />
  );
}
