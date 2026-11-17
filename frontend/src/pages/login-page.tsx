import { Navigate, useLocation } from "react-router";
import { LoaderCircle } from "lucide-react";
import { BrandMark } from "@/components/shared/logo";
import { useAuth } from "@/hooks/use-auth";
import { LoginBrandPanel } from "@/features/auth/login-brand-panel";
import { LoginForm } from "@/features/auth/login-form";
import { getRedirectPath } from "@/features/auth/login.utils";

export function LoginPage() {
  const { status } = useAuth();
  const location = useLocation();
  const requestedPath = (location.state as { from?: unknown } | null)?.from;
  const redirectTo = getRedirectPath(requestedPath);

  if (status === "loading") {
    return (
      <main
        className="flex min-h-dvh items-center justify-center gap-3
                   bg-background text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
        <span className="text-sm">Checking your session...</span>
      </main>
    );
  }

  if (status === "authenticated") {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <LoginBrandPanel />

      <section
        aria-labelledby="login-title"
        className="flex min-h-dvh flex-col bg-background px-6 py-8 sm:px-10 lg:px-14"
      >
        <div className="flex items-center gap-3 lg:hidden">
          <div
            className="flex size-10 shrink-0 items-center justify-center
                       rounded-xl border border-primary/20 bg-primary/10"
          >
            <BrandMark className="size-7 text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight">
              Optimus{" "}
              <span className="text-[#B94A00] dark:text-primary">Fox</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Project Management System
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-10 lg:py-12">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
