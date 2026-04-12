import type { ReactNode } from "react";
import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
  className
}: EmptyStateProps) {
  return (
    <section
      className={cn(
        "flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed bg-white/70 p-8 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-primary">
        {icon ?? <PackageOpen className="h-6 w-6" />}
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {actionLabel && actionHref ? (
        <Button className="mt-5" asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : actionLabel ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </section>
  );
}
