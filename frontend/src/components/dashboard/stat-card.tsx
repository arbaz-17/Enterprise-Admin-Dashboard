import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: StatCardProps) {
  return (
    <Card className="min-w-0 gap-0 py-4">
      <CardContent className="px-5">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-medium text-muted-foreground">
            {title}
          </p>

          <Icon
            className="size-5 shrink-0 text-primary"
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </div>

        <p className="mt-3 text-3xl font-semibold leading-none tracking-tight tabular-nums">
          {value.toLocaleString("en-US")}
        </p>

        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
