
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
import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router";
import { http, HttpResponse } from "msw";

import { AuthProvider } from "@/features/auth/auth-provider";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { UsersPage } from "@/pages/users-page";
import { setAccessToken } from "@/lib/api-client";
import { server } from "@/test/mocks/server";

import type { AuthResponse } from "@/features/auth/auth.types";
import type {
  ManagedUser,
  UpdateUserInput,
} from "./users-api";

// -----------------------------------------
// Fixtures
// -----------------------------------------

const adminAccount: ManagedUser = {
  id: "admin-1",
  name: "Current Admin",
  email: "admin@example.test",
  role: "admin",
  isActive: true,
};

const managerAccount: ManagedUser = {
  id: "manager-1",
  name: "Maya Manager",
  email: "manager@example.test",
  role: "manager",
  isActive: true,
};

const adminSession: AuthResponse = {
  accessToken: "test-admin-token",
  tokenType: "Bearer",
  expiresIn: 900,
  user: {
    id: adminAccount.id,
    name: adminAccount.name,
    email: adminAccount.email,
    role: "admin",
  },
  permissions: [
    "dashboard:read",
    "users:read",
    "users:manage",
  ],
};

type PatchCall = {
  id: string;
  input: UpdateUserInput;
};

let accounts: ManagedUser[];
let patchCalls: PatchCall[];
let listRequests: number;

// -----------------------------------------
// Render real Users page
// -----------------------------------------

function renderUsers() {
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
      <MemoryRouter initialEntries={["/users"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={<h1>Login screen</h1>}
            />

            <Route
              element={
                <ProtectedRoute
                  requiredPermission="users:manage"
                />
              }
            >
              <Route
                path="/users"
                element={<UsersPage />}
              />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// -----------------------------------------
// Radix Select browser API support
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
// MSW handlers
// -----------------------------------------

beforeEach(() => {
  setAccessToken(null);

  accounts = [
    { ...adminAccount },
    { ...managerAccount },
  ];

  patchCalls = [];
  listRequests = 0;

  server.use(
    http.post("*/api/auth/refresh", () => {
      return HttpResponse.json(adminSession);
    }),

    http.get("*/api/users", () => {
      listRequests += 1;

      return HttpResponse.json({
        users: accounts,
        pagination: {
          page: 1,
          pageSize: 20,
          total: accounts.length,
          totalPages: 1,
        },
      });
    }),

    http.patch(
      "*/api/users/:id",
      async ({ request, params }) => {
        const id = String(params.id);
        const input =
          (await request.json()) as UpdateUserInput;

        patchCalls.push({ id, input });

        accounts = accounts.map((account) =>
          account.id === id
            ? { ...account, ...input }
            : account,
        );

        return HttpResponse.json({
          data: accounts.find(
            (account) => account.id === id,
          ),
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

describe("Users & Roles integration", () => {
  it("prevents an administrator from modifying their own account", async () => {
    renderUsers();

    await screen.findByText("Current Admin");

    const table = screen.getByRole("table", {
      name: "User accounts",
    });

    const ownRow = within(table).getByRole("row", {
      name: /Current Admin/,
    });

    expect(
      within(ownRow).getByText("(You)"),
    ).toBeInTheDocument();

    expect(
      within(ownRow).getByRole("combobox", {
        name: "Role for Current Admin",
      }),
    ).toBeDisabled();

    expect(
      within(ownRow).getByRole("button", {
        name: "Deactivate",
      }),
    ).toBeDisabled();

    expect(patchCalls).toHaveLength(0);
  });

  it("requires confirmation before changing another user's role", async () => {
    const user = userEvent.setup();

    renderUsers();

    await screen.findByText("Maya Manager");

    const getRoleSelect = () => {
      const row = screen.getByRole("row", {
        name: /Maya Manager/,
      });

      return within(row).getByRole("combobox", {
        name: "Role for Maya Manager",
      });
    };

    // Open role selector.
    await user.click(getRoleSelect());

    await user.click(
      await screen.findByRole("option", {
        name: "Viewer",
      }),
    );

    const confirmation = await screen.findByRole(
      "alertdialog",
      { name: "Change user role?" },
    );

    expect(
      within(confirmation).getByText(
        /Change Maya Manager's role from Manager to Viewer/,
      ),
    ).toBeInTheDocument();

    // No mutation before confirmation.
    expect(patchCalls).toHaveLength(0);

    // Cancel the change.
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

    expect(patchCalls).toHaveLength(0);

    // Open the selector again and confirm.
    await user.click(getRoleSelect());

    await user.click(
      await screen.findByRole("option", {
        name: "Viewer",
      }),
    );

    const newConfirmation = await screen.findByRole(
      "alertdialog",
      { name: "Change user role?" },
    );

    await user.click(
      within(newConfirmation).getByRole("button", {
        name: "Change role",
      }),
    );

    // Verify the real PATCH payload.
    await waitFor(() => {
      expect(patchCalls).toEqual([
        {
          id: managerAccount.id,
          input: { role: "viewer" },
        },
      ]);
    });

    // Verify React Query invalidated and refetched.
    await waitFor(() => {
      expect(listRequests).toBeGreaterThanOrEqual(2);
    });

    // Verify the updated role is displayed.
    await waitFor(() => {
      expect(getRoleSelect()).toHaveTextContent("Viewer");
    });
  });

  it("deactivates an account after confirmation and refreshes its status", async () => {
    const user = userEvent.setup();

    renderUsers();

    await screen.findByText("Maya Manager");

    const getManagerRow = () =>
      screen.getByRole("row", {
        name: /Maya Manager/,
      });

    await user.click(
      within(getManagerRow()).getByRole("button", {
        name: "Deactivate",
      }),
    );

    const confirmation = await screen.findByRole(
      "alertdialog",
      { name: "Deactivate account?" },
    );

    expect(
      within(confirmation).getByText(
        /Their active sessions will be invalidated/,
      ),
    ).toBeInTheDocument();

    expect(patchCalls).toHaveLength(0);

    await user.click(
      within(confirmation).getByRole("button", {
        name: "Deactivate account",
      }),
    );

    await waitFor(() => {
      expect(patchCalls).toEqual([
        {
          id: managerAccount.id,
          input: { isActive: false },
        },
      ]);
    });

    await waitFor(() => {
      expect(listRequests).toBeGreaterThanOrEqual(2);
    });

    await waitFor(() => {
      expect(
        within(getManagerRow()).getByText("Inactive"),
      ).toBeInTheDocument();

      expect(
        within(getManagerRow()).getByRole("button", {
          name: "Activate",
        }),
      ).toBeEnabled();
    });
  });
});
