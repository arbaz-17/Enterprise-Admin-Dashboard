
import { LoaderCircle } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({
  message = "Loading content...",
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-48 flex-col
                 items-center justify-center
                 gap-3 rounded-xl p-6 text-center"
    >
      <LoaderCircle
        className="size-6 animate-spin
                   text-primary
                   motion-reduce:animate-none"
        aria-hidden="true"
      />

      <p className="text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
