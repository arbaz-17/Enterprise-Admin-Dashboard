
import { test, expect } from "@playwright/test";

import {
  E2E_ADMIN,
  installAuthMocks,
} from "./mocks/auth";

import { installEmployeeMocks } from "./mocks/employees";

test.describe("Employee Management — Browser Workflow", () => {
  test("creates, edits and deletes an employee", async ({
    page,
  }) => {
    // Register all HTTP mocks before navigation.
    const auth = await installAuthMocks(page);
    const api = await installEmployeeMocks(page);

    // ------------------------------------
    // 1. Login using the real login form
    // ------------------------------------

    await page.goto("/employees");

    await expect(page).toHaveURL(/\/login/);

    await page
      .getByRole("textbox", {
        name: "Email address",
      })
      .fill(E2E_ADMIN.email);

    await page
      .locator('input[name="password"]')
      .fill(E2E_ADMIN.password);

    await page
      .getByRole("button", { name: "Sign in" })
      .click();

    await expect(page).toHaveURL(/\/employees$/);

    const table = page.getByRole("table", {
      name: "Employees",
    });

    await expect(
      table.getByText("E2E Browser Employee"),
    ).toBeVisible();

    // ------------------------------------
    // 2. Create employee
    // ------------------------------------

    await page
      .getByRole("button", {
        name: "Add employee",
      })
      .click();

    const createDialog = page.getByRole("dialog", {
      name: "Add employee",
    });

    await expect(createDialog).toBeVisible();

    await createDialog
      .getByLabel("Full name *")
      .fill("E2E New Employee");

    await createDialog
      .getByLabel("Work email *")
      .fill("new.employee@example.test");

    await createDialog
      .getByLabel("Designation *")
      .fill("Software Engineer");

    // Choose the real Radix Select option.
    await createDialog
      .locator("#employee-department")
      .click();

    await page
      .getByRole("option", { name: "Engineering" })
      .click();

    await createDialog
      .getByRole("button", {
        name: "Create employee",
      })
      .click();

    // Confirm new employee appears after the POST
    // and React Query refresh.
    await expect(
      table.getByText("E2E New Employee"),
    ).toBeVisible();

    expect(api.writes.created).toHaveLength(1);

    expect(api.writes.created[0]).toMatchObject({
      fullName: "E2E New Employee",
      workEmail: "new.employee@example.test",
      designation: "Software Engineer",
    });

    // ------------------------------------
    // 3. Edit employee
    // ------------------------------------

    await table
      .getByRole("button", {
        name: "Edit E2E New Employee",
      })
      .click();

    const editDialog = page.getByRole("dialog", {
      name: "Edit employee",
    });

    await expect(editDialog).toBeVisible();

    await editDialog
      .getByLabel("Designation *")
      .fill("Senior Frontend Developer");

    await editDialog
      .getByRole("button", {
        name: "Save changes",
      })
      .click();

    const employeeRow = table.getByRole("row", {
      name: /E2E New Employee/,
    });

    await expect(employeeRow).toContainText(
      "Senior Frontend Developer",
    );

    expect(api.writes.updated).toHaveLength(1);
    expect(api.writes.updated[0].input.designation)
      .toBe("Senior Frontend Developer");

    // ------------------------------------
    // 4. Reload and confirm state
    // ------------------------------------

    await page.reload();

    await expect(page).toHaveURL(/\/employees$/);

    await expect(employeeRow).toContainText(
      "Senior Frontend Developer",
    );


    // ------------------------------------
    // 5. Delete employee
    // ------------------------------------

    await table
      .getByRole("button", {
        name: "Delete E2E New Employee",
      })
      .click();

    const deleteDialog = page.getByRole(
      "alertdialog",
      { name: "Delete employee?" },
    );

    await expect(deleteDialog).toBeVisible();

    // Ensure deletion hasn't happened yet.
    expect(api.writes.deleted).toHaveLength(0);

    // Start listening BEFORE clicking confirm.
    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        new URL(response.url()).pathname.startsWith(
          "/api/employees/",
        ),
    );

    await deleteDialog
      .getByRole("button", {
        name: "Delete employee",
      })
      .click();

    // Wait for the mocked API response to complete.
    const deleteResponse = await deleteResponsePromise;

    expect(deleteResponse.status()).toBe(204);

    // Verify our mock recorded the deletion.
    expect(api.writes.deleted).toHaveLength(1);

    // Wait for the dialog to close.
    await expect(deleteDialog).not.toBeVisible();

    // Verify the deleted employee is absent.
    await expect(
      table.getByText("E2E New Employee"),
    ).toHaveCount(0);

    // Verify original employee remains.
    await expect(
      table.getByText("E2E Browser Employee"),
    ).toBeVisible();


    // ------------------------------------
    // 6. Final verification
    // ------------------------------------

    expect(api.getEmployees()).toHaveLength(1);

    expect(api.getEmployees()[0].fullName).toBe(
      "E2E Browser Employee",
    );

    expect(api.getListRequests()).toBeGreaterThanOrEqual(4);

    expect(auth.unexpectedRequests).toEqual([]);
  });
});
