import Link from "next/link";
import { AuthCard } from "@/features/auth/components/auth-card";
import { PhoneOtpForm } from "@/features/auth/components/phone-otp-form";

export default function PhoneAuthPage() {
  return (
    <AuthCard
      eyebrow="Phone OTP"
      title="Вход по телефону"
      description="OTP flow подготовлен для Supabase phone auth. Номер должен быть в международном формате."
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
