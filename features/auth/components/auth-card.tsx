"use client";

import type React from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type AuthCardProps = {
  title: string;
  eyebrow: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthCard({ title, eyebrow, description, children, footer }: AuthCardProps) {
  const configured = isSupabaseConfigured();

  return (
    <div className="mx-auto grid w-full max-w-lg gap-4">
      <Card className="bg-white/94 shadow-soft">
        <CardHeader>
          <Badge variant="secondary" className="w-fit">{eyebrow}</Badge>
          <CardTitle className="mt-2 text-2xl">{title}</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent>
          {!configured ? (
            <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
              <div className="flex gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Вход пока недоступен. Проверьте настройки проекта и попробуйте снова.
                </p>
              </div>
            </div>
          ) : null}
          {children}
        </CardContent>
      </Card>
      {footer ? <div className="text-center text-sm text-muted-foreground">{footer}</div> : null}
      <div className="text-center text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary">Вернуться в каталог</Link>
      </div>
    </div>
  );
}
