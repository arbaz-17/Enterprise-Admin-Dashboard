import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  Link,
  MemoryRouter,
  Route,
  Routes,
} from "react-router";
import { http, HttpResponse } from "msw";

import { AuthProvider } from "@/features/auth/auth-provider";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { AppLayout } from "@/components/layout/app-layout";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { getAccessToken, setAccessToken } from "@/lib/api-client";
import { server } from "@/test/mocks/server";

import type { AuthResponse } from "@/features/auth/auth.types";

const adminSession: AuthResponse = {
  accessToken: "restored-admin-token",
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
    "employees:read",
    "employees:manage",
    "users:manage",
    "audits:read",
  ],
};

const managerSession: AuthResponse = {
  ...adminSession,
  accessToken: "restored-manager-token",
  user: {
    id: "manager-1",
    name: "Test Manager",
    email: "manager@example.test",
    role: "manager",
  },
  permissions: [
    "dashboard:read",
    "employees:read",
  ],
};

function renderTestApp() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/"]}>
          <AuthProvider>
            <Routes>
              <Route
                path="/login"
                element={
                  <main>
                    <h1>Login screen</h1>
                    <Link to="/">Open dashboard</Link>
                  </main>
                }
              />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route
                    index
                    element={<h1>Overview dashboard</h1>}
                  />

                  <Route
                    path="employees"
                    element={<h1>Employees test page</h1>}
                  />
                </Route>
              </Route>
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  );

  return queryClient;
}

beforeEach(() => {
  setAccessToken(null);

  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );

  server.use(
    http.post("*/api/auth/refresh", () => {
      return HttpResponse.json(adminSession);
    }),
  );
});

afterEach(() => {
  setAccessToken(null);
  vi.unstubAllGlobals();
});

describe("Session and sidebar authorization", () => {
  it("restores an existing session on application load", async () => {
    renderTestApp();

    expect(
      await screen.findByRole("heading", {
        name: "Overview dashboard",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Test Administrator"),
    ).toBeInTheDocument();

    expect(getAccessToken()).toBe(
      "restored-admin-token",
    );

    expect(
      screen.getByRole("link", {
        name: "Users & Roles",
      }),
    ).toBeInTheDocument();
  });

  it("logs out, clears session data and returns to login", async () => {
    const user = userEvent.setup();
    let logoutRequests = 0;

    server.use(
      http.post("*/api/auth/logout", () => {
        logoutRequests += 1;

        return new HttpResponse(null, {
          status: 204,
        });
      }),
    );

    const queryClient = renderTestApp();

    await screen.findByRole("heading", {
      name: "Overview dashboard",
    });

    queryClient.setQueryData(
      ["private-dashboard-data"],
      { confidential: true },
    );

    expect(
      queryClient.getQueryData(["private-dashboard-data"]),
    ).toBeDefined();

    await user.click(
      screen.getByRole("button", {
        name: "Sign out",
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Login screen",
      }),
    ).toBeInTheDocument();

    expect(logoutRequests).toBe(1);
    expect(getAccessToken()).toBeNull();

    expect(
      queryClient.getQueryData(["private-dashboard-data"]),
    ).toBeUndefined();

    expect(
      screen.queryByRole("heading", {
        name: "Overview dashboard",
      }),
    ).not.toBeInTheDocument();
  });

  it("hides restricted navigation links from a manager", async () => {
    server.use(
      http.post("*/api/auth/refresh", () => {
        return HttpResponse.json(managerSession);
      }),
    );

    renderTestApp();

    await screen.findByRole("heading", {
      name: "Overview dashboard",
    });

    expect(
      screen.getByRole("link", {
        name: "Employees",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("link", {
        name: "Users & Roles",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("link", {
        name: "Audit Logs",
      }),
    ).not.toBeInTheDocument();
  });
});
