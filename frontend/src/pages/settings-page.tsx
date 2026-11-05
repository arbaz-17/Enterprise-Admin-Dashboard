
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/theme/mode-toggle";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Settings
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage your application preferences.
        </p>
      </div>

      {/* Appearance settings */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>

          <CardDescription>
            Customize the application's visual appearance.
          </CardDescription>
        </CardHeader>

        <Separator />

        <CardContent className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Theme
            </p>

            <p className="text-xs text-muted-foreground">
              Choose between light, dark, or system mode.
            </p>
          </div>

          <ModeToggle />
        </CardContent>
      </Card>
    </div>
  );
}
