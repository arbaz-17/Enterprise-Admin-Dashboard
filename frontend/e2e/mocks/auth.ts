
import type { Page } from "@playwright/test";

export const E2E_ADMIN = {
  email: "e2e.admin@example.test",
  password: "ValidTestPassword123!",
};

const accessToken = "e2e-admin-access-token";

const session = {
  accessToken,
  tokenType: "Bearer" as const,
  expiresIn: 900,
  user: {
    id: "e2e-admin-1",
    name: "E2E Administrator",
    email: E2E_ADMIN.email,
    role: "admin" as const,
  },
  permissions: [
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
};

const cookieName = "e2e_refresh";
const cookiePath = "/api/auth";

const sessionCookie =
  `${cookieName}=valid; Path=${cookiePath}; ` +
  "HttpOnly; SameSite=Lax";

const expiredCookie =
  `${cookieName}=; Path=${cookiePath}; ` +
  "HttpOnly; SameSite=Lax; Max-Age=0";

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

export async function installAuthMocks(page: Page) {
  const unexpectedRequests: string[] = [];

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname;

    // ------------------------------------
    // Session restoration
    // ------------------------------------

    if (path === "/api/auth/refresh" && method === "POST") {
      const cookies = request.headers()["cookie"] ?? "";

      const hasSession = cookies
        .split(";")
        .some((part) => part.trim() === `${cookieName}=valid`);

      if (!hasSession) {
        await route.fulfill({
          status: 401,
          json: {
            error: {
              code: "INVALID_SESSION",
              message: "Session expired or invalid",
            },
          },
        });
        return;
      }

      await route.fulfill({
        status: 200,
        json: session,
      });
      return;
    }

    // ------------------------------------
    // Login
    // ------------------------------------

    if (path === "/api/auth/login" && method === "POST") {
      const credentials = request.postDataJSON() as {
        email?: string;
        password?: string;
      };

      if (
        credentials.email !== E2E_ADMIN.email ||
        credentials.password !== E2E_ADMIN.password
      ) {
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
          "set-cookie": sessionCookie,
        },
        json: session,
      });
      return;
    }

    // ------------------------------------
    // Logout
    // ------------------------------------

    if (path === "/api/auth/logout" && method === "POST") {
      await route.fulfill({
        status: 204,
        headers: {
          "set-cookie": expiredCookie,
        },
      });
      return;
    }

    // ------------------------------------
    // Protected business endpoints
    // ------------------------------------

    const authorization = request.headers()["authorization"];

    if (authorization !== `Bearer ${accessToken}`) {
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

    if (path === "/api/employees" && method === "GET") {
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

    if (path === "/api/departments" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          data: [
            {
              id: departmentId,
              name: "Engineering",
              description: null,
              headEmployeeId: null,
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
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

    // Never allow unexpected API requests through
    // to the real backend.
    unexpectedRequests.push(`${method} ${path}`);

    await route.fulfill({
      status: 501,
      json: {
        error: {
          code: "UNMOCKED_API",
          message: `No E2E mock for ${method} ${path}`,
        },
      },
    });
  });

  return { unexpectedRequests };
}
