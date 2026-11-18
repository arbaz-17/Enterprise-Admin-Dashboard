
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

import {
  E2E_ACCOUNTS,
  installRoleMocks,
} from "./mocks/roles";

import {
  installNavigationMocks,
} from "./mocks/navigation";

async function loginAsAdmin(page: Page) {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);

  await page
    .getByRole("textbox", {
      name: "Email address",
    })
    .fill(E2E_ACCOUNTS.admin.email);

  await page
    .locator('input[name="password"]')
    .fill(E2E_ACCOUNTS.admin.password);

  await page
    .getByRole("button", {
      name: "Sign in",
    })
    .click();

  await expect(page).toHaveURL(/\/$/);

  await expect(
    page.getByRole("heading", {
      name: "Overview",
      exact: true,
    }),
  ).toBeVisible();
}

test.describe("Application navigation — Browser Workflows", () => {
  test("admin navigates across all main modules and loads their records", async ({
    page,
  }) => {
    // Role mocks: auth, dashboard, employees,
    // departments.
    const auth = await installRoleMocks(page);

    // Additional module mocks: clients, projects,
    // users, audit logs.
    const navigation =
      await installNavigationMocks(page);

    await loginAsAdmin(page);

    const mainNav = page.getByRole("navigation", {
      name: "Main navigation",
    });

    // -----------------------------------
    // 1. Dashboard is loaded
    // -----------------------------------

    await expect(
      page.getByText("Total employees"),
    ).toBeVisible();

    await expect(
      page.getByText("Active projects"),
    ).toBeVisible();

    // -----------------------------------
    // 2. Employees
    // -----------------------------------

    await mainNav
      .getByRole("link", { name: "Employees" })
      .click();

    await expect(page).toHaveURL(/\/employees$/);

    await expect(
      page.getByRole("heading", {
        name: "Employees",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page
        .getByRole("table", { name: "Employees" })
        .getByText("E2E Browser Employee"),
    ).toBeVisible();

    // -----------------------------------
    // 3. Departments
    // -----------------------------------

    await mainNav
      .getByRole("link", { name: "Departments" })
      .click();

    await expect(page).toHaveURL(/\/departments$/);

    await expect(
      page.getByRole("heading", {
        name: "Departments",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page
        .getByRole("table", { name: "Departments" })
        .getByText("Engineering"),
    ).toBeVisible();

    // -----------------------------------
    // 4. Clients
    // -----------------------------------

    await mainNav
      .getByRole("link", { name: "Clients" })
      .click();

    await expect(page).toHaveURL(/\/clients$/);

    await expect(
      page.getByRole("heading", {
        name: "Clients",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page
        .getByRole("table", { name: "Clients" })
        .getByText("E2E Smoke Client"),
    ).toBeVisible();

    // -----------------------------------
    // 5. Projects
    // -----------------------------------

    await mainNav
      .getByRole("link", { name: "Projects" })
      .click();

    await expect(page).toHaveURL(/\/projects$/);

    await expect(
      page.getByRole("heading", {
        name: "Projects",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page
        .getByRole("table", { name: "Projects" })
        .getByText("E2E Smoke Project"),
    ).toBeVisible();

    // -----------------------------------
    // 6. Users & Roles
    // -----------------------------------

    await mainNav
      .getByRole("link", { name: "Users & Roles" })
      .click();

    await expect(page).toHaveURL(/\/users$/);

    await expect(
      page.getByRole("heading", {
        name: "Users & Roles",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page
        .getByRole("table", { name: "User accounts" })
        .getByText("E2E Team Manager"),
    ).toBeVisible();

    // -----------------------------------
    // 7. Audit Logs
    // -----------------------------------

    await mainNav
      .getByRole("link", { name: "Audit Logs" })
      .click();

    await expect(page).toHaveURL(/\/audits$/);

    await expect(
      page.getByRole("heading", {
        name: "Audit Logs",
        exact: true,
      }),
    ).toBeVisible();

    const auditTable = page.getByRole("table", {
      name: "Audit events",
    });

    await expect(
      auditTable.getByText(
        "E2E navigation smoke event",
      ),
    ).toBeVisible();

    // -----------------------------------
    // 8. Reload a deep-linked route
    // -----------------------------------

    await page.reload();

    await expect(page).toHaveURL(/\/audits$/);

    await expect(
      auditTable.getByText(
        "E2E navigation smoke event",
      ),
    ).toBeVisible();

    // -----------------------------------
    // 9. Return to Dashboard
    // -----------------------------------

    await mainNav
      .getByRole("link", { name: "Overview" })
      .click();

    await expect(page).toHaveURL(/\/$/);

    await expect(
      page.getByRole("heading", {
        name: "Overview",
        exact: true,
      }),
    ).toBeVisible();

    // -----------------------------------
    // 10. Verify all four new APIs were used
    // -----------------------------------

    expect(
      [...new Set(navigation.handledRequests)].sort(),
    ).toEqual([
      "/api/audits",
      "/api/clients",
      "/api/projects",
      "/api/users",
    ]);

    // No unexpected requests should have reached
    // the fallback handler.
    expect(auth.unexpectedRequests).toEqual([]);
  });

  test("dashboard refresh re-fetches all six independent widgets", async ({
    page,
  }) => {
    const auth = await installRoleMocks(page);

    const dashboardPaths = [
      "/api/dashboard/metrics",
      "/api/dashboard/monthly-activity",
      "/api/dashboard/project-status",
      "/api/dashboard/departments",
      "/api/dashboard/recent-projects",
      "/api/dashboard/operations",
    ];

    const requestCounts = new Map<string, number>();

    // Observe real browser HTTP requests.
    // Route requests fall back to installRoleMocks,
    // so their responses remain mocked.
    await page.route(
      "**/api/dashboard/**",
      async (route) => {
        const path = new URL(
          route.request().url(),
        ).pathname;

        requestCounts.set(
          path,
          (requestCounts.get(path) ?? 0) + 1,
        );

        await route.fallback();
      },
    );

    await loginAsAdmin(page);

    await expect(
      page.getByText("Total employees"),
    ).toBeVisible();

    // Ensure all six endpoints were requested
    // when the dashboard first loaded.
    await expect
      .poll(() =>
        dashboardPaths.every(
          (path) =>
            (requestCounts.get(path) ?? 0) >= 1,
        ),
      )
      .toBe(true);

    const refreshButton = page.getByRole("button", {
      name: "Refresh",
      exact: true,
    });

    await expect(refreshButton).toBeEnabled();

    // Record how many calls each endpoint received
    // before the user clicks Refresh.
    const countsBeforeRefresh = new Map(
      dashboardPaths.map((path) => [
        path,
        requestCounts.get(path) ?? 0,
      ]),
    );

    // -----------------------------------
    // Trigger all dashboard queries again
    // -----------------------------------

    await refreshButton.click();

    // Each endpoint must receive a new request.
    await expect
      .poll(() =>
        dashboardPaths.every(
          (path) =>
            (requestCounts.get(path) ?? 0) >
            (countsBeforeRefresh.get(path) ?? 0),
        ),
      )
      .toBe(true);

    // Dashboard finishes refreshing.
    await expect(refreshButton).toBeEnabled();

    // The existing widgets are still usable.
    await expect(
      page.getByText("Total employees"),
    ).toBeVisible();

    await expect(
      page.getByText("Completed projects"),
    ).toBeVisible();

    expect(auth.unexpectedRequests).toEqual([]);
  });
});
