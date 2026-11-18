
import type { Page } from "@playwright/test";

import type { Client } from "../../src/features/clients/clients.types";
import type { Project } from "../../src/features/projects/projects.types";
import type { ManagedUser } from "../../src/features/users/users-api";
import type { AuditLog } from "../../src/features/audits/audits.types";

const timestamp = "2026-11-18T09:00:00.000Z";

const clientId =
  "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const projectId =
  "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const client: Client = {
  id: clientId,
  name: "E2E Smoke Client",
  contactName: "Alex Lee",
  contactEmail: "alex@example.test",
  status: "active",
  createdAt: timestamp,
  updatedAt: timestamp,
};

const project: Project = {
  id: projectId,
  name: "E2E Smoke Project",
  description: "Project used for browser navigation tests",
  clientId,
  clientName: client.name,
  managerEmployeeId: null,
  managerName: null,
  status: "active",
  priority: "high",
  progress: 45,
  startDate: "2026-01-01",
  dueDate: "2026-12-31",
  completedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  canEdit: true,
};

const users: ManagedUser[] = [
  {
    id: "e2e-admin-user",
    name: "E2E Administrator",
    email: "e2e.admin@example.test",
    role: "admin",
    isActive: true,
  },
  {
    id: "e2e-manager-user",
    name: "E2E Team Manager",
    email: "e2e.manager@example.test",
    role: "manager",
    isActive: true,
  },
];

const audit: AuditLog = {
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  actorUserId: "e2e-admin-user",
  actorName: "E2E Administrator",
  action: "create",
  resourceType: "project",
  resourceId: projectId,
  resourceName: project.name,
  description: "E2E navigation smoke event",
  outcome: "success",
  occurredAt: timestamp,
};

function listResponse<T>(
  rows: T[],
  url: URL,
) {
  const page = Math.max(
    1,
    Number(url.searchParams.get("page")) || 1,
  );

  const pageSize = Math.max(
    1,
    Number(url.searchParams.get("pageSize")) || 10,
  );

  const start = (page - 1) * pageSize;

  return {
    data: rows.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      total: rows.length,
      totalPages: Math.max(
        1,
        Math.ceil(rows.length / pageSize),
      ),
    },
  };
}

export async function installNavigationMocks(
  page: Page,
) {
  const handledRequests: string[] = [];

  // Register AFTER installRoleMocks().
  // Requests that are not handled here fall back
  // to the existing role-specific API mocks.
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    const navigationPaths = [
      "/api/clients",
      "/api/projects",
      "/api/users",
      "/api/audits",
    ];

    if (
      request.method() !== "GET" ||
      !navigationPaths.includes(path)
    ) {
      await route.fallback();
      return;
    }

    // Only an authenticated Admin may use
    // these particular smoke-test fixtures.
    if (
      request.headers()["authorization"] !==
      "Bearer e2e-admin-access-token"
    ) {
      await route.fulfill({
        status: 401,
        json: {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
      });
      return;
    }

    handledRequests.push(path);

    if (path === "/api/clients") {
      await route.fulfill({
        status: 200,
        json: listResponse([client], url),
      });
      return;
    }

    if (path === "/api/projects") {
      await route.fulfill({
        status: 200,
        json: listResponse([project], url),
      });
      return;
    }

    if (path === "/api/users") {
      const pageNumber = Math.max(
        1,
        Number(url.searchParams.get("page")) || 1,
      );

      const pageSize = Math.max(
        1,
        Number(url.searchParams.get("pageSize")) || 20,
      );

      const search = (
        url.searchParams.get("q") ?? ""
      ).trim().toLowerCase();

      const filtered = users.filter((user) =>
        `${user.name} ${user.email}`
          .toLowerCase()
          .includes(search),
      );

      const start = (pageNumber - 1) * pageSize;

      await route.fulfill({
        status: 200,
        json: {
          users: filtered.slice(
            start,
            start + pageSize,
          ),
          pagination: {
            page: pageNumber,
            pageSize,
            total: filtered.length,
            totalPages: Math.max(
              1,
              Math.ceil(filtered.length / pageSize),
            ),
          },
        },
      });
      return;
    }

    if (path === "/api/audits") {
      await route.fulfill({
        status: 200,
        json: {
          data: [audit],
          meta: {
            returned: 1,
            limit: 100,
            hasMore: false,
          },
        },
      });
      return;
    }
  });

  return {
    handledRequests,
  };
}
