"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { getPrimaryNavItems } from "@/components/app-shell/nav-items";

export function BottomNav() {
  const pathname = usePathname();
  const primaryNavItems = getPrimaryNavItems();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t bg-white/94 px-2 py-2 backdrop-blur md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {primaryNavItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium text-muted-foreground",
                isActive && "bg-primary/10 text-primary"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
