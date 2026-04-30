import { LegalPage } from "@/components/legal/legal-page";

export default function ContactPage() {
  return (
    <LegalPage
      title="Контакты"
      description="Если нужна помощь по сделке, жалобе или аккаунту, свяжитесь с командой Pine."
    >
      <p>Email поддержки: support@pine.local</p>
      <p>По вопросам безопасности и жалоб: safety@pine.local</p>
      <p>Мы стараемся отвечать как можно быстрее, особенно по вопросам активных сделок и жалоб.</p>
    </LegalPage>
  );
}
