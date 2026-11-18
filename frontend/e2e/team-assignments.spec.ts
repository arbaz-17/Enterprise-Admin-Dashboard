
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

import {
  E2E_ACCOUNTS,
  installRoleMocks,
} from "./mocks/roles";

import {
  ASSIGNED_PROJECT_ID,
  UNASSIGNED_PROJECT_ID,
  installProjectMocks,
} from "./mocks/projects";

import {
  E2E_TEAM_EMPLOYEE_ID,
  installTeamAssignmentMocks,
} from "./mocks/team-assignments";

async function loginAsManager(page: Page) {
  await page.goto("/projects");

  await expect(page).toHaveURL(/\/login$/);

  await page
    .getByRole("textbox", {
      name: "Email address",
    })
    .fill(E2E_ACCOUNTS.manager.email);

  await page
    .locator('input[name="password"]')
    .fill(E2E_ACCOUNTS.manager.password);

  await page
    .getByRole("button", { name: "Sign in" })
    .click();

  await expect(page).toHaveURL(/\/projects$/);
}

test.describe("Project Team — Browser Workflows", () => {
  test("manager adds and removes a team member without deleting the employee", async ({
    page,
  }) => {
    // Install general routes first, team routes last.
    const auth = await installRoleMocks(page);
    const projects = await installProjectMocks(page);
    const team = await installTeamAssignmentMocks(page);

    await loginAsManager(page);

    // ------------------------------------
    // 1. Navigate from the Projects table
    // ------------------------------------

    const projectTable = page.getByRole("table", {
      name: "Projects",
    });

    const assignedProject = projectTable.getByRole(
      "row",
      { name: /E2E Assigned Project/ },
    );

    await expect(assignedProject).toBeVisible();

    await assignedProject
      .getByRole("link", {
        name: "View team for E2E Assigned Project",
      })
      .click();

    await expect(page).toHaveURL(
      new RegExp(
        `/projects/${ASSIGNED_PROJECT_ID}/team$`,
      ),
    );

    await expect(
      page.getByRole("heading", {
        name: "E2E Assigned Project — Team",
      }),
    ).toBeVisible();

    const teamTable = page.getByRole("table", {
      name: "Project team members",
    });

    await expect(
      teamTable.getByText("E2E Existing Team Member"),
    ).toBeVisible();

    await expect(
      page.getByText(
        "1 employee assigned to this project",
      ),
    ).toBeVisible();

    // ------------------------------------
    // 2. Search for an eligible employee
    // ------------------------------------

    await page
      .getByRole("button", {
        name: "Add member",
        exact: true,
      })
      .click();

    const addDialog = page.getByRole("dialog", {
      name: "Add team member",
    });

    await expect(addDialog).toBeVisible();

    await addDialog
      .getByLabel("Find employee")
      .fill("Browser");

    await addDialog
      .getByRole("button", {
        name: "Search",
        exact: true,
      })
      .click();

    // Wait for the eligible employee Select.
    const select = addDialog.locator("#member-select");

    await expect(select).toBeEnabled();

    await select.click();

    await page
      .getByRole("option", {
        name: /E2E Browser Employee/,
      })
      .click();

    // ------------------------------------
    // 3. Add employee to the project
    // ------------------------------------

    const postResponsePromise =
      page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          new URL(response.url()).pathname ===
            `/api/projects/${ASSIGNED_PROJECT_ID}/assignments`,
      );

    await addDialog
      .getByRole("button", {
        name: "Add member",
        exact: true,
      })
      .click();

    const postResponse = await postResponsePromise;

    expect(postResponse.status()).toBe(201);

    await expect(addDialog).not.toBeVisible();

    const newMemberRow = teamTable.getByRole("row", {
      name: /E2E Browser Employee/,
    });

    await expect(newMemberRow).toBeVisible();

    await expect(newMemberRow).toContainText(
      "Frontend Developer",
    );

    await expect(
      page.getByText(
        "2 employees assigned to this project",
      ),
    ).toBeVisible();

    expect(team.writes.added).toEqual([
      {
        projectId: ASSIGNED_PROJECT_ID,
        employeeId: E2E_TEAM_EMPLOYEE_ID,
      },
    ]);

    // ------------------------------------
    // 4. Reload and verify assignment
    // ------------------------------------

    await page.reload();

    await expect(page).toHaveURL(
      new RegExp(
        `/projects/${ASSIGNED_PROJECT_ID}/team$`,
      ),
    );

    await expect(newMemberRow).toBeVisible();

    await expect(
      teamTable.getByText("E2E Existing Team Member"),
    ).toBeVisible();

    // ------------------------------------
    // 5. Cancel removal first
    // ------------------------------------

    await newMemberRow
      .getByRole("button", {
        name: "Remove E2E Browser Employee from project",
      })
      .click();

    const confirmDialog = page.getByRole(
      "alertdialog",
      { name: "Remove team member?" },
    );

    await expect(confirmDialog).toBeVisible();

    await expect(confirmDialog).toContainText(
      "Their employee profile will not be deleted.",
    );

    // Nothing should be deleted before confirmation.
    expect(team.writes.removed).toHaveLength(0);

    await confirmDialog
      .getByRole("button", {
        name: "Cancel",
      })
      .click();

    await expect(confirmDialog).not.toBeVisible();

    await expect(newMemberRow).toBeVisible();

    expect(team.writes.removed).toHaveLength(0);

    // ------------------------------------
    // 6. Confirm actual removal
    // ------------------------------------

    await newMemberRow
      .getByRole("button", {
        name: "Remove E2E Browser Employee from project",
      })
      .click();

    await expect(confirmDialog).toBeVisible();

    // Listen before clicking to avoid missing
    // a fast mocked DELETE response.
    const deleteResponsePromise =
      page.waitForResponse(
        (response) =>
          response.request().method() === "DELETE" &&
          new URL(response.url()).pathname ===
            `/api/projects/${ASSIGNED_PROJECT_ID}/assignments/${E2E_TEAM_EMPLOYEE_ID}`,
      );

    await confirmDialog
      .getByRole("button", {
        name: "Remove member",
      })
      .click();

    const deleteResponse =
      await deleteResponsePromise;

    expect(deleteResponse.status()).toBe(204);

    await expect(confirmDialog).not.toBeVisible();

    await expect(newMemberRow).toHaveCount(0);

    // Original assignment remains.
    await expect(
      teamTable.getByText("E2E Existing Team Member"),
    ).toBeVisible();

    await expect(
      page.getByText(
        "1 employee assigned to this project",
      ),
    ).toBeVisible();

    expect(team.writes.removed).toEqual([
      {
        projectId: ASSIGNED_PROJECT_ID,
        employeeId: E2E_TEAM_EMPLOYEE_ID,
      },
    ]);

    // ------------------------------------
    // 7. Verify employee profile still exists
    // ------------------------------------

    await page.goto("/employees");

    await expect(
      page.getByText("E2E Browser Employee"),
    ).toBeVisible();

    // ------------------------------------
    // 8. Final state verification
    // ------------------------------------

    expect(
      team.getMembers(ASSIGNED_PROJECT_ID),
    ).toHaveLength(1);

    expect(
      team.getMembers(ASSIGNED_PROJECT_ID)[0]
        .fullName,
    ).toBe("E2E Existing Team Member");

    // Initial GET, refetch after POST,
    // reload, refetch after DELETE.
    expect(
      team.getListRequests(),
    ).toBeGreaterThanOrEqual(4);

    expect(
      team.getOptionRequests(),
    ).toBeGreaterThanOrEqual(1);

    expect(projects.writes).toHaveLength(0);
    expect(auth.unexpectedRequests).toEqual([]);
    expect(team.unexpectedRequests).toEqual([]);
  });

  test("manager can view an unassigned project team but cannot change it", async ({
    page,
  }) => {
    const auth = await installRoleMocks(page);
    const projects = await installProjectMocks(page);
    const team = await installTeamAssignmentMocks(page);

    await loginAsManager(page);

    // Navigate through the real Projects directory.
    const projectTable = page.getByRole("table", {
      name: "Projects",
    });

    const unassignedProject =
      projectTable.getByRole("row", {
        name: /E2E Unassigned Project/,
      });

    await expect(unassignedProject).toBeVisible();

    await unassignedProject
      .getByRole("link", {
        name: "View team for E2E Unassigned Project",
      })
      .click();

    await expect(page).toHaveURL(
      new RegExp(
        `/projects/${UNASSIGNED_PROJECT_ID}/team$`,
      ),
    );

    await expect(
      page.getByRole("heading", {
        name: "E2E Unassigned Project — Team",
      }),
    ).toBeVisible();

    const table = page.getByRole("table", {
      name: "Project team members",
    });

    await expect(
      table.getByText("E2E Other Team Member"),
    ).toBeVisible();

    // Manager cannot add anyone to this project.
    await expect(
      page.getByRole("button", {
        name: "Add member",
        exact: true,
      }),
    ).toHaveCount(0);

    // Manager also cannot remove team members.
    await expect(
      table.getByRole("button", {
        name: /Remove .* from project/,
      }),
    ).toHaveCount(0);

    // Reload should not grant edit permissions.
    await page.reload();

    await expect(
      table.getByText("E2E Other Team Member"),
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "Add member",
        exact: true,
      }),
    ).toHaveCount(0);

    await expect(
      table.getByRole("button", {
        name: /Remove .* from project/,
      }),
    ).toHaveCount(0);

    // No team mutation or eligibility search
    // should have been triggered.
    expect(team.writes.added).toHaveLength(0);
    expect(team.writes.removed).toHaveLength(0);
    expect(team.getOptionRequests()).toBe(0);

    expect(
      team.getMembers(UNASSIGNED_PROJECT_ID),
    ).toHaveLength(1);

    expect(projects.writes).toHaveLength(0);
    expect(auth.unexpectedRequests).toEqual([]);
    expect(team.unexpectedRequests).toEqual([]);
  });
});
