
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
  PanelsTopLeft,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/theme/mode-toggle";

import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api-error";

// Match the existing backend login validation rules.
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),

  password: z
    .string()
    .min(1, "Password is required")
    .refine(
      (value) => new TextEncoder().encode(value).length <= 72,
      "Password must be 72 UTF-8 bytes or fewer"
    ),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, status } = useAuth();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Stage 4 will pass the originally requested protected route.
  const requestedPath = (location.state as {
    from?: unknown;
  } | null)?.from;

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
      // AuthProvider updates status to "authenticated".
      // The Navigate below handles the redirect.
    } catch (error) {
      setError("root.server", {
        type: "server",
        message: getApiErrorMessage(error),
      });
    }
  }

  // Wait until session restoration finishes.
  if (status === "loading") {
    return (
      <main
        className="flex min-h-dvh items-center justify-center
                   gap-3 bg-background text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <LoaderCircle
          className="size-5 animate-spin"
          aria-hidden="true"
        />
        <span className="text-sm">Checking your session...</span>
      </main>
    );
  }

  // Already authenticated? Skip login.
  if (status === "authenticated") {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* Left: brand panel, desktop only */}
      <aside
        className="hidden flex-col justify-between
                   bg-[#111116] p-10 text-white
                   lg:flex xl:p-14"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex size-11 items-center justify-center
                       rounded-xl bg-primary text-primary-foreground"
          >
            <PanelsTopLeft className="size-5" />
          </div>

          <div>
            <p className="text-base font-semibold">Enterprise</p>
            <p className="text-xs text-white/55">
              Admin Console
            </p>
          </div>
        </div>

        <div className="max-w-lg space-y-6">
          <div
            className="h-1 w-14 rounded-full bg-primary"
            aria-hidden="true"
          />

          <h2
            className="text-4xl leading-tight font-semibold
                       tracking-tight xl:text-5xl"
          >
            One workspace.
            <br />
            Complete clarity.
          </h2>

          <p className="max-w-md text-base leading-7 text-white/60">
            A central place for managing your organization,
            teams, projects, and business operations.
          </p>

          <div
            className="flex items-start gap-3 border-t
                       border-white/10 pt-6"
          >
            <ShieldCheck
              className="mt-0.5 size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium">
                Secure workspace access
              </p>
              <p className="mt-1 text-xs leading-5 text-white/50">
                Access is managed through your organization's
                authentication and authorization system.
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-white/40">
          Enterprise Administration Dashboard
        </p>
      </aside>

      {/* Right: login form */}
      <section
        className="flex min-h-dvh flex-col
                   px-6 py-6 sm:px-10 lg:px-14"
      >
        <div className="flex items-center justify-between lg:justify-end">
          {/* Mobile brand */}
          <div className="flex items-center gap-2 lg:hidden">
            <div
              className="flex size-9 items-center justify-center
                         rounded-lg bg-primary text-primary-foreground"
            >
              <PanelsTopLeft className="size-5" />
            </div>
            <span className="text-sm font-semibold">
              Enterprise
            </span>
          </div>

          <ModeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[420px]">
            <div className="mb-9 space-y-3">
              <p
                className="text-xs font-semibold tracking-widest
                           text-primary uppercase"
              >
                Workspace access
              </p>

              <h1
                className="text-3xl font-semibold tracking-tight
                           sm:text-4xl"
              >
                Welcome back
              </h1>

              <p className="text-sm leading-6 text-muted-foreground">
                Enter your credentials to sign in to the
                Enterprise Admin Console.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-5"
            >
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="login-email">
                  Email address
                </Label>

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

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="login-password">
                  Password
                </Label>

                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password
                        ? "login-password-error"
                        : undefined
                    }
                    className="h-11 pr-12"
                    {...register("password")}
                  />

                  <button
                    type="button"
                    disabled={isSubmitting}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-1
                               flex size-10 items-center justify-center
                               rounded-md text-muted-foreground
                               hover:text-foreground
                               focus-visible:outline-2
                               focus-visible:outline-offset-2
                               focus-visible:outline-ring
                               disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
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

              {/* Backend error */}
              {errors.root?.server && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30
                             bg-destructive/5 px-4 py-3
                             text-sm text-destructive"
                >
                  {errors.root.server.message}
                </div>
              )}

              {status === "error" && (
                <p
                  role="status"
                  className="text-xs text-muted-foreground"
                >
                  Your previous session could not be verified.
                  You can try signing in again.
                </p>
              )}

              {/* Submit */}
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
                    <ArrowRight
                      className="size-4"
                      aria-hidden="true"
                    />
                  </>
                )}
              </Button>
            </form>

            <p
              className="mt-8 text-center text-xs
                         leading-5 text-muted-foreground"
            >
              Access is restricted to authorized personnel.
            </p>
          </div>
        </div>

        <footer
          className="text-center text-xs text-muted-foreground"
        >
          Enterprise Administration Dashboard
        </footer>
      </section>
    </main>
  );
}
