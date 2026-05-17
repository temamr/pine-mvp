"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-provider";

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();
  const nextLabel = language === "en" ? "RU" : "EN";

  return (
    <Button variant="ghost" size="sm" className="gap-2 px-2" aria-label="Switch language" onClick={toggleLanguage}>
      <Languages className="h-4 w-4" />
      <span className="text-xs font-semibold">{nextLabel}</span>
    </Button>
  );
}
