import {
  Area,
  AreaChart,
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

import type {
  DashboardOverview,
  ProjectStatus,
} from "@/features/dashboard/dashboard.types";

// Shared chart types
type MonthlyActivity = DashboardOverview["monthlyActivity"];

type ProjectStatusData = DashboardOverview["projectStatus"];

type DepartmentData = DashboardOverview["departments"];

// Chart colors and labels
const monthlyConfig = {
  created: {
    label: "Created",
    color: "var(--chart-1)",
  },
  completed: {
    label: "Completed",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const statusConfig = {
  projects: {
    label: "Projects",
  },
} satisfies ChartConfig;

const departmentConfig = {
  employees: {
    label: "Employees",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const statusLabels: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
};

const statusColors: Record<ProjectStatus, string> = {
  planning: "var(--chart-2)",
  active: "var(--chart-1)",
  on_hold: "var(--chart-4)",
  completed: "var(--chart-3)",
};

// Monthly project activity
export function MonthlyActivityChart({ data }: { data: MonthlyActivity }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>
          <h2 className="text-base font-semibold">Monthly project activity</h2>
        </CardTitle>

        <CardDescription>
          Projects created and completed over the past six months.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer
          config={monthlyConfig}
          className="aspect-auto h-[250px] w-full sm:h-[280px]"
        >
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: -20,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />

            <XAxis
              dataKey="month"
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
              content={<ChartTooltipContent indicator="line" />}
            />

            <Area
              type="monotone"
              dataKey="created"
              stroke="var(--color-created)"
              fill="var(--color-created)"
              fillOpacity={0.12}
              strokeWidth={2}
            />

            <Area
              type="monotone"
              dataKey="completed"
              stroke="var(--color-completed)"
              fill="var(--color-completed)"
              fillOpacity={0.08}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full bg-chart-1"
              aria-hidden="true"
            />
            Created
          </span>

          <span className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full bg-chart-3"
              aria-hidden="true"
            />
            Completed
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Project status distribution
export function ProjectStatusChart({ data }: { data: ProjectStatusData }) {
  const chartData = data.map((item) => ({
    name: statusLabels[item.status],
    value: item.count,
    color: statusColors[item.status],
  }));

  const totalProjects = data.reduce((total, item) => total + item.count, 0);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>
          <h2 className="text-base font-semibold">Project status</h2>
        </CardTitle>

        <CardDescription>
          Distribution of projects by current status.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="relative mx-auto w-full max-w-[320px]">
          <ChartContainer
            config={statusConfig}
            className="aspect-auto h-[235px] w-full"
          >
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent hideLabel nameKey="name" />}
              />

              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={68}
                outerRadius={93}
                paddingAngle={totalProjects > 0 ? 3 : 0}
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
              {totalProjects}
            </span>

            <span className="text-xs text-muted-foreground">Projects</span>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
          {chartData.map((item) => (
            <li
              key={item.name}
              className="flex items-center justify-between gap-2"
            >
              <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: item.color,
                  }}
                  aria-hidden="true"
                />

                {item.name}
              </span>

              <span className="text-xs font-semibold tabular-nums">
                {item.value}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// Employees by department
export function DepartmentChart({ data }: { data: DepartmentData }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>
          <h2 className="text-base font-semibold">Employees by department</h2>
        </CardTitle>

        <CardDescription>
          Current employee distribution across departments.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer
          config={departmentConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{
              top: 5,
              right: 10,
              bottom: 5,
              left: 0,
            }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />

            <XAxis
              type="number"
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={95}
              tick={{
                fontSize: 11,
                fill: "var(--muted-foreground)",
              }}
            />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <Bar
              dataKey="employees"
              fill="var(--color-employees)"
              radius={[0, 5, 5, 0]}
              maxBarSize={22}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
