
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router";

import {
  LoaderCircle,
  LockKeyhole,
  ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

import type { Permission } from "./auth.types";

interface ProtectedRouteProps {
  requiredPermission?: Permission;
}

export function ProtectedRoute({
  requiredPermission,
}: ProtectedRouteProps) {
  const location = useLocation();

  const {
    status,
    hasPermission,
    retrySession,
  } = useAuth();

  // Wait for session restoration.
  if (status === "loading") {
    return (
      <main
        role="status"
        aria-live="polite"
        className="flex min-h-dvh items-center
                   justify-center gap-3"
      >
        <LoaderCircle
          className="size-5 animate-spin
                     motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span className="text-sm text-muted-foreground">
          Checking your session...
        </span>
      </main>
    );
  }

  // Network/server errors should not be treated as logout.
  if (status === "error") {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <div className="max-w-sm space-y-4 text-center">
          <ShieldAlert
            className="mx-auto size-10 text-destructive"
            aria-hidden="true"
          />

          <h1 className="text-xl font-semibold">
            Unable to verify session
          </h1>

          <p className="text-sm text-muted-foreground">
            We couldn't confirm your session.
            Check your connection and try again.
          </p>

          <Button onClick={() => void retrySession()}>
            Retry
          </Button>
        </div>
      </main>
    );
  }

  // User is not logged in.
  if (status === "unauthenticated") {
    const from =
      location.pathname +
      location.search +
      location.hash;

    return (
      <Navigate
        to="/login"
        replace
        state={{ from }}
      />
    );
  }

  // Authenticated, but missing the required permission.
  if (
    requiredPermission &&
    !hasPermission(requiredPermission)
  ) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <div className="max-w-sm space-y-4 text-center">
          <LockKeyhole
            className="mx-auto size-10 text-muted-foreground"
            aria-hidden="true"
          />

          <p className="text-sm font-medium text-primary">
            403 — Forbidden
          </p>

          <h1 className="text-2xl font-semibold">
            Access denied
          </h1>

          <p className="text-sm text-muted-foreground">
            You don't have permission to access this page.
          </p>

          <Button asChild variant="outline">
            <a href="/">Return to Dashboard</a>
          </Button>
        </div>
      </main>
    );
  }

  return <Outlet />;
}
