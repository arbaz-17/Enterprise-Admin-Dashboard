
import type { Page } from "@playwright/test";

import type {
  AuthResponse,
  Permission,
  UserRole,
} from "../../src/features/auth/auth.types";

const testPassword = "ValidTestPassword123!";

export const E2E_ACCOUNTS = {
  admin: {
    email: "e2e.admin@example.test",
    password: testPassword,
    name: "E2E Administrator",
  },
  manager: {
    email: "e2e.manager@example.test",
    password: testPassword,
    name: "E2E Manager",
  },
  viewer: {
    email: "e2e.viewer@example.test",
    password: testPassword,
    name: "E2E Viewer",
  },
} as const;

const permissionsByRole: Record<UserRole, Permission[]> = {
  admin: [
    "dashboard:read",
    "users:read",
    "users:manage",
    "departments:read",
    "departments:manage",
    "employees:read",
    "employees:manage",
    "clients:read",
    "clients:manage",
    "projects:read",
    "projects:create",
    "projects:manage",
    "projects:delete",
    "assignments:manage",
    "audits:read",
  ],
  manager: [
    "dashboard:read",
    "users:read",
    "departments:read",
    "employees:read",
    "clients:read",
    "projects:read",
    "projects:manage",
    "assignments:manage",
  ],
  viewer: ["dashboard:read"],
};

const departmentId =
  "11111111-1111-4111-8111-111111111111";

const employee = {
  id: "22222222-2222-4222-8222-222222222222",
  fullName: "E2E Browser Employee",
  workEmail: "browser@example.test",
  designation: "Frontend Developer",
  departmentId,
  departmentName: "Engineering",
  userId: null,
  linkedUserName: null,
  status: "active",
  joiningDate: "2026-01-01",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function makeSession(role: UserRole): AuthResponse {
  return {
    accessToken: `e2e-${role}-access-token`,
    tokenType: "Bearer",
    expiresIn: 900,
    user: {
      id: `e2e-${role}-user`,
      name: E2E_ACCOUNTS[role].name,
      email: E2E_ACCOUNTS[role].email,
      role,
    },
    permissions: permissionsByRole[role],
  };
}

const generatedAt = "2026-11-18T00:00:00.000Z";

function getDashboardResponse(
  path: string,
  role: UserRole,
): unknown {
  const canViewProjects = role !== "viewer";

  switch (path) {
    case "/api/dashboard/metrics":
      return {
        data: {
          metrics: {
            employees: 1,
            departments: 1,
            clients: 0,
            totalProjects: 0,
            activeProjects: 0,
            completedProjects: 0,
          },
          generatedAt,
        },
      };

    case "/api/dashboard/monthly-activity":
      return {
        data: { monthlyActivity: [], generatedAt },
      };

    case "/api/dashboard/project-status":
      return {
        data: { projectStatus: [], generatedAt },
      };

    case "/api/dashboard/departments":
      return {
        data: {
          departments: [{ name: "Engineering", employees: 1 }],
          generatedAt,
        },
      };

    case "/api/dashboard/recent-projects":
      return {
        data: {
          recentProjects: [],
          canViewProjects,
          generatedAt,
        },
      };

    case "/api/dashboard/operations":
      return {
        data: {
          operations: {
            health: {
              overdue: 0,
              dueSoon: 0,
              activeCount: 0,
              averageActiveProgress: 0,
            },
            priorityDistribution: [],
            employeeStatus: [{ status: "active", count: 1 }],
            attentionProjects: [],
            canViewProjects,
          },
          generatedAt,
        },
      };

    default:
      return null;
  }
}

export async function installRoleMocks(page: Page) {
  const unexpectedRequests: string[] = [];

  const cookieName = "e2e_role_session";

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname;

    // -----------------------------------
    // Authentication: login
    // -----------------------------------

    if (path === "/api/auth/login" && method === "POST") {
      const credentials = request.postDataJSON() as {
        email?: string;
        password?: string;
      };

      const role = (
        ["admin", "manager", "viewer"] as const
      ).find(
        (candidate) =>
          E2E_ACCOUNTS[candidate].email ===
            credentials.email &&
          E2E_ACCOUNTS[candidate].password ===
            credentials.password,
      );

      if (!role) {
        await route.fulfill({
          status: 401,
          json: {
            error: {
              code: "INVALID_CREDENTIALS",
              message: "Invalid email or password",
            },
          },
        });
        return;
      }

      await route.fulfill({
        status: 200,
        headers: {
          "set-cookie":
            `${cookieName}=${role}; Path=/api/auth; ` +
            "HttpOnly; SameSite=Lax",
        },
        json: makeSession(role),
      });

      return;
    }

    // -----------------------------------
    // Authentication: session refresh
    // -----------------------------------

    if (
      path === "/api/auth/refresh" &&
      method === "POST"
    ) {
      const cookieHeader =
        request.headers()["cookie"] ?? "";

      const cookieValue = cookieHeader
        .split(";")
        .map((part) => part.trim())
        .find((part) =>
          part.startsWith(`${cookieName}=`),
        )
        ?.split("=")[1];

      const role =
        cookieValue === "admin" ||
        cookieValue === "manager" ||
        cookieValue === "viewer"
          ? cookieValue
          : null;

      if (!role) {
        await route.fulfill({
          status: 401,
          json: {
            error: {
              code: "INVALID_SESSION",
              message: "Session not found",
            },
          },
        });
        return;
      }

      await route.fulfill({
        status: 200,
        json: makeSession(role),
      });

      return;
    }

    // -----------------------------------
    // Authentication: logout
    // -----------------------------------

    if (
      path === "/api/auth/logout" &&
      method === "POST"
    ) {
      await route.fulfill({
        status: 204,
        headers: {
          "set-cookie":
            `${cookieName}=; Path=/api/auth; ` +
            "HttpOnly; SameSite=Lax; Max-Age=0",
        },
      });

      return;
    }

    // -----------------------------------
    // Verify authorization header
    // -----------------------------------

    const token = request.headers()["authorization"];

    const role = (
      ["admin", "manager", "viewer"] as const
    ).find(
      (candidate) =>
        token ===
        `Bearer e2e-${candidate}-access-token`,
    );

    if (!role) {
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

    // -----------------------------------
    // Employee directory
    // -----------------------------------

    if (
      path === "/api/employees" &&
      method === "GET"
    ) {
      if (!permissionsByRole[role].includes("employees:read")) {
        await route.fulfill({ status: 403 });
        return;
      }

      await route.fulfill({
        status: 200,
        json: {
          data: [employee],
          pagination: {
            page: 1,
            pageSize: 10,
            total: 1,
            totalPages: 1,
          },
        },
      });
      return;
    }

    // -----------------------------------
    // Department options
    // -----------------------------------

    if (
      path === "/api/departments" &&
      method === "GET"
    ) {
      if (!permissionsByRole[role].includes("departments:read")) {
        await route.fulfill({ status: 403 });
        return;
      }

      await route.fulfill({
        status: 200,
        json: {
          data: [
            {
              id: departmentId,
              name: "Engineering",
              description: null,
              headEmployeeId: null,
              createdAt: generatedAt,
              updatedAt: generatedAt,
            },
          ],
          pagination: {
            page: 1,
            pageSize: 100,
            total: 1,
            totalPages: 1,
          },
        },
      });
      return;
    }

    // -----------------------------------
    // Dashboard data
    // -----------------------------------

    if (
      method === "GET" &&
      path.startsWith("/api/dashboard/")
    ) {
      const response = getDashboardResponse(path, role);

      if (response !== null) {
        await route.fulfill({
          status: 200,
          json: response,
        });
        return;
      }
    }

    // No request can reach the actual backend.
    unexpectedRequests.push(`${method} ${path}`);

    await route.fulfill({
      status: 501,
      json: {
        error: {
          code: "UNMOCKED_API",
          message: `No mock for ${method} ${path}`,
        },
      },
    });
  });

  return { unexpectedRequests };
}
