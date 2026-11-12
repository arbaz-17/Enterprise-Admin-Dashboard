import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header
      className="flex flex-col gap-4 sm:flex-row
                 sm:items-start sm:justify-between sm:gap-6"
    >
      <div className="min-w-0 space-y-1.5">
        <h1
          className="text-2xl font-semibold leading-tight
                     tracking-tight text-foreground sm:text-[28px]"
        >
          {title}
        </h1>

        {description && (
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div
          className="flex flex-wrap items-center gap-2
                     sm:shrink-0 sm:justify-end sm:pt-0.5"
        >
          {actions}
        </div>
      )}
    </header>
  );
}
