"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Heart, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/app-shell/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { getPrimaryNavItems, getSecondaryNavItems } from "@/components/app-shell/nav-items";
import { useSupabaseSession } from "@/features/auth/components/use-supabase-session";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PINE_BRAND } from "@/lib/theme";

export function Header() {
  const router = useRouter();
  const { toast } = useToast();
  const { configured, loading, user, profile } = useSupabaseSession();
  const userId = user?.id ?? null;
  const [unreadNotifications, setUnreadNotifications] = React.useState(0);
  const [favoritesCount, setFavoritesCount] = React.useState(0);
  const primaryNavItems = getPrimaryNavItems();
  const secondaryNavItems = getSecondaryNavItems(profile?.role);
  const displayName = configured ? profile?.display_name ?? user?.email ?? "Пользователь Pine" : "Eli Parker";
  const avatarUrl = configured
    ? profile?.avatar_url ?? undefined
    : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  React.useEffect(() => {
    if (!configured || !userId) {
      setUnreadNotifications(0);
      setFavoritesCount(0);
      return;
    }

    let active = true;
    const supabase = createSupabaseBrowserClient();
    const authenticatedUserId: string = userId;

    async function loadBadges() {
      const [{ count: notificationCount }, { count: favoriteCount }] = await Promise.all([
        supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", authenticatedUserId)
          .is("read_at", null),
        supabase
          .from("favorites")
          .select("*", { count: "exact", head: true })
          .eq("user_id", authenticatedUserId)
          .is("archived_at", null)
      ]);

      if (!active) {
        return;
      }

      setUnreadNotifications(notificationCount ?? 0);
      setFavoritesCount(favoriteCount ?? 0);
    }

    void loadBadges();

    const notificationsChannel = supabase
      .channel(`header-notifications:${authenticatedUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${authenticatedUserId}` },
        () => void loadBadges()
      )
      .subscribe();

    const favoritesChannel = supabase
      .channel(`header-favorites:${authenticatedUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "favorites", filter: `user_id=eq.${authenticatedUserId}` },
        () => void loadBadges()
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(notificationsChannel);
      void supabase.removeChannel(favoritesChannel);
    };
  }, [configured, userId]);

  async function signOut() {
    if (!configured) {
      toast({ title: "Демо-режим", description: "Вход станет доступен после настройки проекта." });
      return;
    }

    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    toast({ title: "Вы вышли", description: "До встречи." });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white/88 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Открыть меню">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>{PINE_BRAND.name}</SheetTitle>
            </SheetHeader>
            <nav className="mt-8 grid gap-2">
              {[...primaryNavItems, ...secondaryNavItems].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            P
          </span>
          <span>Pine</span>
        </Link>

        <div className="hidden flex-1 items-center md:flex">
          <div className="relative mx-auto w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Поиск телефонов, ноутбуков, видеокарт" />
          </div>
        </div>

        <Button asChild className="ml-auto hidden md:inline-flex">
          <Link href="/sell">Создать объявление</Link>
        </Button>

        <ThemeToggle />

        <Button asChild variant="ghost" size="icon" aria-label="Избранное" className="relative">
          <Link href="/favorites">
            <Heart className="h-5 w-5" />
            {favoritesCount ? (
              <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
                {favoritesCount > 99 ? "99+" : favoritesCount}
              </Badge>
            ) : null}
          </Link>
        </Button>

        <Button asChild variant="ghost" size="icon" aria-label="Уведомления" className="relative">
          <Link href="/notifications">
            <Bell className="h-5 w-5" />
            {unreadNotifications ? (
              <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </Badge>
            ) : null}
          </Link>
        </Button>

        {configured && !loading && !user ? (
          <Button asChild variant="outline">
            <Link href="/auth/sign-in">Войти</Link>
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback>{initials || "P"}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/profile">Профиль</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/onboarding">Редактировать профиль</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile/listings">Мои объявления</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
