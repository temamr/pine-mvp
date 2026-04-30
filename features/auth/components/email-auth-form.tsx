"use client";

import * as React from "react";
import Link from "next/link";
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
  const [acceptedPolicies, setAcceptedPolicies] = React.useState(mode === "sign-in");
  const redirectTo = searchParams.get("redirectTo") ?? "/onboarding";
  const configured = isSupabaseConfigured();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!configured) {
      toast({ title: "Вход пока недоступен", description: "Проверьте настройки проекта и перезапустите сайт." });
      return;
    }

    if (mode === "sign-up" && !acceptedPolicies) {
      toast({
        title: "Нужно согласие",
        description: "Подтвердите согласие на обработку персональных данных, чтобы продолжить."
      });
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
      if (mode === "sign-up" && result.error.message.toLowerCase().includes("already registered")) {
        toast({
          title: "Аккаунт уже существует",
          description: "Попробуйте войти с этим email."
        });
        router.push(`/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`);
        return;
      }

      toast({ title: "Не удалось выполнить вход", description: result.error.message });
      return;
    }

    if (mode === "sign-up") {
      const hasSession = Boolean(result.data.session);
      const hasIdentity = Boolean(result.data.user?.identities?.length);

      if (!hasSession) {
        toast({
          title: hasIdentity ? "Аккаунт создан" : "Аккаунт уже существует",
          description: hasIdentity
            ? "Подтвердите email, если это требуется, затем войдите в аккаунт."
            : "Для этого email уже есть аккаунт. Выполните вход."
        });
        router.push(`/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`);
        return;
      }
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
      {mode === "sign-up" ? (
        <label className="flex items-start gap-3 rounded-lg border bg-card/60 p-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={acceptedPolicies}
            onChange={(event) => setAcceptedPolicies(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border"
            required
          />
          <span>
            Я соглашаюсь с обработкой персональных данных и принимаю{" "}
            <Link href="/privacy" className="font-medium text-primary hover:underline">
              политику конфиденциальности
            </Link>{" "}
            и{" "}
            <Link href="/terms" className="font-medium text-primary hover:underline">
              условия использования
            </Link>
            .
          </span>
        </label>
      ) : null}
      <Button disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {mode === "sign-in" ? "Войти" : "Создать аккаунт"}
      </Button>
    </form>
  );
}
