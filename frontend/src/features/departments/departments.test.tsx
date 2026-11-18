import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { http, HttpResponse } from "msw";

import { AuthProvider } from "@/features/auth/auth-provider";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { DepartmentsPage } from "@/pages/departments-page";
import { setAccessToken } from "@/lib/api-client";
import { server } from "@/test/mocks/server";

import type { AuthResponse } from "@/features/auth/auth.types";
import type { Department, DepartmentListResponse } from "./departments.types";

// -----------------------------------------
// Fixtures
// -----------------------------------------

const engineering: Department = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Engineering",
  description: "Software development team",
  headEmployeeId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const sales: Department = {
  ...engineering,
  id: "22222222-2222-4222-8222-222222222222",
  name: "Sales",
  description: "Business development team",
};

const adminSession: AuthResponse = {
  accessToken: "department-admin-token",
  tokenType: "Bearer",
  expiresIn: 900,
  user: {
    id: "admin-1",
    name: "Test Administrator",
    email: "admin@example.test",
    role: "admin",
  },
  permissions: ["dashboard:read", "departments:read", "departments:manage"],
};

const managerSession: AuthResponse = {
  ...adminSession,
  user: {
    id: "manager-1",
    name: "Test Manager",
    email: "manager@example.test",
    role: "manager",
  },
  permissions: ["dashboard:read", "departments:read"],
};

function departmentList(
  records: Department[],
  page = 1,
  total = records.length,
): DepartmentListResponse {
  return {
    data: records,
    pagination: {
      page,
      pageSize: 10,
      total,
      totalPages: Math.ceil(total / 10),
    },
  };
}

// -----------------------------------------
// Render real page
// -----------------------------------------

function renderDepartments(initialPath = "/departments") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<h1>Login screen</h1>} />

            <Route
              element={<ProtectedRoute requiredPermission="departments:read" />}
            >
              <Route path="/departments" element={<DepartmentsPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// -----------------------------------------
// Default handlers
// -----------------------------------------

beforeEach(() => {
  setAccessToken(null);

  server.use(
    http.post("*/api/auth/refresh", () => {
      return HttpResponse.json(adminSession);
    }),

    http.get("*/api/departments", () => {
      return HttpResponse.json(departmentList([engineering, sales]));
    }),
  );
});

afterEach(() => {
  setAccessToken(null);
});

// -----------------------------------------
// Tests
// -----------------------------------------

describe("Departments integration", () => {
  it("searches through the API and resets pagination", async () => {
    const user = userEvent.setup();

    const requests: Array<{
      page: string | null;
      q: string | null;
    }> = [];

    server.use(
      http.get("*/api/departments", ({ request }) => {
        const params = new URL(request.url).searchParams;
        const page = params.get("page");
        const q = params.get("q");

        requests.push({ page, q });

        if (q === "Engineering") {
          return HttpResponse.json(departmentList([engineering]));
        }

        return HttpResponse.json(departmentList([sales], 2, 12));
      }),
    );

    renderDepartments("/departments?page=2");

    expect(await screen.findByText("Sales")).toBeInTheDocument();

    const searchForm = screen.getByRole("search");

    await user.type(
      within(searchForm).getByRole("searchbox", {
        name: "Search departments",
      }),
      "Engineering",
    );

    await user.click(
      within(searchForm).getByRole("button", {
        name: "Search",
      }),
    );

    expect(await screen.findByText("Engineering")).toBeInTheDocument();

    expect(
      requests.some(
        (request) => request.q === "Engineering" && request.page === "1",
      ),
    ).toBe(true);

    expect(screen.queryByText("Sales")).not.toBeInTheDocument();
  });

  it("requires confirmation before deleting a department", async () => {
    const user = userEvent.setup();

    let deleted = false;
    let deleteRequests = 0;

    server.use(
      http.get("*/api/departments", () => {
        return HttpResponse.json(departmentList(deleted ? [] : [engineering]));
      }),

      http.delete("*/api/departments/:id", () => {
        deleteRequests += 1;
        deleted = true;

        return new HttpResponse(null, {
          status: 204,
        });
      }),
    );

    renderDepartments();

    expect(await screen.findByText("Engineering")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Delete Engineering",
      }),
    );

    const confirmation = await screen.findByRole("alertdialog");

    expect(
      within(confirmation).getByText("Delete department?"),
    ).toBeInTheDocument();

    // Opening the dialog must not delete anything.
    expect(deleteRequests).toBe(0);

    await user.click(
      within(confirmation).getByRole("button", {
        name: "Delete department",
      }),
    );

    expect(await screen.findByText("No departments yet")).toBeInTheDocument();

    expect(deleteRequests).toBe(1);
    expect(deleted).toBe(true);
  });

  it("prevents a read-only manager from managing departments", async () => {
    server.use(
      http.post("*/api/auth/refresh", () => {
        return HttpResponse.json(managerSession);
      }),
    );

    renderDepartments();

    expect(await screen.findByText("Engineering")).toBeInTheDocument();

    expect(screen.getByText("Read-only")).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Add department",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Edit Engineering",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Delete Engineering",
      }),
    ).not.toBeInTheDocument();
  });
});
