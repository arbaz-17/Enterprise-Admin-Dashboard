
import type { Page } from "@playwright/test";

import type {
  Employee,
  EmployeeInput,
} from "../../src/features/employees/employees.types";

const departmentId =
  "11111111-1111-4111-8111-111111111111";

const initialEmployee: Employee = {
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

export async function installEmployeeMocks(page: Page) {
  let employees: Employee[] = [{ ...initialEmployee }];

  const writes = {
    created: [] as EmployeeInput[],
    updated: [] as Array<{
      id: string;
      input: EmployeeInput;
    }>,
    deleted: [] as string[],
  };

  let listRequests = 0;

  // Register after installAuthMocks().
  // Playwright evaluates the most recently registered
  // matching route first.
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname;

    // --------------------------------------
    // Account options used by Employee form
    // --------------------------------------

    if (
      path === "/api/employees/account-options" &&
      method === "GET"
    ) {
      await route.fulfill({
        status: 200,
        json: { data: [] },
      });
      return;
    }

    // --------------------------------------
    // GET /api/employees
    // --------------------------------------

    if (
      path === "/api/employees" &&
      method === "GET"
    ) {
      listRequests += 1;

      const params = url.searchParams;

      const q = (params.get("q") ?? "")
        .trim()
        .toLowerCase();

      const status = params.get("status");
      const department = params.get("departmentId");

      const pageNumber = Math.max(
        1,
        Number(params.get("page")) || 1,
      );

      const pageSize = Math.max(
        1,
        Number(params.get("pageSize")) || 10,
      );

      const filtered = employees
        .filter((employee) => {
          const matchesSearch =
            !q ||
            [
              employee.fullName,
              employee.workEmail,
              employee.designation,
            ].some((value) =>
              value.toLowerCase().includes(q),
            );

          const matchesStatus =
            !status || employee.status === status;

          const matchesDepartment =
            !department ||
            employee.departmentId === department;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesDepartment
          );
        })
        .sort((a, b) =>
          a.fullName.localeCompare(b.fullName),
        );

      const start = (pageNumber - 1) * pageSize;

      await route.fulfill({
        status: 200,
        json: {
          data: filtered.slice(
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

    // --------------------------------------
    // POST /api/employees
    // --------------------------------------

    if (
      path === "/api/employees" &&
      method === "POST"
    ) {
      const input =
        request.postDataJSON() as EmployeeInput;

      writes.created.push(input);

      const created: Employee = {
        ...input,
        id: "33333333-3333-4333-8333-333333333333",
        departmentName: "Engineering",
        linkedUserName: null,
        createdAt: "2026-02-01T00:00:00.000Z",
        updatedAt: "2026-02-01T00:00:00.000Z",
      };

      employees = [...employees, created];

      await route.fulfill({
        status: 201,
        json: { data: created },
      });
      return;
    }

    // --------------------------------------
    // PATCH /api/employees/:id
    // --------------------------------------

    if (
      path.startsWith("/api/employees/") &&
      method === "PATCH"
    ) {
      const id = decodeURIComponent(
        path.slice("/api/employees/".length),
      );

      const input =
        request.postDataJSON() as EmployeeInput;

      writes.updated.push({ id, input });

      const existing = employees.find(
        (employee) => employee.id === id,
      );

      if (!existing) {
        await route.fulfill({
          status: 404,
          json: {
            error: {
              code: "EMPLOYEE_NOT_FOUND",
              message: "Employee not found",
            },
          },
        });
        return;
      }

      const updated: Employee = {
        ...existing,
        ...input,
        departmentName: "Engineering",
        updatedAt: "2026-02-02T00:00:00.000Z",
      };

      employees = employees.map((employee) =>
        employee.id === id ? updated : employee,
      );

      await route.fulfill({
        status: 200,
        json: { data: updated },
      });
      return;
    }

    // --------------------------------------
    // DELETE /api/employees/:id
    // --------------------------------------

    if (
      path.startsWith("/api/employees/") &&
      method === "DELETE"
    ) {
      const id = decodeURIComponent(
        path.slice("/api/employees/".length),
      );

      const exists = employees.some(
        (employee) => employee.id === id,
      );

      if (!exists) {
        await route.fulfill({
          status: 404,
          json: {
            error: {
              code: "EMPLOYEE_NOT_FOUND",
              message: "Employee not found",
            },
          },
        });
        return;
      }

      writes.deleted.push(id);

      employees = employees.filter(
        (employee) => employee.id !== id,
      );

      await route.fulfill({
        status: 204,
        body: "",
      });
      return;
    }

    // Delegate authentication and Department requests
    // to the previously installed auth mock.
    await route.fallback();
  });

  return {
    writes,
    getEmployees: () => [...employees],
    getListRequests: () => listRequests,
  };
}
