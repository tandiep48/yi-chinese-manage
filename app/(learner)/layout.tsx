import { TopNav } from "@/components/layout/TopNav";

export default function LearnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-full flex-col">
      <TopNav />
      <div className="flex flex-1 flex-col overflow-auto">{children}</div>
    </div>
  );
}
