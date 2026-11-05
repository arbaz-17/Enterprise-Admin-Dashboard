
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

export function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Dashboard Overview
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Welcome to your Enterprise Admin Dashboard.
        </p>
      </div>

      {/* Dashboard content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Dashboard</CardTitle>
            <Badge variant="secondary">Overview</Badge>
          </div>

          <CardDescription>
            Monitor and manage your enterprise operations.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            Dashboard statistics and visualizations will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
