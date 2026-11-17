import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { AlertCircle, RefreshCw } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api-error";

interface DashboardWidgetProps<TData> {
  title: string;
  description: string;
  query: UseQueryResult<TData, Error>;
  skeleton: ReactNode;
  render: (data: TData) => ReactNode;
  errorClassName?: string;
  warningClassName?: string;
}

/**
 * Each widget manages its own loading, error and success state.
 * Failed background refreshes preserve previously loaded data.
 */
export function DashboardWidget<TData>({
  title,
  description,
  query,
  skeleton,
  render,
  errorClassName = "",
  warningClassName = "",
}: DashboardWidgetProps<TData>) {
  const retry = () => void query.refetch();

  if (query.data === undefined) {
    if (query.isPending) {
      return (
        <>
          <span className="sr-only" role="status">
            Loading {title.toLowerCase()}...
          </span>
          {skeleton}
        </>
      );
    }

    return (
      <Card className={`min-w-0 ${errorClassName}`}>
        <CardHeader>
          <CardTitle>
            <h2 className="text-base font-semibold">{title}</h2>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        <CardContent className="min-h-60 justify-center">
          <ErrorState
            title={`Unable to load ${title.toLowerCase()}`}
            message={getApiErrorMessage(query.error)}
            onRetry={retry}
            isRetrying={query.isFetching}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {query.isError && (
        <div
          role="status"
          className={`mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm ${warningClassName}`}
        >
          <AlertCircle
            className="size-4 shrink-0 text-destructive"
            aria-hidden="true"
          />

          <div className="min-w-0 flex-1">
            <p className="font-medium">{title} could not refresh.</p>
            <p className="text-xs text-muted-foreground">
              Showing previously loaded data. {getApiErrorMessage(query.error)}
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={retry}
            disabled={query.isFetching}
          >
            <RefreshCw
              className={`size-4 ${
                query.isFetching
                  ? "animate-spin motion-reduce:animate-none"
                  : ""
              }`}
              aria-hidden="true"
            />
            {query.isFetching ? "Retrying..." : "Retry"}
          </Button>
        </div>
      )}

      {render(query.data)}
    </>
  );
}
