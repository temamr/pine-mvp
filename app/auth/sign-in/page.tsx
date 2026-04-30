import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/features/auth/components/auth-card";
import { EmailAuthForm } from "@/features/auth/components/email-auth-form";

export default function SignInPage() {
  return (
    <AuthCard
      eyebrow="Вход"
      title="Вход в Pine"
      description="Войдите по email и паролю, чтобы управлять профилем, объявлениями и сделками."
      footer={
        <>
          Нет аккаунта? <Link href="/auth/sign-up" className="font-semibold text-primary">Создать</Link>
          {" · "}
          <Link href="/auth/phone" className="font-semibold text-primary">Войти по телефону</Link>
        </>
      }
    >
      <Suspense fallback={<div className="text-sm text-muted-foreground">Загрузка формы входа...</div>}>
        <EmailAuthForm mode="sign-in" />
      </Suspense>
    </AuthCard>
  );
}
