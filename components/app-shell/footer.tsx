import Link from "next/link";

const footerLinks = [
  { label: "Политика конфиденциальности", href: "/privacy" },
  { label: "Условия использования", href: "/terms" },
  { label: "Файлы cookie", href: "/cookies" },
  { label: "Контакты", href: "/contact" },
  { label: "Помощь", href: "/help" }
];

export function Footer() {
  return (
    <footer className="border-t bg-white/88 backdrop-blur">
      <div className="mx-auto flex max-w-[96rem] flex-col gap-4 px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {footerLinks.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>
        <p>Pine. All rights reserved.</p>
      </div>
    </footer>
  );
}
