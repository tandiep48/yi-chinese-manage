import { Roboto } from "next/font/google";
import { TopNav } from "@/components/layout/TopNav";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { HanziSettingsProvider } from "@/components/han/HanziSettingsProvider";

// Roboto — the Learning app's learner-facing font.
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});

export default function LearnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${roboto.variable} learner-theme flex h-full flex-col`}>
      <I18nProvider>
        <AuthProvider>
          <HanziSettingsProvider>
            <TopNav />
            <div className="flex flex-1 flex-col overflow-auto">{children}</div>
          </HanziSettingsProvider>
        </AuthProvider>
      </I18nProvider>
    </div>
  );
}
