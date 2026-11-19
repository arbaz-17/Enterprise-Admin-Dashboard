import { describe, expect, it } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { AuditsPage } from "@/pages/audits-page";
import { server } from "@/test/mocks/server";
import { filterAuditLogs, hasAuditFilters } from "./audits.filters";

import type { AuditLog, AuditListResponse } from "./audits.types";

const projectAudit: AuditLog = {
  id: "audit-1",
  actorUserId: "admin-1",
  actorName: "Arbaz Admin",
  action: "update",
  resourceType: "project",
  resourceId: "project-1",
  resourceName: "Portal Upgrade",
  description: "Updated project status",
  outcome: "success",
  occurredAt: "2026-11-18T08:00:00.000Z",
};

const employeeAudit: AuditLog = {
  id: "audit-2",
  actorUserId: "manager-1",
  actorName: "Maya Manager",
  action: "assign",
  resourceType: "project_assignment",
  resourceId: "assignment-1",
  resourceName: "Engineering Team",
  description: "Failed to assign employee",
  outcome: "failure",
  occurredAt: "2026-11-18T09:00:00.000Z",
};

const records = [projectAudit, employeeAudit];

function auditResponse(data: AuditLog[]): AuditListResponse {
  return {
    data,
    meta: {
      returned: data.length,
      limit: 1000,
      hasMore: false,
    },
  };
}

function renderAudits() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuditsPage />
    </QueryClientProvider>,
  );
}

describe("Audit Logs", () => {
  it("displays an API error and recovers on retry", async () => {
    const user = userEvent.setup();
    let shouldFail = true;
    let requests = 0;

    server.use(
      http.get("*/api/audits", () => {
        requests += 1;

        if (shouldFail) {
          return HttpResponse.json(
            {
              error: {
                code: "SERVER_ERROR",
                message: "Audit service unavailable",
              },
            },
            { status: 500 },
          );
        }

        return HttpResponse.json(auditResponse(records));
      }),
    );

    renderAudits();

    expect(
      await screen.findByText("Unable to load audit logs"),
    ).toBeInTheDocument();

    expect(screen.getByText("Audit service unavailable")).toBeInTheDocument();

    shouldFail = false;

    await user.click(
      screen.getByRole("button", {
        name: "Try again",
      }),
    );

    const table = await screen.findByRole("table", {
      name: "Audit events",
    });

    expect(await within(table).findByText("Arbaz Admin")).toBeInTheDocument();

    expect(within(table).getByText("Maya Manager")).toBeInTheDocument();

    expect(requests).toBe(2);
  });

  it("filters displayed audit records using search", async () => {
    const user = userEvent.setup();
    let requests = 0;

    server.use(
      http.get("*/api/audits", () => {
        requests += 1;

        return HttpResponse.json(auditResponse(records));
      }),
    );

    renderAudits();

    expect(
      await screen.findByText("2 records displayed", {}, { timeout: 5000 }),
    ).toBeInTheDocument();

    const table = screen.getByRole("table", {
      name: "Audit events",
    });

    expect(within(table).getByText("Arbaz Admin")).toBeInTheDocument();

    expect(within(table).getByText("Maya Manager")).toBeInTheDocument();

    const searchForm = screen.getByRole("search");

    await user.type(
      within(searchForm).getByRole("searchbox", {
        name: "Search audit logs",
      }),
      "Maya",
    );

    await user.click(
      within(searchForm).getByRole("button", {
        name: "Search",
      }),
    );

    await waitFor(() => {
      expect(screen.getByText("1 records displayed")).toBeInTheDocument();
    });

    expect(within(table).getByText("Maya Manager")).toBeInTheDocument();

    expect(within(table).queryByText("Arbaz Admin")).not.toBeInTheDocument();

    expect(requests).toBe(1);
  });

  it("combines outcome, action, resource and case-insensitive search", () => {
    const filters = {
      search: "  PORTAL  ",
      outcome: "success" as const,
      action: "update" as const,
      resourceType: "project" as const,
    };

    expect(hasAuditFilters(filters)).toBe(true);

    const result = filterAuditLogs(records, filters);

    expect(result.map((log) => log.id)).toEqual([projectAudit.id]);

    expect(
      filterAuditLogs(records, {
        ...filters,
        outcome: "failure",
      }),
    ).toEqual([]);
  });
});
