
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { http, HttpResponse } from "msw";

import { AuthProvider } from "@/features/auth/auth-provider";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { EmployeesPage } from "@/pages/employees-page";
import { setAccessToken } from "@/lib/api-client";
import { server } from "@/test/mocks/server";

import type { AuthResponse } from "@/features/auth/auth.types";
import type {
  Employee,
  EmployeeInput,
} from "@/features/employees/employees.types";

// -----------------------------------------
// Fixtures
// -----------------------------------------

const departmentId =
  "11111111-1111-4111-8111-111111111111";

const originalEmployee: Employee = {
  id: "22222222-2222-4222-8222-222222222222",
  fullName: "Aisha Khan",
  workEmail: "aisha@example.test",
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

// -----------------------------------------
// Test rendering
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
            <Route
              path="/login"
              element={<h1>Login screen</h1>}
            />
            <Route
              element={
                <ProtectedRoute
                  requiredPermission="employees:read"
                />
              }
            >
              <Route
                path="/employees"
                element={<EmployeesPage />}
              />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// -----------------------------------------
// jsdom support for Radix Select
// -----------------------------------------

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView ??= () => {};
  HTMLElement.prototype.hasPointerCapture ??= () => false;
  HTMLElement.prototype.setPointerCapture ??= () => {};
  HTMLElement.prototype.releasePointerCapture ??= () => {};

  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  setAccessToken(null);

  server.use(
    http.post("*/api/auth/refresh", () => {
      return HttpResponse.json(adminSession);
    }),

    http.get("*/api/departments", () => {
      return HttpResponse.json({
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
      });
    }),

    http.get("*/api/employees/account-options", () => {
      return HttpResponse.json({ data: [] });
    }),
  );
});

afterEach(() => {
  setAccessToken(null);
});

// -----------------------------------------
// Employee creation integration test
// -----------------------------------------

describe("Employee creation integration", () => {
  it("creates an employee and refreshes the table", async () => {
    const user = userEvent.setup();

    let employees: Employee[] = [originalEmployee];
    let listRequests = 0;
    let createRequests = 0;
    let receivedPayload: EmployeeInput | undefined;

    server.use(
      http.get("*/api/employees", () => {
        listRequests += 1;

        return HttpResponse.json({
          data: employees,
          pagination: {
            page: 1,
            pageSize: 10,
            total: employees.length,
            totalPages: 1,
          },
        });
      }),

      http.post("*/api/employees", async ({ request }) => {
        createRequests += 1;

        const payload =
          (await request.json()) as EmployeeInput;

        receivedPayload = payload;

        const created: Employee = {
          ...originalEmployee,
          ...payload,
          id: "33333333-3333-4333-8333-333333333333",
          departmentName: "Engineering",
          linkedUserName: null,
          createdAt: "2026-01-02T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
        };

        employees = [...employees, created];

        return HttpResponse.json(
          { data: created },
          { status: 201 },
        );
      }),
    );

    renderEmployees();

    // 1. Verify initial API data.
    expect(
      await screen.findByText(originalEmployee.fullName),
    ).toBeInTheDocument();

    expect(
      screen.getByText("1 employee found"),
    ).toBeInTheDocument();

    // 2. Open actual employee form.
    await user.click(
      screen.getByRole("button", {
        name: "Add employee",
      }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Add employee",
    });

    // 3. Complete required fields.
    await user.type(
      within(dialog).getByLabelText("Full name *"),
      "Nadia Ali",
    );

    await user.type(
      within(dialog).getByLabelText("Work email *"),
      "nadia@example.test",
    );

    await user.type(
      within(dialog).getByLabelText("Designation *"),
      "Frontend Developer",
    );

    // 4. Select department through the real UI.
    const departmentTrigger =
      within(dialog).getByRole("combobox", {
        name: /Department/,
      });

    await waitFor(() => {
      expect(departmentTrigger).toBeEnabled();
    });

    await user.click(departmentTrigger);

    await user.click(
      await screen.findByRole("option", {
        name: "Engineering",
      }),
    );

    // 5. Submit the form.
    await user.click(
      within(dialog).getByRole("button", {
        name: "Create employee",
      }),
    );

    // 6. Confirm the expected API payload.
    await waitFor(() => {
      expect(createRequests).toBe(1);
    });

    expect(receivedPayload).toEqual({
      fullName: "Nadia Ali",
      workEmail: "nadia@example.test",
      designation: "Frontend Developer",
      departmentId,
      userId: null,
      status: "active",
      joiningDate: null,
    });

    // 7. Verify query invalidation triggered a refetch.
    await waitFor(() => {
      expect(listRequests).toBeGreaterThanOrEqual(2);
    });

    // 8. Verify the updated table displays new data.
    const table = await screen.findByRole("table", {
      name: "Employees",
    });

    expect(
      await within(table).findByText("Nadia Ali"),
    ).toBeInTheDocument();

    expect(
      within(table).getByText("nadia@example.test"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("2 employees found"),
    ).toBeInTheDocument();

    // 9. Successful creation should close the dialog.
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", {
          name: "Add employee",
        }),
      ).not.toBeInTheDocument();
    });
  });
});
