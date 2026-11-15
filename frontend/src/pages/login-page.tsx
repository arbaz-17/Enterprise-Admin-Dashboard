import { useState } from "react";
import { Navigate, useLocation } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { BrandMark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api-error";

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

function getRedirectPath(from: unknown) {
  if (
    typeof from !== "string" ||
    !from.startsWith("/") ||
    from.startsWith("//") ||
    from.includes("\\") ||
    /^\/login(?:\/|[?#]|$)/i.test(from)
  ) {
    return "/";
  }

  return from;
}

export function LoginPage() {
  const { login, status } = useAuth();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const [emailValue, passwordValue] = useWatch({
    control,
    name: ["email", "password"],
  });

  const selectedDemoRole = showDemoAccounts
    ? demoAccounts.find(
        (account) =>
          account.email === emailValue && account.password === passwordValue,
      )?.role
    : undefined;

  const requestedPath = (location.state as { from?: unknown } | null)?.from;
  const redirectTo = getRedirectPath(requestedPath);

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values);
    } catch (error) {
      setError("root.server", {
        type: "server",
        message: getApiErrorMessage(error),
      });
    }
  }

  function fillDemoCredentials(account: (typeof demoAccounts)[number]) {
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
      <aside
        className="relative isolate hidden min-h-dvh items-center justify-center
                   overflow-hidden bg-[#111116] px-12 py-16 text-white lg:flex"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "52px 52px",
            maskImage:
              "radial-gradient(ellipse at center, black, transparent 82%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-44 -left-52 size-[470px]
                     rounded-full bg-primary/15 blur-[110px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-48 -bottom-44 size-[500px]
                     rounded-full bg-primary/10 blur-[120px]"
        />

        <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute inset-0 scale-125 rounded-[30px] bg-primary/15 blur-2xl"
            />
            <div
              className="relative flex size-28 items-center justify-center
                         rounded-[28px] border border-primary/25 bg-primary/10
                         shadow-[0_20px_80px_-30px_rgba(254,104,7,0.45)]"
            >
              <BrandMark className="size-20 text-primary" />
            </div>
          </div>

          <div className="mt-10 space-y-3">
            <p className="text-4xl font-semibold tracking-tight xl:text-5xl">
              Optimus <span className="text-primary">Fox</span>
            </p>
            <p className="text-sm font-medium tracking-[0.16em] text-white/65 uppercase">
              Project Management System
            </p>
          </div>

          <div
            aria-hidden="true"
            className="my-9 h-px w-24 bg-gradient-to-r
                       from-transparent via-primary to-transparent"
          />

          <p className="max-w-sm text-xl font-medium leading-8 tracking-tight text-white/90">
            Bring your team's work into focus.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/60">
            Keep priorities clear, projects moving, and everyone aligned in one
            workspace.
          </p>
        </div>
      </aside>

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
          <div className="w-full max-w-[430px]">
            <div className="mb-8 space-y-3">
              <h1
                id="login-title"
                className="text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                Welcome back
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Manage your projects, collaborate with your team, and stay on
                top of what matters.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              aria-busy={isSubmitting}
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
                    Choose a role to fill the credentials, then select Sign in.
                  </p>
                </div>
                <div
                  role="group"
                  aria-label="Demo accounts"
                  className="grid grid-cols-3 gap-2.5"
                >
                  {demoAccounts.map((account) => {
                    const Icon = account.icon;
                    const isSelected = selectedDemoRole === account.role;

                    return (
                      <button
                        key={account.role}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => fillDemoCredentials(account)}
                        aria-label={`Fill ${account.role} demo credentials`}
                        aria-pressed={isSelected}
                        className={`group relative flex min-h-28 flex-col items-center
                                   justify-center gap-2 rounded-xl border px-2 py-3
                                   text-foreground transition-colors
                                   focus-visible:outline-2 focus-visible:outline-offset-2
                                   focus-visible:outline-ring disabled:pointer-events-none
                                   disabled:opacity-50 ${
                                     isSelected
                                       ? "border-primary/70 bg-primary/5 ring-1 ring-primary/25"
                                       : "border-border bg-card hover:border-primary/40 hover:bg-accent"
                                   }`}
                      >
                        {isSelected && (
                          <span
                            className="absolute top-2 right-2 flex size-4 items-center
                                       justify-center rounded-full bg-primary
                                       text-primary-foreground"
                          >
                            <Check className="size-3" aria-hidden="true" />
                          </span>
                        )}
                        <span
                          className={`flex size-9 items-center justify-center
                                     rounded-lg transition-colors ${
                                       isSelected
                                         ? "bg-primary/15 text-primary"
                                         : "bg-primary/10 text-primary group-hover:bg-primary/15"
                                     }`}
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
