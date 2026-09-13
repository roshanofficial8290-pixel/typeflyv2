import type { ReactNode } from "react";
import { SiteLayout } from "./SiteLayout";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: 1 September 2026</p>
        <div className="panel mt-6 space-y-5 p-8 leading-relaxed [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold">
          {children}
        </div>
      </div>
    </SiteLayout>
  );
}
