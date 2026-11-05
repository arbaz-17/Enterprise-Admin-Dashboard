
import { Outlet } from "react-router";

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

import { TooltipProvider } from "@/components/ui/tooltip";

import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";

export function AppLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />

        <SidebarInset className="min-w-0 bg-background">
          <AppHeader />

          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
