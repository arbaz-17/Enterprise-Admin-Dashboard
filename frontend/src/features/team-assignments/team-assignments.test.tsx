
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
import { ProjectTeamPage } from "@/pages/project-team-page";
import { setAccessToken } from "@/lib/api-client";
import { server } from "@/test/mocks/server";

import type { AuthResponse } from "@/features/auth/auth.types";
import type {
  ProjectTeamMember,
  EmployeeOption,
  TeamResponse,
} from "./team-assignments.types";

// -----------------------------------------
// Fixtures
// -----------------------------------------

const projectId =
  "11111111-1111-4111-8111-111111111111";

const existingMember: ProjectTeamMember = {
  id: "22222222-2222-4222-8222-222222222222",
  employeeId: "33333333-3333-4333-8333-333333333333",
  fullName: "Aisha Khan",
  workEmail: "aisha@example.test",
  designation: "Software Engineer",
  status: "active",
  departmentName: "Engineering",
  assignedAt: "2026-01-01T00:00:00.000Z",
};

const availableEmployee: EmployeeOption = {
  id: "44444444-4444-4444-8444-444444444444",
  name: "Nadia Ali",
  email: "nadia@example.test",
  designation: "Frontend Developer",
  departmentName: "Engineering",
};

const adminSession: AuthResponse = {
  accessToken: "team-admin-token",
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
    "projects:read",
    "assignments:manage",
  ],
};

const managerSession: AuthResponse = {
  ...adminSession,
  accessToken: "team-manager-token",
  user: {
    id: "manager-1",
    name: "Test Manager",
    email: "manager@example.test",
    role: "manager",
  },
};

function teamResponse(
  members: ProjectTeamMember[],
  canManageTeam = true,
): TeamResponse {
  return {
    project: {
      id: projectId,
      name: "Portal Upgrade",
      clientName: "Acme Technologies",
      canManageTeam,
    },
    data: members,
  };
}

// -----------------------------------------
// Real page wrapper
// -----------------------------------------

function renderTeam() {
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
      <MemoryRouter
        initialEntries={[
          `/projects/${projectId}/team`,
        ]}
      >
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={<h1>Login screen</h1>}
            />

            <Route
              element={
                <ProtectedRoute
                  requiredPermission="projects:read"
                />
              }
            >
              <Route
                path="/projects/:projectId/team"
                element={<ProjectTeamPage />}
              />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// -----------------------------------------
// Radix Select browser support
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

// -----------------------------------------
// Default handlers
// -----------------------------------------

beforeEach(() => {
  setAccessToken(null);

  server.use(
    http.post("*/api/auth/refresh", () => {
      return HttpResponse.json(adminSession);
    }),

    http.get(
      "*/api/projects/:projectId/assignments",
      () => {
        return HttpResponse.json(
          teamResponse([existingMember]),
        );
      },
    ),

    http.get(
      "*/api/projects/:projectId/assignments/options",
      () => {
        return HttpResponse.json({
          data: [availableEmployee],
        });
      },
    ),
  );
});

afterEach(() => {
  setAccessToken(null);
});

// -----------------------------------------
// Integration tests
// -----------------------------------------

describe("Project Team Assignments", () => {
  it("prevents a manager from modifying an unassigned project team", async () => {
    server.use(
      http.post("*/api/auth/refresh", () => {
        return HttpResponse.json(managerSession);
      }),

      http.get(
        "*/api/projects/:projectId/assignments",
        () => {
          return HttpResponse.json(
            teamResponse([existingMember], false),
          );
        },
      ),
    );

    renderTeam();

    expect(
      await screen.findByText("Aisha Khan"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Portal Upgrade — Team",
      }),
    ).toBeInTheDocument();

    // Manager has assignments:manage, but
    // this project explicitly denies team management.
    expect(
      screen.queryByRole("button", {
        name: "Add member",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Remove Aisha Khan from project",
      }),
    ).not.toBeInTheDocument();

    // Read access remains available.
    expect(
      screen.getByRole("table", {
        name: "Project team members",
      }),
    ).toBeInTheDocument();
  });

  it("adds an eligible employee and refreshes the project team", async () => {
    const user = userEvent.setup();

    let members: ProjectTeamMember[] = [
      existingMember,
    ];

    let listRequests = 0;
    let addRequests = 0;
    let receivedEmployeeId: string | null = null;

    server.use(
      http.get(
        "*/api/projects/:projectId/assignments",
        () => {
          listRequests += 1;

          return HttpResponse.json(
            teamResponse(members),
          );
        },
      ),

      http.get(
        "*/api/projects/:projectId/assignments/options",
        () => {
          return HttpResponse.json({
            data: members.some(
              (member) =>
                member.employeeId === availableEmployee.id,
            )
              ? []
              : [availableEmployee],
          });
        },
      ),

      http.post(
        "*/api/projects/:projectId/assignments",
        async ({ request }) => {
          addRequests += 1;

          const payload = (await request.json()) as {
            employeeId: string;
          };

          receivedEmployeeId = payload.employeeId;

          members = [
            ...members,
            {
              id: "55555555-5555-4555-8555-555555555555",
              employeeId: availableEmployee.id,
              fullName: availableEmployee.name,
              workEmail: availableEmployee.email,
              designation: availableEmployee.designation,
              departmentName: availableEmployee.departmentName,
              status: "active",
              assignedAt: "2026-02-01T00:00:00.000Z",
            },
          ];

          return HttpResponse.json(
            {
              data: {
                id: "55555555-5555-4555-8555-555555555555",
              },
            },
            { status: 201 },
          );
        },
      ),
    );

    renderTeam();

    // Initial team data.
    expect(
      await screen.findByText("Aisha Khan"),
    ).toBeInTheDocument();

    // Open real Add Member dialog.
    await user.click(
      screen.getByRole("button", {
        name: "Add member",
      }),
    );

    const dialog = await screen.findByRole(
      "dialog",
      { name: "Add team member" },
    );

    // Wait for the eligible employees API.
    const employeeSelect =
      within(dialog).getByRole("combobox", {
        name: "Employee",
      });

    await waitFor(() => {
      expect(employeeSelect).toBeEnabled();
    });

    await user.click(employeeSelect);

    // API supplies only eligible employees.
    await user.click(
      await screen.findByRole("option", {
        name: "Nadia Ali — Engineering",
      }),
    );

    // Submit through the real dialog.
    await user.click(
      within(dialog).getByRole("button", {
        name: "Add member",
      }),
    );

    await waitFor(() => {
      expect(addRequests).toBe(1);
    });

    // Confirm correct API payload.
    expect(receivedEmployeeId).toBe(
      availableEmployee.id,
    );

    // Query invalidation must trigger a refetch.
    await waitFor(() => {
      expect(listRequests).toBeGreaterThanOrEqual(2);
    });

    // New employee appears in the actual table.
    expect(
      await screen.findByText("Nadia Ali"),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "2 employees assigned to this project",
      ),
    ).toBeInTheDocument();

    // Dialog closes after successful assignment.
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", {
          name: "Add team member",
        }),
      ).not.toBeInTheDocument();
    });
  });

  it("requires confirmation before removing a team member", async () => {
    const user = userEvent.setup();

    let members: ProjectTeamMember[] = [
      existingMember,
    ];

    let deleteRequests = 0;
    let removedEmployeeId: string | null = null;

    server.use(
      http.get(
        "*/api/projects/:projectId/assignments",
        () => {
          return HttpResponse.json(
            teamResponse(members),
          );
        },
      ),

      http.delete(
        "*/api/projects/:projectId/assignments/:employeeId",
        ({ params }) => {
          deleteRequests += 1;

          removedEmployeeId = String(
            params.employeeId,
          );

          members = members.filter(
            (member) =>
              member.employeeId !== removedEmployeeId,
          );

          return new HttpResponse(null, {
            status: 204,
          });
        },
      ),
    );

    renderTeam();

    expect(
      await screen.findByText("Aisha Khan"),
    ).toBeInTheDocument();

    const removeButton = () =>
      screen.getByRole("button", {
        name: "Remove Aisha Khan from project",
      });

    // First attempt: cancel.
    await user.click(removeButton());

    const confirmation =
      await screen.findByRole("alertdialog");

    expect(
      within(confirmation).getByText(
        /Remove Aisha Khan from this project's team/,
      ),
    ).toBeInTheDocument();

    expect(deleteRequests).toBe(0);

    await user.click(
      within(confirmation).getByRole("button", {
        name: "Cancel",
      }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("alertdialog"),
      ).not.toBeInTheDocument();
    });

    expect(deleteRequests).toBe(0);

    // Second attempt: confirm removal.
    await user.click(removeButton());

    const secondConfirmation =
      await screen.findByRole("alertdialog");

    await user.click(
      within(secondConfirmation).getByRole(
        "button",
        { name: "Remove member" },
      ),
    );

    await waitFor(() => {
      expect(deleteRequests).toBe(1);
    });

    expect(removedEmployeeId).toBe(
      existingMember.employeeId,
    );

    // Refreshed UI shows the empty team state.
    expect(
      await screen.findByText("No team members yet"),
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Aisha Khan"),
    ).not.toBeInTheDocument();
  });
});
