import {
  BarChart3,
  Heart,
  Home,
  MessageCircle,
  Package,
  PackageCheck,
  PlusCircle,
  ShieldCheck,
  UserRound
} from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";

type ProfileRole = Tables<"profiles">["role"] | null | undefined;

export const primaryNavItems = [
  { label: "Каталог", href: "/", icon: Home },
  { label: "Создать объявление", href: "/sell", icon: PlusCircle },
  { label: "Мои объявления", href: "/profile/listings", icon: Package },
  { label: "Чат", href: "/chat", icon: MessageCircle },
  { label: "Избранное", href: "/favorites", icon: Heart },
  { label: "Профиль", href: "/profile", icon: UserRound }
] as const;

export const secondaryNavItems = [
  { label: "Модерация", href: "/moderation", icon: ShieldCheck },
  { label: "Сделки", href: "/deals", icon: PackageCheck },
  { label: "Метрики", href: "/analytics", icon: BarChart3 }
] as const;

export function getPrimaryNavItems() {
  return primaryNavItems;
}

export function getSecondaryNavItems(role: ProfileRole) {
  const isStaff = role === "admin" || role === "moderator";

  if (isStaff) {
    return secondaryNavItems;
  }

  return secondaryNavItems.filter((item) => item.href === "/deals");
}
