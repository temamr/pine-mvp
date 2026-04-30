import Link from "next/link";
import { AuthCard } from "@/features/auth/components/auth-card";
import { PhoneOtpForm } from "@/features/auth/components/phone-otp-form";

export default function PhoneAuthPage() {
  return (
    <AuthCard
      eyebrow="Телефон"
      title="Вход по телефону"
      description="Введите номер в международном формате, и мы отправим код подтверждения."
      footer={
        <>
          Предпочитаете email? <Link href="/auth/sign-in" className="font-semibold text-primary">Войти по email</Link>
        </>
      }
    >
      <PhoneOtpForm />
    </AuthCard>
  );
}
