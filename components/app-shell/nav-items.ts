import {
  BarChart3,
  Heart,
  Home,
  MessageCircle,
  PackageCheck,
  PlusCircle,
  ShieldCheck,
  UserRound
} from "lucide-react";

export const primaryNavItems = [
  { label: "Каталог", href: "/", icon: Home },
  { label: "Создать", href: "/sell", icon: PlusCircle },
  { label: "Чат", href: "/chat", icon: MessageCircle },
  { label: "Избранное", href: "/favorites", icon: Heart },
  { label: "Профиль", href: "/profile", icon: UserRound }
] as const;

export const secondaryNavItems = [
  { label: "Модерация", href: "/moderation", icon: ShieldCheck },
  { label: "Сделки", href: "/deals", icon: PackageCheck },
  { label: "Метрики", href: "/analytics", icon: BarChart3 }
] as const;
