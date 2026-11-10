import { useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { ChevronDown, LoaderCircle, LogOut, UserRound } from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme/mode-toggle";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { findNavigationItem } from "@/config/navigation";

import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api-error";

export function AppHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { user, logout } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const currentPage = findNavigationItem(pathname);

  const pageTitle = currentPage?.item.label ?? "Workspace";
  const pageGroup = currentPage?.group ?? "Navigation";

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setLogoutError(getApiErrorMessage(error));
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <>
      <header
        className="flex h-16 shrink-0 items-center
                   justify-between gap-4 border-b px-4 lg:px-6"
      >
        {/* Left: sidebar toggle and page title */}
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="-ml-1" />

          <Separator orientation="vertical" className="h-4" />

          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 items-center gap-2 text-sm"
          >
            <span className="hidden text-muted-foreground sm:inline">
              {pageGroup}
            </span>

            <span
              aria-hidden="true"
              className="hidden text-muted-foreground/50 sm:inline"
            >
              /
            </span>

            <span
              className="truncate font-semibold text-foreground"
              aria-current="page"
            >
              {pageTitle}
            </span>
          </nav>
        </div>

        {/* Right: theme and user account */}
        <div className="flex shrink-0 items-center gap-2">
          <ModeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isLoggingOut}
                aria-label="Open account menu"
                className="gap-2"
              >
                {isLoggingOut ? (
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <UserRound className="size-4" aria-hidden="true" />
                )}

                <span className="hidden max-w-28 truncate sm:inline">
                  {user?.name ?? "Account"}
                </span>

                <ChevronDown
                  className="hidden size-3 sm:inline"
                  aria-hidden="true"
                />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="space-y-1">
                <p className="truncate font-semibold">{user?.name}</p>

                <p className="truncate text-xs font-normal text-muted-foreground">
                  {user?.email}
                </p>

                <p className="text-xs font-normal capitalize text-muted-foreground">
                  {user?.role}
                </p>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                variant="destructive"
                disabled={isLoggingOut}
                onSelect={() => void handleLogout()}
              >
                <LogOut aria-hidden="true" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {logoutError && (
        <div
          role="alert"
          className="border-b border-destructive/20
                     bg-destructive/5 px-4 py-2
                     text-sm text-destructive"
        >
          Sign out failed: {logoutError}
          <Button
            variant="ghost"
            size="sm"
            className="ml-2"
            disabled={isLoggingOut}
            onClick={() => void handleLogout()}
          >
            Retry
          </Button>
        </div>
      )}
    </>
  );
}
