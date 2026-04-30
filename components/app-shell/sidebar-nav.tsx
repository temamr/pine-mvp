"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { getPrimaryNavItems, getSecondaryNavItems } from "@/components/app-shell/nav-items";
import { useSupabaseSession } from "@/features/auth/components/use-supabase-session";

type SidebarNavProps = {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
};

export function SidebarNav({ collapsed, onCollapsedChange }: SidebarNavProps) {
  const pathname = usePathname();
  const { profile } = useSupabaseSession();
  const primaryNavItems = getPrimaryNavItems();
  const secondaryNavItems = getSecondaryNavItems(profile?.role);
  const hasSectionItems = secondaryNavItems.length > 0;

  return (
    <aside
      className={cn(
        "sticky top-20 hidden h-[calc(100vh-5rem)] shrink-0 transition-[width] duration-200 md:block",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("mb-4 flex", collapsed ? "justify-center" : "justify-end")}>
        <Button
          variant="outline"
          size="icon"
          aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
          onClick={() => onCollapsedChange(!collapsed)}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="grid gap-2">
        {primaryNavItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white hover:text-foreground",
                collapsed ? "justify-center px-2" : "gap-3 px-3",
                isActive && "bg-white text-primary shadow-sm"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 border-t pt-5">
        {hasSectionItems ? (
          <>
            {collapsed ? null : (
              <p className="px-3 text-xs font-semibold uppercase text-muted-foreground">
                {profile?.role === "admin" || profile?.role === "moderator" ? "Управление" : "Сделки"}
              </p>
            )}
            <nav className="mt-2 grid gap-2">
              {secondaryNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-lg py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white hover:text-foreground",
                    collapsed ? "justify-center px-2" : "gap-3 px-3"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
                </Link>
              ))}
            </nav>
          </>
        ) : null}
      </div>
    </aside>
  );
}
