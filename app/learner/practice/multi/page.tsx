import { PracticeRunner } from "@/components/page/learner/practice/PracticeRunner";

// /practice/multi — bottom-nav shell, entered from Recommend with a queue in
// sessionStorage("multi_practice_queue"). Category comes from the queued items.
export default function PracticeMultiPage() {
  return <PracticeRunner category="practice" multi />;
}
