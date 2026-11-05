
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/theme/mode-toggle";

export function AppHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />

        <Separator
          orientation="vertical"
          className="h-4"
        />

        <span className="text-sm font-semibold">
          Overview
        </span>
      </div>

      <ModeToggle />
    </header>
  );
}
