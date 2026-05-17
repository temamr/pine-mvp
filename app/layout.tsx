import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { ToasterProvider } from "@/components/ui/toast";
import { LanguageProvider } from "@/lib/i18n/language-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pine",
  description: "Pine — площадка для покупки и продажи электроники с объявлениями, чатом и сделками.",
  icons: {
    icon: "/icon"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <LanguageProvider>
          <ToasterProvider>
            <AppShell>{children}</AppShell>
          </ToasterProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
