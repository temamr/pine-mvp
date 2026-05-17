import { formatDistanceToNowStrict } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import type { Money } from "@/lib/domain";

function currentLocale() {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem("pine-language") === "en" ? "en-AE" : "ru-RU";
  }

  return "ru-RU";
}

export function formatMoney(money: Money) {
  return new Intl.NumberFormat(currentLocale(), {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0
  }).format(money.amount);
}

export function formatRelativeDate(date: string) {
  const isEnglish = typeof window !== "undefined" && window.localStorage.getItem("pine-language") === "en";

  return formatDistanceToNowStrict(new Date(date), {
    addSuffix: true,
    locale: isEnglish ? enUS : ru
  });
}
