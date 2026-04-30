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
      <div className="mx-auto grid max-w-[96rem] gap-4 px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:grid-cols-[auto_1fr] lg:items-center lg:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            P
          </span>
          <div>
            <p className="font-semibold text-foreground">Pine</p>
            <p className="text-xs text-muted-foreground">Marketplace для электроники</p>
          </div>
        </div>
        <div className="grid gap-3 lg:justify-items-end">
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {footerLinks.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-primary">
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-muted-foreground">Pine. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
