
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { DashboardWidget } from "./dashboard-widget";
import { useDashboardMetrics } from "./dashboard.queries";
import { server } from "@/test/mocks/server";

function MetricsWidget() {
  const query = useDashboardMetrics();

  return (
    <DashboardWidget
      title="Key performance indicators"
      description="Organization statistics"
      query={query}
      skeleton={<p>Loading dashboard metrics...</p>}
      render={({ data: { metrics } }) => (
        <p>
          {metrics.employees} employees across{" "}
          {metrics.departments} departments
        </p>
      )}
    />
  );
}

function renderWidget() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MetricsWidget />
    </QueryClientProvider>,
  );
}

describe("Dashboard metrics integration", () => {
  it("shows an API error and recovers when retried", async () => {
    const user = userEvent.setup();
    let shouldFail = true;
    let requests = 0;

    server.use(
      http.get("*/api/dashboard/metrics", () => {
        requests += 1;

        if (shouldFail) {
          return HttpResponse.json(
            {
              error: {
                code: "SERVICE_UNAVAILABLE",
                message: "Dashboard metrics unavailable",
              },
            },
            { status: 503 },
          );
        }

        return HttpResponse.json({
          data: {
            metrics: {
              employees: 42,
              departments: 5,
              clients: 12,
              totalProjects: 18,
              activeProjects: 10,
              completedProjects: 8,
            },
            generatedAt: "2026-11-18T08:00:00.000Z",
          },
        });
      }),
    );

    renderWidget();

   
    expect(
      screen.getByText("Loading dashboard metrics..."),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(
        "Unable to load key performance indicators",
        undefined,
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Dashboard metrics unavailable"),
    ).toBeInTheDocument();

    const requestsBeforeRetry = requests;
    shouldFail = false;

    await user.click(
      screen.getByRole("button", {
        name: "Try again",
      }),
    );

    expect(
      await screen.findByText(
        "42 employees across 5 departments",
      ),
    ).toBeInTheDocument();

    expect(requests).toBeGreaterThan(
      requestsBeforeRetry,
    );

    expect(
      screen.queryByText(
        "Unable to load key performance indicators",
      ),
    ).not.toBeInTheDocument();
  });
});
