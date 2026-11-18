import { Check, Eye, ShieldCheck, UsersRound } from "lucide-react";
import type { LoginCredentials } from "./auth.types";

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


interface LoginDemoAccountsProps {
  emailValue: string;
  passwordValue: string;
  isSubmitting: boolean;
  onSelect: (credentials: LoginCredentials) => void;
}

export function LoginDemoAccounts({
  emailValue,
  passwordValue,
  isSubmitting,
  onSelect,
}: LoginDemoAccountsProps) {
  const selectedDemoRole = demoAccounts.find(
    (account) => account.email === emailValue && account.password === passwordValue,
  )?.role;

  return (
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
              onClick={() => onSelect({ email: account.email, password: account.password })}
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
  );
}
