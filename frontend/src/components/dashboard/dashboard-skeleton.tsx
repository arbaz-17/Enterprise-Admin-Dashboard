import { PageHeader } from "@/components/layout/page-header";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { Skeleton } from "@/components/ui/skeleton";

function Placeholder({ className = "" }: { className?: string }) {
  return <Skeleton className={`motion-reduce:animate-none ${className}`} />;
}

function StatCardSkeleton() {
  return (
    <Card className="min-w-0 gap-0 py-4">
      <CardContent className="px-5">
        <div className="flex items-center justify-between gap-3">
          <Placeholder className="h-4 w-28 max-w-full" />

          <Placeholder className="size-5 shrink-0 rounded-md" />
        </div>

        <Placeholder className="mt-3 h-8 w-20" />

        <Placeholder className="mt-1.5 h-3 w-40 max-w-full" />
      </CardContent>
    </Card>
  );
}

function ChartHeaderSkeleton({ titleWidth = "w-44" }: { titleWidth?: string }) {
  return (
    <CardHeader>
      <Placeholder className={`h-5 ${titleWidth} max-w-full`} />
      <Placeholder className="h-4 w-72 max-w-full" />
    </CardHeader>
  );
}

function MonthlyActivitySkeleton() {
  const barHeights = [42, 66, 53, 78, 62, 88];

  return (
    <Card className="min-w-0">
      <ChartHeaderSkeleton titleWidth="w-48" />

      <CardContent>
        <div className="relative h-[250px] w-full sm:h-[280px]">
          <div className="absolute inset-x-0 top-3 bottom-9 flex flex-col justify-between">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Placeholder className="h-2 w-6 shrink-0" />
                <Placeholder className="h-px flex-1 rounded-none opacity-60" />
              </div>
            ))}
          </div>

          <div className="absolute inset-x-10 top-8 bottom-9 flex items-end gap-3 sm:gap-5">
            {barHeights.map((height, index) => (
              <div
                key={index}
                className="min-w-0 flex-1"
                style={{ height: `${height}%` }}
              >
                <Placeholder className="size-full rounded-t-md rounded-b-none opacity-80" />
              </div>
            ))}
          </div>

          <div className="absolute inset-x-10 bottom-1 flex justify-between gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Placeholder key={index} className="h-2 w-8 max-w-full" />
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-5">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <Placeholder className="size-2.5 rounded-full" />
              <Placeholder className="h-3 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectStatusSkeleton() {
  return (
    <Card className="min-w-0">
      <ChartHeaderSkeleton titleWidth="w-32" />

      <CardContent>
        <div className="relative mx-auto flex h-[235px] w-full max-w-[320px] items-center justify-center">
          <Placeholder className="size-[186px] rounded-full" />

          <div className="absolute flex size-[136px] flex-col items-center justify-center gap-2 rounded-full bg-card">
            <Placeholder className="h-7 w-14" />
            <Placeholder className="h-3 w-16" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex min-w-0 items-center justify-between gap-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Placeholder className="size-2.5 shrink-0 rounded-full" />
                <Placeholder className="h-3 w-16 max-w-full" />
              </div>

              <Placeholder className="h-3 w-5 shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DepartmentSkeleton() {
  const barWidths = ["w-[72%]", "w-[88%]", "w-[56%]", "w-[76%]", "w-[42%]"];

  return (
    <Card className="min-w-0">
      <ChartHeaderSkeleton titleWidth="w-48" />

      <CardContent>
        <div className="flex h-[280px] flex-col justify-around gap-4">
          {barWidths.map((width, index) => (
            <div key={index} className="flex items-center gap-3">
              <Placeholder className="h-3 w-[85px] shrink-0" />

              <div className="min-w-0 flex-1">
                <Placeholder
                  className={`h-5 ${width} rounded-r-md rounded-l-none`}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentProjectsSkeleton() {
  return (
    <Card className="min-w-0 xl:col-span-3">
      <CardHeader>
        <Placeholder className="h-5 w-52 max-w-full" />
        <Placeholder className="h-4 w-80 max-w-full" />
      </CardHeader>

      <CardContent>
        <div className="divide-y divide-border">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
            >
              <Placeholder className="size-9 shrink-0 rounded-lg" />

              <div className="min-w-0 flex-1 space-y-2">
                <Placeholder className="h-4 w-44 max-w-full" />
                <Placeholder className="h-3 w-56 max-w-full" />
              </div>

              <Placeholder className="h-5 w-16 shrink-0 rounded-full" />
            </div>
          ))}
        </div>

        <Placeholder className="mt-3 h-8 w-32 rounded-md" />
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <span className="sr-only" role="status">
        Loading dashboard data...
      </span>

      <PageHeader
        title="Overview"
        description="Live organization statistics from the Enterprise Operations database."
        actions={
          <div className="flex flex-wrap items-center gap-2" aria-hidden="true">
            <Placeholder className="h-6 w-20 rounded-md" />
            <Placeholder className="h-8 w-24 rounded-md" />
          </div>
        }
      />

      <div aria-hidden="true" className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </section>

        <section className="grid min-w-0 gap-6 xl:grid-cols-5">
          <div className="min-w-0 xl:col-span-3">
            <MonthlyActivitySkeleton />
          </div>

          <div className="min-w-0 xl:col-span-2">
            <ProjectStatusSkeleton />
          </div>
        </section>

        <section className="grid min-w-0 gap-6 xl:grid-cols-5">
          <div className="min-w-0 xl:col-span-2">
            <DepartmentSkeleton />
          </div>

          <RecentProjectsSkeleton />
        </section>

        <Placeholder className="h-3 w-72 max-w-full" />
      </div>
    </div>
  );
}
