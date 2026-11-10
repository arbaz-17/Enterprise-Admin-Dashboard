
import { PageHeader } from "@/components/layout/page-header";

import { ModeToggle } from "@/components/theme/mode-toggle";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your workspace preferences and appearance."
      />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>
            <h2 className="text-base font-semibold">
              Appearance
            </h2>
          </CardTitle>

          <CardDescription>
            Customize the appearance of your workspace.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div
            className="flex flex-col gap-4
                       sm:flex-row sm:items-center
                       sm:justify-between"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Theme preference
              </p>

              <p className="text-xs leading-5 text-muted-foreground">
                Select light, dark, or system appearance.
              </p>
            </div>

            <ModeToggle />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
