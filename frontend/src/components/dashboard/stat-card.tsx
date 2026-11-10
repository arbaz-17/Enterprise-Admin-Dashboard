
import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

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
    <Card className="min-w-0 gap-0 py-5">
      <CardContent className="gap-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>

          <div
            className="flex size-10 shrink-0 items-center
                       justify-center rounded-lg
                       bg-primary/10 text-primary"
          >
            <Icon
              className="size-5"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="space-y-1">
          <p
            className="text-3xl font-semibold
                       tracking-tight tabular-nums"
          >
            {value.toLocaleString("en-US")}
          </p>

          <p className="text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
