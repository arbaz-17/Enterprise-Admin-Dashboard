
import { AlertCircle, RefreshCw } from "lucide-react";

import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";

import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  isRetrying = false,
}: ErrorStateProps) {
  return (
    <Alert
      variant="destructive"
      className="w-full"
    >
      <AlertCircle
        className="size-4"
        aria-hidden="true"
      />

      <AlertTitle>
        {title}
      </AlertTitle>

      <AlertDescription>
        <p>{message}</p>

        {onRetry && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isRetrying}
            onClick={onRetry}
            className="mt-4"
          >
            <RefreshCw
              className={
                isRetrying
                  ? "size-4 animate-spin motion-reduce:animate-none"
                  : "size-4"
              }
              aria-hidden="true"
            />

            {isRetrying ? "Retrying..." : "Try again"}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
