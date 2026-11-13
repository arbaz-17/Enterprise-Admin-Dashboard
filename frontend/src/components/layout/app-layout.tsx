import { Outlet } from "react-router";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";

// SidebarProvider saves desktop collapse state in a cookie.
// Restore it so the preference survives reloads.
function getSavedSidebarOpen(): boolean {
  if (typeof document === "undefined") return true;

  const savedState = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("sidebar_state="))
    ?.slice("sidebar_state=".length);

  return savedState !== "false";
}

export function AppLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={getSavedSidebarOpen()}>
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
          {/* Sticky relative to the page's normal scrolling viewport. */}
          <AppHeader />

          <div
            id="main-content"
            tabIndex={-1}
            className="min-w-0 flex-1 scroll-mt-20 focus:outline-none"
          >
            <div
              className="mx-auto w-full max-w-[1600px]
                         space-y-6 px-4 py-5 sm:px-6 sm:py-6
                         lg:px-8 lg:py-7"
            >
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
