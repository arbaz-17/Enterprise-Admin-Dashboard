
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <section
      aria-label={title}
      className="flex min-h-64 flex-col
                 items-center justify-center
                 rounded-xl border border-dashed
                 border-border bg-card/50
                 px-6 py-10 text-center"
    >
      <div
        className="mb-4 flex size-12 items-center
                   justify-center rounded-xl
                   bg-muted text-muted-foreground"
      >
        <Icon
          className="size-6"
          aria-hidden="true"
        />
      </div>

      <h2 className="text-base font-semibold">
        {title}
      </h2>

      <p
        className="mt-2 max-w-sm text-sm
                   leading-6 text-muted-foreground"
      >
        {description}
      </p>

      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </section>
  );
}
