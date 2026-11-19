import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { http, HttpResponse } from "msw";

import { AuthProvider } from "@/features/auth/auth-provider";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { LoginPage } from "@/pages/login-page";
import { getAccessToken, setAccessToken } from "@/lib/api-client";
import { server } from "@/test/mocks/server";

import type {
  AuthResponse,
  AuthUser,
  Permission,
} from "@/features/auth/auth.types";

const adminUser: AuthUser = {
  id: "test-admin",
  name: "Test Administrator",
  email: "admin@example.test",
  role: "admin",
};

const managerUser: AuthUser = {
  id: "test-manager",
  name: "Test Manager",
  email: "manager@example.test",
  role: "manager",
};

function authResponse(user: AuthUser, permissions: Permission[]): AuthResponse {
  return {
    accessToken: "test-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
    user,
    permissions,
  };
}

function EmployeesTestPage() {
  const { pathname, search } = useLocation();

  return <h1>Employees route: {pathname + search}</h1>;
}

function renderAuthRoutes(initialPath = "/login") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<h1>Test Dashboard</h1>} />

              <Route
                element={<ProtectedRoute requiredPermission="employees:read" />}
              >
                <Route path="/employees" element={<EmployeesTestPage />} />
              </Route>
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
      return HttpResponse.json(
        {
          error: {
            code: "INVALID_SESSION",
            message: "Session expired or invalid",
          },
        },
        { status: 401 },
      );
    }),
  );
});

afterEach(() => {
  setAccessToken(null);
});

describe("Authentication", () => {
  it("validates email and password before submitting", async () => {
    const user = userEvent.setup();

    renderAuthRoutes();

    await screen.findByRole("heading", {
      name: "Welcome back",
    });

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Enter a valid email address"),
    ).toBeInTheDocument();

    expect(screen.getByText("Password is required")).toBeInTheDocument();
  });

  it("displays the API error for invalid credentials", async () => {
    const user = userEvent.setup();

    server.use(
      http.post("*/api/auth/login", () => {
        return HttpResponse.json(
          {
            error: {
              code: "INVALID_CREDENTIALS",
              message: "Invalid email or password",
            },
          },
          { status: 401 },
        );
      }),
    );

    renderAuthRoutes();

    await screen.findByRole("heading", {
      name: "Welcome back",
    });

    await user.type(
      screen.getByRole("textbox", {
        name: "Email address",
      }),
      "admin@example.test",
    );

    await user.type(screen.getByLabelText("Password"), "IncorrectPassword123");

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password",
    );

    expect(getAccessToken()).toBeNull();
  });

  it("redirects an unauthenticated visitor and restores their destination after login", async () => {
    const user = userEvent.setup();

    server.use(
      http.post("*/api/auth/login", () => {
        return HttpResponse.json(
          authResponse(adminUser, [
            "dashboard:read",
            "employees:read",
            "employees:manage",
          ]),
        );
      }),
    );

    renderAuthRoutes("/employees?page=2");

    expect(
      await screen.findByRole("heading", {
        name: "Welcome back",
      }),
    ).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", {
        name: "Email address",
      }),
      "admin@example.test",
    );

    await user.type(screen.getByLabelText("Password"), "ValidPassword123");

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByRole("heading", {
        name: "Employees route: /employees?page=2",
      }),
    ).toBeInTheDocument();

    expect(getAccessToken()).toBe("test-access-token");
  });

  it("shows a forbidden page when the session lacks the required permission", async () => {
    server.use(
      http.post("*/api/auth/refresh", () => {
        return HttpResponse.json(authResponse(managerUser, ["dashboard:read"]));
      }),
    );

    renderAuthRoutes("/employees");

    expect(
      await screen.findByRole("heading", {
        name: "Access denied",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("403 — Forbidden")).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", {
        name: /Employees route/,
      }),
    ).not.toBeInTheDocument();
  });
});
