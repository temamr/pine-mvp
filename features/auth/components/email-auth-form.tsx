"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type EmailAuthMode = "sign-in" | "sign-up";

export function EmailAuthForm({ mode }: { mode: EmailAuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const redirectTo = searchParams.get("redirectTo") ?? "/onboarding";
  const configured = isSupabaseConfigured();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!configured) {
      toast({ title: "Вход пока недоступен", description: "Проверьте настройки проекта и перезапустите сайт." });
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const result =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=/onboarding`
            }
          });

    setLoading(false);

    if (result.error) {
      toast({ title: "Не удалось выполнить вход", description: result.error.message });
      return;
    }

    toast({
      title: mode === "sign-in" ? "Вход выполнен" : "Аккаунт создан",
      description: mode === "sign-in" ? "Перенаправляю в профиль." : "Проверьте email, если включено подтверждение."
    });
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <label className="grid gap-2 text-sm font-medium">
        Email
        <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Password
        <Input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          minLength={6}
          required
        />
      </label>
      <Button disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {mode === "sign-in" ? "Войти" : "Создать аккаунт"}
      </Button>
    </form>
  );
}
