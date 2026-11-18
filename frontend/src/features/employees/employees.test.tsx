import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { http, HttpResponse } from "msw";

import { AuthProvider } from "@/features/auth/auth-provider";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { EmployeesPage } from "@/pages/employees-page";
import { setAccessToken } from "@/lib/api-client";
import { server } from "@/test/mocks/server";

import type { AuthResponse } from "@/features/auth/auth.types";
import type { Employee, EmployeeListResponse } from "./employees.types";
import type { DepartmentListResponse } from "@/features/departments/departments.types";

// -----------------------------------------
// Fixtures
// -----------------------------------------

const departmentId = "11111111-1111-4111-8111-111111111111";

const sampleEmployee: Employee = {
  id: "22222222-2222-4222-8222-222222222222",
  fullName: "Arbaz Khan",
  workEmail: "Arbaz@example.test",
  designation: "Software Engineer",
  departmentId,
  departmentName: "Engineering",
  userId: null,
  linkedUserName: null,
  status: "active",
  joiningDate: "2025-11-01",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const adminSession: AuthResponse = {
  accessToken: "test-admin-token",
  tokenType: "Bearer",
  expiresIn: 900,
  user: {
    id: "admin-1",
    name: "Test Administrator",
    email: "admin@example.test",
    role: "admin",
  },
  permissions: [
    "dashboard:read",
    "employees:read",
    "employees:manage",
    "departments:read",
  ],
};

const managerSession: AuthResponse = {
  ...adminSession,
  accessToken: "test-manager-token",
  user: {
    id: "manager-1",
    name: "Test Manager",
    email: "manager@example.test",
    role: "manager",
  },
  permissions: ["dashboard:read", "employees:read", "departments:read"],
};

function employeeList(employees: Employee[]): EmployeeListResponse {
  return {
    data: employees,
    pagination: {
      page: 1,
      pageSize: 10,
      total: employees.length,
      totalPages: Math.ceil(employees.length / 10),
    },
  };
}

const departmentList: DepartmentListResponse = {
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
};

// -----------------------------------------
// Real frontend test wrapper
// -----------------------------------------

function renderEmployees() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/employees"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<h1>Login screen</h1>} />

            <Route
              element={<ProtectedRoute requiredPermission="employees:read" />}
            >
              <Route path="/employees" element={<EmployeesPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// -----------------------------------------
// Default MSW handlers
// -----------------------------------------

beforeEach(() => {
  setAccessToken(null);

  server.use(
    http.post("*/api/auth/refresh", () => {
      return HttpResponse.json(adminSession);
    }),

    http.get("*/api/employees", () => {
      return HttpResponse.json(employeeList([sampleEmployee]));
    }),

    http.get("*/api/departments", () => {
      return HttpResponse.json(departmentList);
    }),

    http.get("*/api/employees/account-options", () => {
      return HttpResponse.json({
        data: [],
      });
    }),
  );
});

afterEach(() => {
  setAccessToken(null);
});

// -----------------------------------------
// Tests
// -----------------------------------------

describe("Employees integration", () => {
  it("renders employee records returned by the API", async () => {
    renderEmployees();

    const table = await screen.findByRole("table", {
      name: "Employees",
    });

    expect(
      await within(table).findByText(sampleEmployee.fullName),
    ).toBeInTheDocument();

    expect(
      within(table).getByText(sampleEmployee.workEmail),
    ).toBeInTheDocument();

    expect(
      within(table).getByText(sampleEmployee.designation),
    ).toBeInTheDocument();

    expect(screen.getByText("1 employee found")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: `Edit ${sampleEmployee.fullName}`,
      }),
    ).toBeInTheDocument();
  });

  it("shows an API error and reloads employees after retry", async () => {
    const user = userEvent.setup();
    let requests = 0;

    server.use(
      http.get("*/api/employees", () => {
        requests += 1;

        if (requests === 1) {
          return HttpResponse.json(
            {
              error: {
                code: "SERVER_ERROR",
                message: "Employee service unavailable",
              },
            },
            { status: 500 },
          );
        }

        return HttpResponse.json(employeeList([sampleEmployee]));
      }),
    );

    renderEmployees();

    expect(
      await screen.findByText("Unable to load employees"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Employee service unavailable"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Try again",
      }),
    );

    expect(await screen.findByText("Arbaz Khan")).toBeInTheDocument();

    expect(requests).toBe(2);
  });

  it("renders read-only controls for a manager", async () => {
    server.use(
      http.post("*/api/auth/refresh", () => {
        return HttpResponse.json(managerSession);
      }),
    );

    renderEmployees();

    expect(await screen.findByText("Arbaz Khan")).toBeInTheDocument();

    expect(screen.getByText("Read-only")).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Add employee",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Edit Arbaz Khan",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Delete Arbaz Khan",
      }),
    ).not.toBeInTheDocument();
  });

  it("prevents submitting an invalid employee form", async () => {
    const user = userEvent.setup();
    let createRequests = 0;

    server.use(
      http.post("*/api/employees", () => {
        createRequests += 1;

        return HttpResponse.json({ data: sampleEmployee }, { status: 201 });
      }),
    );

    renderEmployees();

    await screen.findByText("Arbaz Khan");

    await user.click(
      screen.getByRole("button", {
        name: "Add employee",
      }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Add employee",
    });

    const submitButton = within(dialog).getByRole("button", {
      name: "Create employee",
    });

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    await user.click(submitButton);

    expect(
      await within(dialog).findByText("Name is required"),
    ).toBeInTheDocument();

    expect(within(dialog).getByText("Enter a valid email")).toBeInTheDocument();

    expect(
      within(dialog).getByText("Designation is required"),
    ).toBeInTheDocument();

    expect(within(dialog).getByText("Select a department")).toBeInTheDocument();

    expect(createRequests).toBe(0);
  });
});
