"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { BottomNav } from "@/components/app-shell/bottom-nav";
import { Header } from "@/components/app-shell/header";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";

export function AppShell({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto flex max-w-[96rem] gap-4 px-4 pb-28 pt-5 sm:px-6 md:pb-10 lg:gap-6 lg:px-8">
        <SidebarNav collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
