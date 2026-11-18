
import { test, expect } from "@playwright/test";

import {
  E2E_ADMIN,
  installAuthMocks,
} from "./mocks/auth";

test.describe("Authentication — browser workflow", () => {
  test("protects routes, restores sessions and logs out", async ({
    page,
  }) => {
    // Register API mocks before navigating.
    const mocks = await installAuthMocks(page);

    // -----------------------------------
    // 1. Unauthenticated navigation
    // -----------------------------------

    await page.goto("/employees");

    await expect(page).toHaveURL(/\/login$/);

    await expect(
      page.getByRole("heading", {
        name: "Welcome back",
      }),
    ).toBeVisible();

    // -----------------------------------
    // 2. Real browser login interaction
    // -----------------------------------

    await page
      .getByRole("textbox", {
        name: "Email address",
      })
      .fill(E2E_ADMIN.email);

await page
  .locator('input[name="password"]')
  .fill(E2E_ADMIN.password);

    await page
      .getByRole("button", {
        name: "Sign in",
      })
      .click();

    // -----------------------------------
    // 3. Protected navigation succeeds
    // -----------------------------------

    await expect(page).toHaveURL(/\/employees$/);

    await expect(
      page.getByRole("heading", {
        name: "Employees",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByText("E2E Browser Employee"),
    ).toBeVisible();

    // Verify that the mocked login response
    // established an HttpOnly session cookie.
    const cookies = await page.context().cookies();

    expect(
      cookies.some(
        (cookie) =>
          cookie.name === "e2e_refresh" &&
          cookie.httpOnly,
      ),
    ).toBe(true);

    // -----------------------------------
    // 4. Session survives browser reload
    // -----------------------------------

    await page.reload();

    await expect(page).toHaveURL(/\/employees$/);

    await expect(
      page.getByText("E2E Browser Employee"),
    ).toBeVisible();

    // -----------------------------------
    // 5. Logout through the real sidebar
    // -----------------------------------

    await page
      .getByRole("button", { name: "Sign out" })
      .click();

    await expect(page).toHaveURL(/\/login$/);

    const remainingCookies =
      await page.context().cookies();

    expect(
      remainingCookies.some(
        (cookie) => cookie.name === "e2e_refresh",
      ),
    ).toBe(false);

    // -----------------------------------
    // 6. Protected access remains blocked
    // -----------------------------------

    await page.goto("/employees");

    await expect(page).toHaveURL(/\/login$/);

    await expect(
      page.getByRole("heading", {
        name: "Welcome back",
      }),
    ).toBeVisible();

    // Every API request must have a mock.
    expect(mocks.unexpectedRequests).toEqual([]);
  });
});
