import { useState } from "react";
import { Navigate, useLocation } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api-error";

// Match the existing backend login validation rules.
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .refine(
      (value) => new TextEncoder().encode(value).length <= 72,
      "Password must be 72 UTF-8 bytes or fewer",
    ),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// These are DEMO-ONLY accounts, not production credentials.
// This section is enabled during local development, or in a demo build
// when VITE_ENABLE_DEMO_LOGIN=true is provided at build time.
const showDemoAccounts =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_LOGIN === "true";

const demoAccounts = [
  {
    role: "Admin",
    email: "admin@example.test",
    password: "Arbaz@20262026",
    icon: ShieldCheck,
  },
  {
    role: "Manager",
    email: "manager@example.test",
    password: "Peter@20262026",
    icon: UsersRound,
  },
  {
    role: "Viewer",
    email: "viewer@example.test",
    password: "Harry@20262026",
    icon: Eye,
  },
] as const;

function BrandLogoPlaceholder() {
  return (
    <div
      className="mx-auto flex size-32 items-center justify-center rounded-[30px]
                 border border-primary/25 bg-primary/10
                 shadow-[0_20px_80px_-30px_rgba(254,104,7,0.45)]"
    >
      {/* Replace this placeholder SVG with the actual Optimus Fox logo later. */}
      <svg
        viewBox="0 0 96 96"
        fill="none"
        aria-label="Optimus Fox logo placeholder"
        role="img"
        className="size-20 text-primary"
      >
        <path
          d="M14 18L33 35L48 26L63 35L82 18L76 65L48 84L20 65L14 18Z"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M22 43L39 52L48 68L57 52L74 43"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M41 72L48 77L55 72"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function LoginPage() {
  const { login, status } = useAuth();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const requestedPath = (location.state as { from?: unknown } | null)?.from;
  const redirectTo =
    typeof requestedPath === "string" &&
    requestedPath.startsWith("/") &&
    !requestedPath.startsWith("//") &&
    !requestedPath.startsWith("/login")
      ? requestedPath
      : "/";

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values);
      // AuthProvider updates status; the Navigate below redirects the user.
    } catch (error) {
      setError("root.server", {
        type: "server",
        message: getApiErrorMessage(error),
      });
    }
  }

  function fillDemoCredentials(account: (typeof demoAccounts)[number]) {
    // reset updates both fields and clears previous validation/server errors.
    reset({ email: account.email, password: account.password });
    setShowPassword(false);
  }

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
      {/* Left: intentionally simple, centered product branding. */}
      <aside
        className="relative isolate hidden min-h-dvh items-center justify-center
                   overflow-hidden bg-[#111116] px-12 py-16 text-white lg:flex"
      >
        {/* Subtle visual texture. Uses the existing orange brand color. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-44 -left-52 size-[470px]
                     rounded-full bg-primary/10 blur-[110px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-48 -bottom-44 size-[500px]
                     rounded-full bg-primary/10 blur-[120px]"
        />

        <div className="relative z-10 w-full max-w-lg text-center">
          <BrandLogoPlaceholder />

          <div className="mt-10 space-y-3">
            <h2 className="text-4xl font-semibold tracking-tight xl:text-5xl">
              Optimus <span className="text-primary">Fox</span>
            </h2>
            <p className="text-sm font-medium tracking-[0.2em] text-white/70 uppercase">
              Project Management System
            </p>
          </div>

          <div
            className="mx-auto mt-9 h-px w-20 bg-primary/70"
            aria-hidden="true"
          />

          <p className="mx-auto mt-8 max-w-sm text-lg font-medium leading-8 text-white/85">
            Plan with purpose. Deliver with clarity.
          </p>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-white/50">
            Keep your projects, people, and progress connected in one
            streamlined workspace.
          </p>
        </div>
      </aside>

      {/* Right: login form and optional demo account selection. */}
      <section className="flex min-h-dvh flex-col bg-background px-6 py-8 sm:px-10 lg:px-14">
        {/* Small-screen branding, without the removed icon or theme toggle. */}
        <div className="lg:hidden">
          <p className="text-base font-semibold tracking-tight">
            Optimus <span className="text-primary">Fox</span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            Project Management System
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center py-10 lg:py-12">
          <div className="w-full max-w-[430px]">
            <div className="mb-8 space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Welcome back
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Sign in to manage your projects, collaborate with your team, and
                stay on top of what matters.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="login-email">Email address</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="username"
                  inputMode="email"
                  spellCheck={false}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.email}
                  aria-describedby={
                    errors.email ? "login-email-error" : undefined
                  }
                  className="h-11"
                  {...register("email")}
                />
                {errors.email && (
                  <p
                    id="login-email-error"
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "login-password-error" : undefined
                    }
                    className="h-11 pr-12"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    disabled={isSubmitting}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-1 flex size-10 items-center
                               justify-center rounded-md text-muted-foreground
                               hover:text-foreground focus-visible:outline-2
                               focus-visible:outline-offset-2 focus-visible:outline-ring
                               disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p
                    id="login-password-error"
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>

              {errors.root?.server && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30
                             bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {errors.root.server.message}
                </div>
              )}

              {status === "error" && (
                <p role="status" className="text-xs text-muted-foreground">
                  Your previous session could not be verified. You can try
                  signing in again.
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="mt-2 h-11 w-full"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            </form>

            {showDemoAccounts && (
              <div className="mt-9 border-t border-border pt-7">
                <div className="mb-4">
                  <p className="text-sm font-semibold">Explore demo roles</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Select a role to fill the credentials, then click Sign in.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {demoAccounts.map((account) => {
                    const Icon = account.icon;
                    return (
                      <button
                        key={account.role}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => fillDemoCredentials(account)}
                        aria-label={`Fill ${account.role} demo credentials`}
                        className="group flex min-h-24 flex-col items-center justify-center
                                   gap-2 rounded-xl border border-border bg-card px-2 py-3
                                   text-foreground transition-colors hover:border-primary/50
                                   hover:bg-accent focus-visible:outline-2
                                   focus-visible:outline-offset-2 focus-visible:outline-ring
                                   disabled:pointer-events-none disabled:opacity-50"
                      >
                        <span
                          className="flex size-9 items-center justify-center rounded-lg
                                     bg-primary/10 text-primary transition-colors
                                     group-hover:bg-primary/15"
                        >
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <span className="text-xs font-semibold">
                          {account.role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
