"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function PhoneOtpForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [phone, setPhone] = React.useState("");
  const [token, setToken] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const configured = isSupabaseConfigured();

  async function sendOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!configured) {
      toast({ title: "Вход по телефону недоступен", description: "Проверьте настройки проекта и попробуйте снова." });
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);

    if (error) {
      toast({ title: "Не удалось отправить код", description: error.message });
      return;
    }

    setSent(true);
    toast({ title: "Код отправлен", description: "Введите SMS-код для входа." });
  }

  async function verifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!configured) {
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
    setLoading(false);

    if (error) {
      toast({ title: "Код не подошел", description: error.message });
      return;
    }

    toast({ title: "Телефон подтвержден", description: "Перенаправляю к заполнению профиля." });
    router.push("/onboarding");
    router.refresh();
  }

  if (sent) {
    return (
      <form className="grid gap-4" onSubmit={verifyOtp}>
        <label className="grid gap-2 text-sm font-medium">
          Код из SMS
          <Input value={token} onChange={(event) => setToken(event.target.value)} inputMode="numeric" required />
        </label>
        <Button disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Подтвердить
        </Button>
        <Button type="button" variant="ghost" onClick={() => setSent(false)}>
          Изменить номер
        </Button>
      </form>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={sendOtp}>
      <label className="grid gap-2 text-sm font-medium">
        Номер телефона
        <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+79991234567" required />
      </label>
      <Button disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Отправить код
      </Button>
    </form>
  );
}
