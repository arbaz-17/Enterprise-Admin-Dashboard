
import { test, expect } from "@playwright/test";

import {
  E2E_ACCOUNTS,
  installRoleMocks,
} from "./mocks/roles";

type Role = keyof typeof E2E_ACCOUNTS;

async function signIn(
  page: import("@playwright/test").Page,
  role: Role,
) {
  const account = E2E_ACCOUNTS[role];

  await page
    .getByRole("textbox", {
      name: "Email address",
    })
    .fill(account.email);

  await page
    .locator('input[name="password"]')
    .fill(account.password);

  await page
    .getByRole("button", { name: "Sign in" })
    .click();
}

test.describe("Role-based authorization — browser", () => {
  // ----------------------------------------
  // 1. Admin
  // ----------------------------------------

  test("admin can access employee management and administrative navigation", async ({
    page,
  }) => {
    const api = await installRoleMocks(page);

    await page.goto("/employees");

    await expect(page).toHaveURL(/\/login$/);

    await signIn(page, "admin");

    await expect(page).toHaveURL(/\/employees$/);

    await expect(
      page.getByRole("heading", {
        name: "Employees",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "Add employee",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "Edit E2E Browser Employee",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "Delete E2E Browser Employee",
      }),
    ).toBeVisible();

    const nav = page.getByRole("navigation", {
      name: "Main navigation",
    });

    await expect(
      nav.getByRole("link", {
        name: "Users & Roles",
      }),
    ).toBeVisible();

    await expect(
      nav.getByRole("link", {
        name: "Audit Logs",
      }),
    ).toBeVisible();

    expect(api.unexpectedRequests).toEqual([]);
  });

  // ----------------------------------------
  // 2. Manager
  // ----------------------------------------

  test("manager can view employees but cannot manage employees or access administration", async ({
    page,
  }) => {
    const api = await installRoleMocks(page);

    await page.goto("/employees");
    await signIn(page, "manager");

    await expect(page).toHaveURL(/\/employees$/);

    await expect(
      page.getByText("E2E Browser Employee"),
    ).toBeVisible();

    await expect(
      page.getByText("Read-only"),
    ).toBeVisible();

    // The entire employee management UI is restricted.
    await expect(
      page.getByRole("button", {
        name: "Add employee",
      }),
    ).toHaveCount(0);

    await expect(
      page.getByRole("button", {
        name: "Edit E2E Browser Employee",
      }),
    ).toHaveCount(0);

    await expect(
      page.getByRole("button", {
        name: "Delete E2E Browser Employee",
      }),
    ).toHaveCount(0);

    const nav = page.getByRole("navigation", {
      name: "Main navigation",
    });

    await expect(
      nav.getByRole("link", {
        name: "Employees",
      }),
    ).toBeVisible();

    await expect(
      nav.getByRole("link", {
        name: "Projects",
      }),
    ).toBeVisible();

    await expect(
      nav.getByRole("link", {
        name: "Users & Roles",
      }),
    ).toHaveCount(0);

    await expect(
      nav.getByRole("link", {
        name: "Audit Logs",
      }),
    ).toHaveCount(0);

    // Direct URL access must also be rejected.
    await page.goto("/users");

    await expect(
      page.getByRole("heading", {
        name: "Access denied",
      }),
    ).toBeVisible();

    await page.goto("/audits");

    await expect(
      page.getByRole("heading", {
        name: "Access denied",
      }),
    ).toBeVisible();

    // Verify the manager's session survives reload.
    await page.goto("/employees");

    await page.reload();

    await expect(
      page.getByText("E2E Browser Employee"),
    ).toBeVisible();

    await expect(
      page.getByText("Read-only"),
    ).toBeVisible();

    expect(api.unexpectedRequests).toEqual([]);
  });

  // ----------------------------------------
  // 3. Viewer
  // ----------------------------------------

  test("viewer can access only the dashboard and is denied organization routes", async ({
    page,
  }) => {
    const api = await installRoleMocks(page);

    await page.goto("/employees");
    await signIn(page, "viewer");

    // We entered a route that the Viewer cannot access.
    await expect(
      page.getByRole("heading", {
        name: "Access denied",
      }),
    ).toBeVisible();

    const nav = page.getByRole("navigation", {
      name: "Main navigation",
    });

    await expect(
      nav.getByRole("link", {
        name: "Overview",
      }),
    ).toBeVisible();

    for (const restricted of [
      "Employees",
      "Departments",
      "Projects",
      "Clients",
      "Users & Roles",
      "Audit Logs",
    ]) {
      await expect(
        nav.getByRole("link", {
          name: restricted,
          exact: true,
        }),
      ).toHaveCount(0);
    }

    // Viewer can use the dashboard.
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: "Overview",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByText("Total employees"),
    ).toBeVisible();

    await expect(
      page.getByText(
        "Project details are available only to authorized users.",
      ),
    ).toBeVisible();

    // Direct navigation cannot bypass the route guard.
    await page.goto("/projects");

    await expect(
      page.getByRole("heading", {
        name: "Access denied",
      }),
    ).toBeVisible();

    await page.goto("/users");

    await expect(
      page.getByRole("heading", {
        name: "Access denied",
      }),
    ).toBeVisible();

    await page.goto("/employees");

    await expect(
      page.getByRole("heading", {
        name: "Access denied",
      }),
    ).toBeVisible();

    expect(api.unexpectedRequests).toEqual([]);
  });
});
