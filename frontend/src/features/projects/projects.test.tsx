import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
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
import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router";
import { http, HttpResponse } from "msw";

import { AuthProvider } from "@/features/auth/auth-provider";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { ProjectsPage } from "@/pages/projects-page";
import { setAccessToken } from "@/lib/api-client";
import { server } from "@/test/mocks/server";

import type { AuthResponse } from "@/features/auth/auth.types";
import type {
  Project,
  ProjectListResponse,
  ProjectStatusInput,
} from "./projects.types";

const assignedProject: Project = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Portal Upgrade",
  description: "Customer portal modernization",
  clientId: "22222222-2222-4222-8222-222222222222",
  clientName: "Acme Technologies",
  managerEmployeeId: "33333333-3333-4333-8333-333333333333",
  managerName: "Test Manager",
  status: "active",
  priority: "high",
  progress: 35,
  startDate: "2026-01-01",
  dueDate: "2026-12-31",
  completedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  canEdit: true,
};

const unassignedProject: Project = {
  ...assignedProject,
  id: "44444444-4444-4444-8444-444444444444",
  name: "CRM Migration",
  description: "CRM platform migration",
  managerEmployeeId: null,
  managerName: null,
  progress: 20,
  canEdit: false,
};

const adminSession: AuthResponse = {
  accessToken: "admin-project-token",
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
    "projects:create",
    "projects:manage",
    "projects:delete",
  ],
};

const managerSession: AuthResponse = {
  ...adminSession,
  accessToken: "manager-project-token",
  user: {
    id: "manager-1",
    name: "Test Manager",
    email: "manager@example.test",
    role: "manager",
  },
  permissions: [
    "dashboard:read",
    "projects:read",
    "projects:manage",
  ],
};

function projectList(
  projects: Project[],
  page = 1,
  total = projects.length,
): ProjectListResponse {
  return {
    data: projects,
    pagination: {
      page,
      pageSize: 10,
      total,
      totalPages: Math.ceil(total / 10),
    },
  };
}

function renderProjects(initialPath = "/projects") {
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
      <MemoryRouter initialEntries={[initialPath]}>
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
                path="/projects"
                element={<ProjectsPage />}
              />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  setAccessToken(null);

  server.use(
    http.post("*/api/auth/refresh", () => {
      return HttpResponse.json(adminSession);
    }),

    http.get("*/api/projects", () => {
      return HttpResponse.json(
        projectList([
          assignedProject,
          unassignedProject,
        ]),
      );
    }),
  );
});

afterEach(() => {
  setAccessToken(null);
});

describe("Projects integration", () => {
  it("searches projects while preserving filters and resetting pagination", async () => {
    const user = userEvent.setup();

    const requests: Array<{
      page: string | null;
      q: string | null;
      status: string | null;
      priority: string | null;
    }> = [];

    server.use(
      http.get("*/api/projects", ({ request }) => {
        const params = new URL(request.url).searchParams;

        requests.push({
          page: params.get("page"),
          q: params.get("q"),
          status: params.get("status"),
          priority: params.get("priority"),
        });

        if (params.get("q") === "Portal") {
          return HttpResponse.json(
            projectList([assignedProject]),
          );
        }

        return HttpResponse.json(
          projectList(
            [assignedProject, unassignedProject],
            3,
            22,
          ),
        );
      }),
    );

    renderProjects(
      "/projects?page=3&status=active&priority=high",
    );

    expect(
      await screen.findByText("Portal Upgrade"),
    ).toBeInTheDocument();

    expect(
      requests.some(
        (request) =>
          request.page === "3" &&
          request.status === "active" &&
          request.priority === "high",
      ),
    ).toBe(true);

    const searchForm = screen.getByRole("search");

    await user.type(
      within(searchForm).getByRole("searchbox", {
        name: "Search projects",
      }),
      "Portal",
    );

    await user.click(
      within(searchForm).getByRole("button", {
        name: "Search",
      }),
    );

    expect(
      await screen.findByText("1 project found"),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        requests.some(
          (request) =>
            request.page === "1" &&
            request.q === "Portal" &&
            request.status === "active" &&
            request.priority === "high",
        ),
      ).toBe(true);
    });

    expect(
      screen.getByText("Portal Upgrade"),
    ).toBeInTheDocument();

    expect(
      screen.queryByText("CRM Migration"),
    ).not.toBeInTheDocument();
  });

  it("restricts manager editing to assigned projects", async () => {
    server.use(
      http.post("*/api/auth/refresh", () => {
        return HttpResponse.json(managerSession);
      }),
    );

    renderProjects();

    expect(
      await screen.findByText("Portal Upgrade"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("CRM Migration"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Manage assigned projects"),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Add project",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Edit Portal Upgrade",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Edit CRM Migration",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: /Delete Portal Upgrade|Delete CRM Migration/,
      }),
    ).not.toBeInTheDocument();
  });

  it("allows a manager to update assigned project progress and refreshes the table", async () => {
    const user = userEvent.setup();

    let projects: Project[] = [
      assignedProject,
      unassignedProject,
    ];

    let listRequests = 0;
    let patchRequests = 0;

    let receivedPayload: ProjectStatusInput | null = null;

    server.use(
      http.post("*/api/auth/refresh", () => {
        return HttpResponse.json(managerSession);
      }),

      http.get("*/api/projects", () => {
        listRequests += 1;

        return HttpResponse.json(
          projectList(projects),
        );
      }),

      http.patch(
        "*/api/projects/:id",
        async ({ request, params }) => {
          patchRequests += 1;

          const payload =
            (await request.json()) as ProjectStatusInput;

          receivedPayload = payload;

          projects = projects.map((project) =>
            project.id === params.id
              ? {
                  ...project,
                  ...payload,
                  updatedAt: "2026-02-01T00:00:00.000Z",
                }
              : project,
          );

          const updated = projects.find(
            (project) => project.id === params.id,
          );

          return HttpResponse.json({
            data: updated,
          });
        },
      ),
    );

    renderProjects();

    expect(
      await screen.findByText("Portal Upgrade"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Edit Portal Upgrade",
      }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Update project progress",
    });

    expect(
      within(dialog).getByText(
        /Other project settings are managed by Admins/,
      ),
    ).toBeInTheDocument();

    const progressInput =
      within(dialog).getByRole("spinbutton", {
        name: "Progress (%)",
      });

    await user.clear(progressInput);
    await user.type(progressInput, "65");

    await user.click(
      within(dialog).getByRole("button", {
        name: "Save progress",
      }),
    );

    await waitFor(() => {
      expect(patchRequests).toBe(1);
    });

    expect(receivedPayload).toEqual({
      status: "active",
      progress: 65,
    });

    await waitFor(() => {
      expect(listRequests).toBeGreaterThanOrEqual(2);
    });

    const table = await screen.findByRole("table", {
      name: "Projects",
    });

    expect(
      await within(table).findByText("65%"),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", {
          name: "Update project progress",
        }),
      ).not.toBeInTheDocument();
    });
  });
});
