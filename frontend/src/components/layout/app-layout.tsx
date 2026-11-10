
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only
                     focus:fixed focus:top-3 focus:left-3
                     focus:z-50 focus:rounded-md
                     focus:bg-background focus:px-4
                     focus:py-2 focus:text-foreground
                     focus:shadow-lg"
        >
          Skip to main content
        </a>

        <AppSidebar />

        <SidebarInset className="min-w-0 bg-background">
          <AppHeader />

          <div
            id="main-content"
            tabIndex={-1}
            className="min-w-0 flex-1
                       focus:outline-none"
          >
            <div
              className="mx-auto w-full max-w-[1600px]
                         space-y-6 px-4 py-6
                         sm:px-6 lg:px-8"
            >
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
