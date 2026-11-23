import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ManageShell } from "@/components/layout/ManageShell";

export const metadata: Metadata = {
  title: "Yi Chinese — Admin",
  description: "Admin management panel for Yi Chinese learning platform",
};

export default function ManageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <ManageShell>{children}</ManageShell>
    </AuthProvider>
  );
}
