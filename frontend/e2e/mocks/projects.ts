
import type { Page } from "@playwright/test";

import type {
  Project,
  ProjectStatus,
  ProjectStatusInput,
} from "../../src/features/projects/projects.types";

export const ASSIGNED_PROJECT_ID =
  "11111111-1111-4111-8111-111111111111";

export const UNASSIGNED_PROJECT_ID =
  "22222222-2222-4222-8222-222222222222";

const clientId =
  "33333333-3333-4333-8333-333333333333";

const managerEmployeeId =
  "44444444-4444-4444-8444-444444444444";

const anotherManagerId =
  "55555555-5555-4555-8555-555555555555";

const timestamp = "2026-01-10T09:00:00.000Z";

const initialProjects: Project[] = [
  {
    id: ASSIGNED_PROJECT_ID,
    name: "E2E Assigned Project",
    description: "Project managed by the logged-in manager",
    clientId,
    clientName: "E2E Client",
    managerEmployeeId,
    managerName: "E2E Manager",
    status: "active",
    priority: "high",
    progress: 30,
    startDate: "2026-01-01",
    dueDate: "2026-12-31",
    completedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    canEdit: true,
  },
  {
    id: UNASSIGNED_PROJECT_ID,
    name: "E2E Unassigned Project",
    description: "Project belonging to another manager",
    clientId,
    clientName: "E2E Client",
    managerEmployeeId: anotherManagerId,
    managerName: "Another Manager",
    status: "planning",
    priority: "medium",
    progress: 10,
    startDate: "2026-02-01",
    dueDate: "2026-12-31",
    completedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    canEdit: false,
  },
];

const validStatuses: ProjectStatus[] = [
  "planning",
  "active",
  "on_hold",
  "completed",
];

export async function installProjectMocks(page: Page) {
  let projects = initialProjects.map((project) => ({
    ...project,
  }));

  const writes: Array<{
    id: string;
    payload: ProjectStatusInput;
  }> = [];

  let listRequests = 0;

  // Register AFTER installRoleMocks(page).
  // More recently registered routes take precedence.
  await page.route("**/api/projects**", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname;

    // This mock specifically represents a Manager session.
    if (
      request.headers()["authorization"] !==
      "Bearer e2e-manager-access-token"
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

    // ------------------------------------
    // GET /api/projects
    // ------------------------------------

    if (path === "/api/projects" && method === "GET") {
      listRequests += 1;

      const params = url.searchParams;

      const search = (params.get("q") ?? "")
        .trim()
        .toLowerCase();

      const status = params.get("status");
      const priority = params.get("priority");

      const pageNumber = Math.max(
        1,
        Number(params.get("page")) || 1,
      );

      const pageSize = Math.max(
        1,
        Number(params.get("pageSize")) || 10,
      );

      const sortDir = params.get("sortDir") ?? "asc";

      const filtered = projects
        .filter((project) => {
          const matchesSearch =
            !search ||
            [
              project.name,
              project.clientName,
              project.description ?? "",
            ].some((value) =>
              value.toLowerCase().includes(search),
            );

          const matchesStatus =
            !status || project.status === status;

          const matchesPriority =
            !priority || project.priority === priority;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesPriority
          );
        })
        .sort((a, b) => {
          const result = a.name.localeCompare(b.name);

          return sortDir === "desc" ? -result : result;
        });

      const start = (pageNumber - 1) * pageSize;

      await route.fulfill({
        status: 200,
        json: {
          data: filtered.slice(start, start + pageSize),
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

    // ------------------------------------
    // PATCH /api/projects/:id
    // ------------------------------------

    if (
      path.startsWith("/api/projects/") &&
      method === "PATCH"
    ) {
      const id = decodeURIComponent(
        path.slice("/api/projects/".length),
      );

      const project = projects.find(
        (item) => item.id === id,
      );

      if (!project) {
        await route.fulfill({
          status: 404,
          json: {
            error: {
              code: "PROJECT_NOT_FOUND",
              message: "Project not found",
            },
          },
        });
        return;
      }

      // Simulate the Manager ownership rule.
      if (!project.canEdit) {
        await route.fulfill({
          status: 403,
          json: {
            error: {
              code: "FORBIDDEN",
              message:
                "You can only update projects assigned to you",
            },
          },
        });
        return;
      }

      const body = request.postDataJSON() as Record<
        string,
        unknown
      >;

      // Managers may submit only status and progress.
      const validKeys =
        Object.keys(body).length === 2 &&
        Object.keys(body).every((key) =>
          ["status", "progress"].includes(key),
        );

      const validStatus = validStatuses.includes(
        body.status as ProjectStatus,
      );

      const validProgress =
        typeof body.progress === "number" &&
        Number.isInteger(body.progress) &&
        body.progress >= 0 &&
        body.progress <= 100;

      const validCompletion =
        body.status !== "completed" ||
        body.progress === 100;

      if (
        !validKeys ||
        !validStatus ||
        !validProgress ||
        !validCompletion
      ) {
        await route.fulfill({
          status: 400,
          json: {
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid manager project update",
            },
          },
        });
        return;
      }

      const payload: ProjectStatusInput = {
        status: body.status as ProjectStatus,
        progress: body.progress as number,
      };

      writes.push({ id, payload });

      const updated: Project = {
        ...project,
        ...payload,
        completedAt:
          payload.status === "completed"
            ? "2026-11-18T10:00:00.000Z"
            : null,
        updatedAt: "2026-11-18T10:00:00.000Z",
      };

      projects = projects.map((item) =>
        item.id === id ? updated : item,
      );

      await route.fulfill({
        status: 200,
        json: { data: updated },
      });

      return;
    }

    // Any unsupported project request goes to the
    // existing role mock, which rejects unmocked APIs.
    await route.fallback();
  });

  return {
    writes,
    getProjects: () => projects.map((item) => ({ ...item })),
    getListRequests: () => listRequests,
  };
}
