import type { ReactNode } from "react";

import { GlowCard } from "./GlowCard";

export function PageCard({
  title,
  description,
  icon,
}: Readonly<{
  title: string;
  description: string;
  icon: ReactNode;
}>) {
  return (
    <GlowCard className="rounded-3xl border p-6">
      <div className="mb-4 inline-flex rounded-2xl border border-border bg-background/90 p-2.5 text-primary">
        {icon}
      </div>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-3 text-muted-foreground">{description}</p>
    </GlowCard>
  );
}
