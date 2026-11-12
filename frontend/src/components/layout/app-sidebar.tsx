import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { LoaderCircle, LogOut, X } from "lucide-react";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

import { Button } from "@/components/ui/button";

import {
  navigationGroups,
  accountNavigation,
  isNavigationActive,
  type NavigationItem,
} from "@/config/navigation";

import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api-error";

const navButtonClass =
  "brand-nav-item h-11 rounded-xl px-3 text-[13px] " +
  "font-medium transition-colors cursor-pointer" +
  "[&>svg]:size-[18px] [&>svg]:shrink-0";

// Temporary brand mark, matching the placeholder used on the login page.
// Replace this SVG with the official Optimus Fox logo when available.
function OptimusFoxLogo() {
  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center
                 rounded-xl bg-[#09090e] shadow-sm"
      aria-hidden="true"
    >
      <svg viewBox="0 0 96 96" fill="none" className="size-7 text-primary">
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


export function AppSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();
  const { hasPermission, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);



  function closeMobileSidebar() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout();
      // Keep the existing session behavior; only the action's location changed.
      if (isMobile) setOpenMobile(false);
      toast.success("Signed out successfully");
      navigate("/login", { replace: true });
    } catch (error) {
      // Remain signed in on failure, so the user can retry from the sidebar.
      toast.error("Sign out failed", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsLoggingOut(false);
    }
  }

  function renderNavItem(item: NavigationItem) {
    const active = isNavigationActive(pathname, item.href);
    const Icon = item.icon;

    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={item.label}
          className={navButtonClass}
        >
          <NavLink
            to={item.href}
            end={item.href === "/"}
            onClick={closeMobileSidebar}
          >
            <Icon aria-hidden="true" />
            <span>{item.label}</span>

            {/* Quiet active-state dot instead of the previous arrow. */}
            {active && (
              <span
                aria-hidden="true"
                className="ml-auto size-1.5 shrink-0 rounded-full
                           bg-current opacity-60
                           group-data-[collapsible=icon]:hidden"
              />
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-none">
      {/* Brand */}
      <SidebarHeader className="px-3 pt-4 pb-4 group-data-[collapsible=icon]:px-1">
        <div className="flex items-center gap-1">
          <NavLink
            to="/"
            aria-label="Optimus Fox — go to overview"
            onClick={closeMobileSidebar}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl
                       px-2 py-2 transition-colors hover:bg-black/10
                       focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-sidebar-ring
                       group-data-[collapsible=icon]:justify-center
                       group-data-[collapsible=icon]:px-0"
          >
            <OptimusFoxLogo />

            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-[15px] font-bold tracking-tight">
                Optimus Fox
              </p>
              <p
                className="truncate text-[10px] font-medium
                           tracking-[-0.01em] text-[var(--sidebar-muted)]"
              >
                Project Management System
              </p>
            </div>
          </NavLink>

          {isMobile && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Close navigation"
              onClick={() => setOpenMobile(false)}
              className="shrink-0 text-sidebar-foreground hover:bg-black/10"
            >
              <X aria-hidden="true" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      {/* Main navigation */}
      <SidebarContent className="px-2 group-data-[collapsible=icon]:px-1">
        <nav aria-label="Main navigation">
          {navigationGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.permission || hasPermission(item.permission),
            );

            if (visibleItems.length === 0) {
              return null;
            }

            return (
              <SidebarGroup key={group.label} className="gap-1 px-1 py-2">
                <SidebarGroupLabel
                  className="px-3 text-[10px] font-bold tracking-[0.16em]
                             uppercase text-[var(--sidebar-muted)]"
                >
                  {group.label}
                </SidebarGroupLabel>

                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
                    {visibleItems.map(renderNavItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </nav>
      </SidebarContent>

      {/* Account actions and current user */}
      <SidebarFooter
        className="gap-2 border-t border-black/15 px-3 py-3
                   group-data-[collapsible=icon]:px-1"
      >
        <nav aria-label="Account navigation">
          <SidebarMenu className="gap-1">
            {accountNavigation
              .filter(
                (item) => !item.permission || hasPermission(item.permission),
              )
              .map(renderNavItem)}

            {/* Sign out belongs directly below Settings, not in the header. */}
            <SidebarMenuItem>
              <SidebarMenuButton
                type="button"
                tooltip="Sign out"
                disabled={isLoggingOut}
                onClick={() => void handleLogout()}
                className={navButtonClass}
              >
                {isLoggingOut ? (
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                ) : (
                  <LogOut aria-hidden="true" />
                )}
                <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </nav>

      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
