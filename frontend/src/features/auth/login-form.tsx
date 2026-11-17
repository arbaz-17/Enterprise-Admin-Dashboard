import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api-error";
import { LoginDemoAccounts } from "./login-demo-accounts";
import { loginSchema, type LoginFormValues } from "./login.schema";
import type { LoginCredentials } from "./auth.types";

const showDemoAccounts =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_LOGIN === "true";

export function LoginForm() {
  const { login, status } = useAuth();
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

  function fillDemoCredentials(credentials: LoginCredentials) {
    reset(credentials);
    setShowPassword(false);
  }

  return (
    <div className="w-full max-w-[430px]">
      <div className="mb-8 space-y-3">
        <h1
          id="login-title"
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Welcome back
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Manage your projects, collaborate with your team, and stay on top of
          what matters.
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
            aria-describedby={errors.email ? "login-email-error" : undefined}
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
              aria-label={showPassword ? "Hide password" : "Show password"}
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
            Your previous session could not be verified. You can try signing in
            again.
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
        <LoginDemoAccounts
          emailValue={emailValue}
          passwordValue={passwordValue}
          isSubmitting={isSubmitting}
          onSelect={fillDemoCredentials}
        />
      )}
    </div>
  );
}
