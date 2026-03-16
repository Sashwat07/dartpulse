import * as React from "react";

export type PageHeaderProps = {
  title: string;
  description?: string;
  rightSlot?: React.ReactNode;
};

export function PageHeader({ title, description, rightSlot }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-mutedForeground">{description}</p> : null}
      </div>
      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </header>
  );
}

