import { Roboto } from "next/font/google";
import { LearnerSidebar } from "@/components/layout/LearnerSidebar";
import { LearnerSessionProvider } from "@/components/layout/LearnerSessionContext";
import { I18nProvider, I18nRemount } from "@/components/i18n/I18nProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SupportProvider } from "@/components/page/learner/support/SupportContext";
import { SupportWidget } from "@/components/page/learner/support/SupportWidget";
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
    <div className={`${roboto.variable} learner-theme flex h-full`}>
      <AuthProvider>
        <I18nProvider>
          <HanziSettingsProvider>
            <LearnerSessionProvider>
              <LearnerSidebar />
              <main className="learner-main flex min-w-0 flex-1 flex-col overflow-auto">
                <SupportProvider>
                  <I18nRemount>{children}</I18nRemount>
                  <SupportWidget />
                </SupportProvider>
              </main>
            </LearnerSessionProvider>
          </HanziSettingsProvider>
        </I18nProvider>
      </AuthProvider>
    </div>
  );
}
