import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { ToasterProvider } from "@/components/ui/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pine",
  description: "Pine — площадка для покупки и продажи электроники с объявлениями, чатом и сделками."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <ToasterProvider>
          <AppShell>{children}</AppShell>
        </ToasterProvider>
      </body>
    </html>
  );
}
