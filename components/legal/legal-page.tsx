import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LegalPage({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <Card className="bg-white/92">
        <CardHeader>
          <CardTitle className="text-3xl">{title}</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm leading-7 text-muted-foreground">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
