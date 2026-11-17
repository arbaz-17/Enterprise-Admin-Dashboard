import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { EMPLOYEE_STATUS_LABELS } from "@/features/employees/employee.constants";

import type {
  EmployeeStatus,
  OperationsOverview,
  ProjectPriority,
} from "./dashboard.types";

type PriorityData = OperationsOverview["priorityDistribution"];
type EmployeeData = OperationsOverview["employeeStatus"];

const priorityOrder: ProjectPriority[] = ["high", "medium", "low"];
const employeeOrder: EmployeeStatus[] = ["active", "on_leave", "inactive"];

const priorityLabels: Record<ProjectPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const priorityColors: Record<ProjectPriority, string> = {
  high: "var(--destructive)",
  medium: "var(--chart-1)",
  low: "var(--chart-3)",
};

const employeeColors: Record<EmployeeStatus, string> = {
  active: "var(--chart-3)",
  on_leave: "var(--chart-2)",
  inactive: "var(--muted-foreground)",
};

const priorityConfig = {
  count: { label: "Open projects", color: "var(--chart-1)" },
} satisfies ChartConfig;

const employeeConfig = {
  count: { label: "Employees" },
} satisfies ChartConfig;

export function ProjectPriorityChart({ data }: { data: PriorityData }) {
  const chartData = priorityOrder.map((priority) => ({
    name: priorityLabels[priority],
    count: data.find((item) => item.priority === priority)?.count ?? 0,
    color: priorityColors[priority],
  }));

  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>
          <h2 className="text-base font-semibold">Project priority</h2>
        </CardTitle>
        <CardDescription>Open projects grouped by priority.</CardDescription>
      </CardHeader>

      <CardContent>
        {total === 0 ? (
          <p className="flex h-[270px] items-center justify-center text-sm text-muted-foreground">
            No unfinished projects to summarize.
          </p>
        ) : (
          <>
            <ChartContainer
              config={priorityConfig}
              className="aspect-auto h-[235px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={58}>
                  {chartData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>

            <p className="mt-2 text-center text-xs text-muted-foreground">
              {total.toLocaleString("en-US")} open projects
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function EmployeeStatusChart({ data }: { data: EmployeeData }) {
  const chartData = employeeOrder.map((status) => ({
    name: EMPLOYEE_STATUS_LABELS[status],
    count: data.find((item) => item.status === status)?.count ?? 0,
    color: employeeColors[status],
  }));

  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>
          <h2 className="text-base font-semibold">Employee status</h2>
        </CardTitle>
        <CardDescription>
          Current workforce composition by employment status.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {total === 0 ? (
          <p className="flex h-[270px] items-center justify-center text-sm text-muted-foreground">
            No employee records to summarize.
          </p>
        ) : (
          <>
            <div className="relative mx-auto w-full max-w-[320px]">
              <ChartContainer
                config={employeeConfig}
                className="aspect-auto h-[235px] w-full"
              >
                <PieChart accessibilityLayer>
                  <ChartTooltip
                    content={<ChartTooltipContent hideLabel nameKey="name" />}
                  />
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={91}
                    paddingAngle={3}
                    stroke="var(--card)"
                    strokeWidth={2}
                  >
                    {chartData.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold tracking-tight tabular-nums">
                  {total.toLocaleString("en-US")}
                </span>
                <span className="text-xs text-muted-foreground">Employees</span>
              </div>
            </div>

            <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {chartData.map((item) => (
                <li key={item.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 text-muted-foreground">
                    {item.name}
                  </span>
                  <span className="font-medium tabular-nums">{item.count}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
