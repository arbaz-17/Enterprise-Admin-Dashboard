
import { NavLink, useLocation } from "react-router";

import {
  ArrowUpRight,
  PanelsTopLeft,
  X,
} from "lucide-react";

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

const navButtonClass =
  "brand-nav-item h-11 rounded-xl px-3 text-[13px] " +
  "font-medium transition-colors " +
  "[&>svg]:size-[18px] [&>svg]:shrink-0";

export function AppSidebar() {
  const { pathname } = useLocation();

  const {
    isMobile,
    setOpenMobile,
  } = useSidebar();

  const { hasPermission } = useAuth();

  function closeMobileSidebar() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  // Render one navigation link consistently.
  function renderNavItem(item: NavigationItem) {
    const active = isNavigationActive(
      pathname,
      item.href
    );

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

            {active && (
              <ArrowUpRight
                aria-hidden="true"
                className="ml-auto size-3.5 opacity-60
                           group-data-[collapsible=icon]:hidden"
              />
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="border-none"
    >
      {/* Brand */}
      <SidebarHeader
        className="px-3 pt-4 pb-5
                   group-data-[collapsible=icon]:px-1"
      >
        <div className="flex items-center gap-1">
          <NavLink
            to="/"
            onClick={closeMobileSidebar}
            className="flex min-w-0 flex-1 items-center gap-3
                       rounded-xl px-2 py-2
                       hover:bg-black/10
                       focus-visible:outline-2
                       focus-visible:outline-offset-2
                       focus-visible:outline-sidebar-ring
                       group-data-[collapsible=icon]:justify-center
                       group-data-[collapsible=icon]:px-0"
          >
            <div
              className="flex size-10 shrink-0
                         items-center justify-center
                         rounded-xl bg-[#09090e]
                         text-white shadow-sm"
            >
              <PanelsTopLeft
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <div
              className="min-w-0
                         group-data-[collapsible=icon]:hidden"
            >
              <p className="truncate text-[15px] font-bold">
                OptimusFox - PMS
              </p>

              <p
                className="text-[11px] font-medium
                           text-[var(--sidebar-muted)]"
              >
                Dashboard
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
              className="shrink-0 text-sidebar-foreground
                         hover:bg-black/10"
            >
              <X aria-hidden="true" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      {/* Main navigation */}
      <SidebarContent
        className="px-2
                   group-data-[collapsible=icon]:px-1"
      >
        <nav aria-label="Main navigation">
          {navigationGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) =>
                !item.permission ||
                hasPermission(item.permission)
            );

            if (visibleItems.length === 0) {
              return null;
            }

            return (
              <SidebarGroup
                key={group.label}
                className="gap-2 px-1"
              >
                <SidebarGroupLabel
                  className="px-3 text-[10px] font-bold
                             tracking-[0.16em] uppercase
                             text-[var(--sidebar-muted)]"
                >
                  {group.label}
                </SidebarGroupLabel>

                <SidebarGroupContent>
                  <SidebarMenu className="gap-1.5">
                    {visibleItems.map(renderNavItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </nav>
      </SidebarContent>

      {/* Account navigation */}
      <SidebarFooter
        className="gap-3 border-t border-black/15
                   px-3 py-4
                   group-data-[collapsible=icon]:px-1"
      >
        <nav aria-label="Account navigation">
          <SidebarMenu className="gap-1.5">
            {accountNavigation
              .filter(
                (item) =>
                  !item.permission ||
                  hasPermission(item.permission)
              )
              .map(renderNavItem)}
          </SidebarMenu>
        </nav>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
