import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/features/auth/components/auth-card";
import { EmailAuthForm } from "@/features/auth/components/email-auth-form";

export default function SignUpPage() {
  return (
    <AuthCard
      eyebrow="Новый аккаунт"
      title="Создать профиль Pine"
      description="После регистрации вы сможете заполнить имя, фото и город."
      footer={
        <>
          Уже есть аккаунт? <Link href="/auth/sign-in" className="font-semibold text-primary">Войти</Link>
        </>
      }
    >
      <Suspense fallback={<div className="text-sm text-muted-foreground">Загрузка формы регистрации...</div>}>
        <EmailAuthForm mode="sign-up" />
      </Suspense>
    </AuthCard>
  );
}
