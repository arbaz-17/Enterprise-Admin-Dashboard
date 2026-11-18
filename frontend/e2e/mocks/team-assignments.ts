
import type { Page } from "@playwright/test";

import type {
  AvailableEmployeeResponse,
  ProjectTeamMember,
  TeamResponse,
} from "../../src/features/team-assignments/team-assignments.types";

import {
  ASSIGNED_PROJECT_ID,
  UNASSIGNED_PROJECT_ID,
} from "./projects";

export const E2E_TEAM_EMPLOYEE_ID =
  "22222222-2222-4222-8222-222222222222";

const INITIAL_MEMBER_ID =
  "66666666-6666-4666-8666-666666666666";

const OTHER_MEMBER_ID =
  "88888888-8888-4888-8888-888888888888";

const NEW_ASSIGNMENT_ID =
  "99999999-9999-4999-8999-999999999999";

const assignedAt = "2026-01-10T09:00:00.000Z";

const eligibleEmployee = {
  id: E2E_TEAM_EMPLOYEE_ID,
  name: "E2E Browser Employee",
  email: "browser@example.test",
  designation: "Frontend Developer",
  departmentName: "Engineering",
};

const projectNames: Record<string, string> = {
  [ASSIGNED_PROJECT_ID]: "E2E Assigned Project",
  [UNASSIGNED_PROJECT_ID]: "E2E Unassigned Project",
};

export async function installTeamAssignmentMocks(
  page: Page,
) {
  // Each test receives a fresh independent dataset.
  const membersByProject: Record<
    string,
    ProjectTeamMember[]
  > = {
    [ASSIGNED_PROJECT_ID]: [
      {
        id: "77777777-7777-4777-8777-777777777777",
        employeeId: INITIAL_MEMBER_ID,
        fullName: "E2E Existing Team Member",
        workEmail: "existing@example.test",
        designation: "Backend Developer",
        departmentName: "Engineering",
        status: "active",
        assignedAt,
      },
    ],

    [UNASSIGNED_PROJECT_ID]: [
      {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        employeeId: OTHER_MEMBER_ID,
        fullName: "E2E Other Team Member",
        workEmail: "other@example.test",
        designation: "QA Engineer",
        departmentName: "Engineering",
        status: "active",
        assignedAt,
      },
    ],
  };

  const writes = {
    added: [] as Array<{
      projectId: string;
      employeeId: string;
    }>,
    removed: [] as Array<{
      projectId: string;
      employeeId: string;
    }>,
  };

  const unexpectedRequests: string[] = [];

  let listRequests = 0;
  let optionRequests = 0;

  // Register this AFTER the role and project mocks.
  // The team route takes precedence over general
  // /api/projects requests.
  await page.route(
    "**/api/projects/*/assignments**",
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const method = request.method();

      const match = url.pathname.match(
        /^\/api\/projects\/([^/]+)\/assignments(?:\/([^/]+))?\/?$/,
      );

      if (!match) {
        unexpectedRequests.push(
          `${method} ${url.pathname}`,
        );

        await route.fulfill({
          status: 501,
          json: {
            error: {
              code: "UNMOCKED_API",
              message: "Unsupported assignment request",
            },
          },
        });

        return;
      }

      const projectId = decodeURIComponent(match[1]);
      const subPath = match[2];

      // These tests use a Manager session.
      const isManager =
        request.headers()["authorization"] ===
        "Bearer e2e-manager-access-token";

      if (!isManager) {
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

      if (!projectNames[projectId]) {
        await route.fulfill({
          status: 404,
          json: {
            error: {
              code: "PROJECT_NOT_FOUND",
              message: "Project not found",
            },
          },
        });
        return;
      }

      // Only the assigned project can be managed.
      const canManageTeam =
        projectId === ASSIGNED_PROJECT_ID;

      // -----------------------------------
      // GET team members
      // -----------------------------------
      if (
        method === "GET" &&
        subPath === undefined
      ) {
        listRequests += 1;

        const response: TeamResponse = {
          project: {
            id: projectId,
            name: projectNames[projectId],
            clientName: "E2E Client",
            canManageTeam,
          },
          data: [...membersByProject[projectId]],
        };

        await route.fulfill({
          status: 200,
          json: response,
        });

        return;
      }

      // -----------------------------------
      // GET eligible employee options
      // -----------------------------------
      if (
        method === "GET" &&
        subPath === "options"
      ) {
        optionRequests += 1;

        if (!canManageTeam) {
          await route.fulfill({
            status: 403,
            json: {
              error: {
                code: "PROJECT_NOT_ASSIGNED",
                message: "Project not assigned to manager",
              },
            },
          });
          return;
        }

        const q = (url.searchParams.get("q") ?? "")
          .trim()
          .toLowerCase();

        const isAlreadyAssigned =
          membersByProject[projectId].some(
            (member) =>
              member.employeeId ===
              eligibleEmployee.id,
          );

        const matchesSearch =
          !q ||
          eligibleEmployee.name.toLowerCase().includes(q) ||
          eligibleEmployee.email.toLowerCase().includes(q);

        const response: AvailableEmployeeResponse = {
          data:
            !isAlreadyAssigned && matchesSearch
              ? [{ ...eligibleEmployee }]
              : [],
        };

        await route.fulfill({
          status: 200,
          json: response,
        });

        return;
      }

      // -----------------------------------
      // POST add team member
      // -----------------------------------
      if (
        method === "POST" &&
        subPath === undefined
      ) {
        if (!canManageTeam) {
          await route.fulfill({
            status: 403,
            json: {
              error: {
                code: "PROJECT_NOT_ASSIGNED",
                message: "Project not assigned to manager",
              },
            },
          });
          return;
        }

        const body = request.postDataJSON() as {
          employeeId?: string;
        };

        if (
          body.employeeId !== eligibleEmployee.id
        ) {
          await route.fulfill({
            status: 400,
            json: {
              error: {
                code: "VALIDATION_ERROR",
                message: "Invalid employee ID",
              },
            },
          });
          return;
        }

        const alreadyExists =
          membersByProject[projectId].some(
            (member) =>
              member.employeeId === body.employeeId,
          );

        if (alreadyExists) {
          await route.fulfill({
            status: 409,
            json: {
              error: {
                code: "ALREADY_ASSIGNED",
                message: "Employee already assigned",
              },
            },
          });
          return;
        }

        const member: ProjectTeamMember = {
          id: NEW_ASSIGNMENT_ID,
          employeeId: eligibleEmployee.id,
          fullName: eligibleEmployee.name,
          workEmail: eligibleEmployee.email,
          designation: eligibleEmployee.designation,
          departmentName:
            eligibleEmployee.departmentName,
          status: "active",
          assignedAt: "2026-11-18T10:00:00.000Z",
        };

        membersByProject[projectId].push(member);

        writes.added.push({
          projectId,
          employeeId: eligibleEmployee.id,
        });

        await route.fulfill({
          status: 201,
          json: {
            data: { id: NEW_ASSIGNMENT_ID },
          },
        });

        return;
      }

      // -----------------------------------
      // DELETE remove team member
      // -----------------------------------
      if (
        method === "DELETE" &&
        subPath !== undefined &&
        subPath !== "options"
      ) {
        if (!canManageTeam) {
          await route.fulfill({
            status: 403,
            json: {
              error: {
                code: "PROJECT_NOT_ASSIGNED",
                message: "Project not assigned to manager",
              },
            },
          });
          return;
        }

        const employeeId =
          decodeURIComponent(subPath);

        const exists =
          membersByProject[projectId].some(
            (member) =>
              member.employeeId === employeeId,
          );

        if (!exists) {
          await route.fulfill({
            status: 404,
            json: {
              error: {
                code: "ASSIGNMENT_NOT_FOUND",
                message: "Assignment not found",
              },
            },
          });
          return;
        }

        membersByProject[projectId] =
          membersByProject[projectId].filter(
            (member) =>
              member.employeeId !== employeeId,
          );

        writes.removed.push({
          projectId,
          employeeId,
        });

        await route.fulfill({
          status: 204,
          body: "",
        });

        return;
      }

      unexpectedRequests.push(
        `${method} ${url.pathname}`,
      );

      await route.fulfill({
        status: 501,
        json: {
          error: {
            code: "UNMOCKED_API",
            message: "Unsupported assignment request",
          },
        },
      });
    },
  );

  return {
    writes,
    unexpectedRequests,
    getMembers: (projectId: string) =>
      [...(membersByProject[projectId] ?? [])],
    getListRequests: () => listRequests,
    getOptionRequests: () => optionRequests,
  };
}
