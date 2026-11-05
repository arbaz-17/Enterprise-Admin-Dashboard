
import { NavLink, useLocation } from "react-router";
import {
  LayoutDashboard,
  PanelsTopLeft,
  Settings2,
  ArrowUpRight,
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

const navButtonClass =
  "brand-nav-item h-11 rounded-xl px-3 text-[13px] " +
  "font-medium transition-all duration-200 " +
  "[&>svg]:size-[18px] [&>svg]:shrink-0";

export function AppSidebar() {
  const { pathname } = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();

  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="border-none"
    >
      {/* Brand header */}
      <SidebarHeader className="px-3 pt-4 pb-5 group-data-[collapsible=icon]:px-1">
        <NavLink
          to="/"
          onClick={closeMobileSidebar}
          className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-black/10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#09090e] text-white shadow-sm">
            <PanelsTopLeft className="size-5" />
          </div>

          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-[15px] font-bold tracking-tight">
              Enterprise
            </p>
            <p className="text-[11px] font-medium text-[var(--sidebar-muted)]">
              Admin Console
            </p>
          </div>
        </NavLink>
      </SidebarHeader>

      {/* Main navigation */}
      <SidebarContent className="px-2 group-data-[collapsible=icon]:px-1">
        <SidebarGroup className="gap-2 px-1">
          <SidebarGroupLabel className="px-3 text-[10px] font-bold tracking-[0.16em] text-[var(--sidebar-muted)] uppercase group-data-[collapsible=icon]:hidden">
            Workspace
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/"}
                  tooltip="Overview"
                  className={navButtonClass}
                >
                  <NavLink
                    to="/"
                    end
                    onClick={closeMobileSidebar}
                  >
                    <LayoutDashboard />
                    <span>Overview</span>
                    {pathname === "/" && (
                      <ArrowUpRight className="ml-auto size-3.5 opacity-60 group-data-[collapsible=icon]:hidden" />
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="gap-3 border-t border-black/15 px-3 py-4 group-data-[collapsible=icon]:px-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/settings")}
              tooltip="Settings"
              className={navButtonClass}
            >
              <NavLink
                to="/settings"
                onClick={closeMobileSidebar}
              >
                <Settings2 />
                <span>Settings</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="rounded-xl border border-black/10 bg-black/5 p-3 group-data-[collapsible=icon]:hidden">
          <p className="text-xs font-semibold">
            Enterprise Workspace
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--sidebar-muted)]">
            Your administration hub.
          </p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
