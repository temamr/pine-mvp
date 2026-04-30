import { formatDistanceToNowStrict } from "date-fns";
import { ru } from "date-fns/locale";
import type { Money } from "@/lib/domain";

export function formatMoney(money: Money) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(money.amount);
}

export function formatRelativeDate(date: string) {
  return formatDistanceToNowStrict(new Date(date), {
    addSuffix: true,
    locale: ru
  });
}
