import { Link, useLocation } from "react-router";
import { ChevronRight } from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { getNavigationBreadcrumbs } from "@/config/navigation";
import { useAuth } from "@/hooks/use-auth";

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "U";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export function AppHeader() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const breadcrumbs = getNavigationBreadcrumbs(pathname);

  const displayName = user?.name?.trim() || user?.email || "Account";
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Member";

  return (
    <header
      className="sticky top-0 z-30 flex h-16 shrink-0 items-center
                 justify-between gap-3 border-b border-border/70 md:rounded-t-xl
                 bg-background/95 px-4 backdrop-blur-md
                 supports-[backdrop-filter]:bg-background/85 lg:px-6"
    >
      {/* Navigation controls + accessible, route-aware breadcrumbs */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator orientation="vertical" className="h-5 shrink-0" />

        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex min-w-0 items-center gap-1.5 text-[13px] sm:gap-2">
            {breadcrumbs.map((crumb, index) => {
              const isCurrent = index === breadcrumbs.length - 1;

              return (
                <li
                  key={`${index}-${crumb.label}`}
                  className={`flex min-w-0 items-center gap-1.5 sm:gap-2 ${index === 0 && !isCurrent ? "hidden sm:flex" : ""}`}
                >
                  {index > 0 && (
                    <ChevronRight
                      className={`size-3.5 shrink-0 text-muted-foreground/60 ${index === 1 ? "hidden sm:block" : ""}`}
                      aria-hidden="true"
                    />
                  )}

                  {crumb.href && !isCurrent ? (
                    <Link
                      to={crumb.href}
                      className="truncate text-muted-foreground transition-colors
                                 hover:text-foreground focus-visible:rounded-sm
                                 focus-visible:outline-2 focus-visible:outline-offset-2
                                 focus-visible:outline-ring"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={isCurrent ? "page" : undefined}
                      className={
                        isCurrent
                          ? "truncate font-semibold text-foreground"
                          : "truncate text-muted-foreground"
                      }
                    >
                      {crumb.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Theme stays in the top bar. The account's sign-out action is in the sidebar. */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <ModeToggle />

        <div
          className="flex items-center gap-2 rounded-full border border-border/70
                     bg-card py-1 pr-1 pl-1 shadow-xs sm:pr-3"
          title={`${displayName} — ${displayRole}${user?.email ? ` (${user.email})` : ""}`}
        >
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center
                       rounded-full bg-secondary text-[10px] font-semibold
                       tracking-wide text-secondary-foreground"
          >
            {getInitials(displayName)}
          </span>
          <span className="sr-only sm:not-sr-only sm:max-w-28 sm:truncate sm:text-xs sm:font-medium">
            {displayName}
          </span>
        </div>
      </div>
    </header>
  );
}
