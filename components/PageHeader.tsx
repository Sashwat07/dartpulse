import * as React from "react";

export type PageHeaderProps = {
  title: string;
  description?: string;
  rightSlot?: React.ReactNode;
};

export function PageHeader({ title, description, rightSlot }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="space-y-1.5">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground leading-tight sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-mutedForeground leading-relaxed max-w-2xl">{description}</p>
        ) : null}
      </div>
      {rightSlot ? <div className="shrink-0 pt-0.5">{rightSlot}</div> : null}
    </header>
  );
}
