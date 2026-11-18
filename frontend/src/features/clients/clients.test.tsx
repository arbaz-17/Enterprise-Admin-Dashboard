
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
import { ClientsPage } from "@/pages/clients-page";
import { setAccessToken } from "@/lib/api-client";
import { server } from "@/test/mocks/server";

import type { AuthResponse } from "@/features/auth/auth.types";
import type {
  Client,
  ClientInput,
} from "./clients.types";

// -----------------------------------------
// Fixtures
// -----------------------------------------

const acme: Client = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Acme Technologies",
  contactName: "John Smith",
  contactEmail: "john@acme.test",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const northstar: Client = {
  ...acme,
  id: "22222222-2222-4222-8222-222222222222",
  name: "Northstar Solutions",
  contactName: "Sarah Wilson",
  contactEmail: "sarah@northstar.test",
  status: "inactive",
};

const adminSession: AuthResponse = {
  accessToken: "test-client-token",
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
    "clients:read",
    "clients:manage",
  ],
};

function clientList(records: Client[]) {
  return {
    data: records,
    pagination: {
      page: 1,
      pageSize: 10,
      total: records.length,
      totalPages: 1,
    },
  };
}

// -----------------------------------------
// Render real Clients page
// -----------------------------------------

function renderClients() {
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
      <MemoryRouter initialEntries={["/clients"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={<h1>Login screen</h1>}
            />

            <Route
              element={
                <ProtectedRoute
                  requiredPermission="clients:read"
                />
              }
            >
              <Route
                path="/clients"
                element={<ClientsPage />}
              />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// -----------------------------------------
// Radix Select support for jsdom
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
// Default MSW handlers
// -----------------------------------------

beforeEach(() => {
  setAccessToken(null);

  server.use(
    http.post("*/api/auth/refresh", () => {
      return HttpResponse.json(adminSession);
    }),

    http.get("*/api/clients", () => {
      return HttpResponse.json(
        clientList([acme, northstar]),
      );
    }),
  );
});

afterEach(() => {
  setAccessToken(null);
});

// -----------------------------------------
// Integration tests
// -----------------------------------------

describe("Clients integration", () => {
  it("filters clients by status through the API", async () => {
    const user = userEvent.setup();
    const requestedStatuses: Array<string | null> = [];

    server.use(
      http.get("*/api/clients", ({ request }) => {
        const status = new URL(
          request.url,
        ).searchParams.get("status");

        requestedStatuses.push(status);

        const records =
          status === "inactive"
            ? [northstar]
            : [acme, northstar];

        return HttpResponse.json(
          clientList(records),
        );
      }),
    );

    renderClients();

    expect(
      await screen.findByText("Acme Technologies"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Northstar Solutions"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("combobox", {
        name: "Filter clients by status",
      }),
    );

    await user.click(
      await screen.findByRole("option", {
        name: "Inactive",
      }),
    );

    await waitFor(() => {
      expect(requestedStatuses).toContain("inactive");
    });

    expect(
      await screen.findByText("1 client found"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Northstar Solutions"),
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Acme Technologies"),
    ).not.toBeInTheDocument();
  });

  it("prevents submission when the client form is invalid", async () => {
    const user = userEvent.setup();
    let createRequests = 0;

    server.use(
      http.post("*/api/clients", () => {
        createRequests += 1;
        return HttpResponse.json(
          { data: acme },
          { status: 201 },
        );
      }),
    );

    renderClients();

    await screen.findByText("Acme Technologies");

    await user.click(
      screen.getByRole("button", {
        name: "Add client",
      }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Add client",
    });

    await user.type(
      within(dialog).getByRole("textbox", {
        name: "Contact email",
      }),
      "invalid-email",
    );

    await user.click(
      within(dialog).getByRole("button", {
        name: "Create client",
      }),
    );

    expect(
      await within(dialog).findByText(
        "Client name is required",
      ),
    ).toBeInTheDocument();

    expect(
      within(dialog).getByText(
        "Enter a valid contact email address",
      ),
    ).toBeInTheDocument();

    expect(createRequests).toBe(0);
  });

  it("creates a client and refreshes the directory", async () => {
    const user = userEvent.setup();

    let clients: Client[] = [acme];
    let listRequests = 0;
    let createRequests = 0;
    let receivedPayload: ClientInput | null = null;

    server.use(
      http.get("*/api/clients", () => {
        listRequests += 1;

        return HttpResponse.json(
          clientList(clients),
        );
      }),

      http.post("*/api/clients", async ({ request }) => {
        createRequests += 1;

        const payload =
          (await request.json()) as ClientInput;

        receivedPayload = payload;

        const created: Client = {
          id: "33333333-3333-4333-8333-333333333333",
          ...payload,
          createdAt: "2026-02-01T00:00:00.000Z",
          updatedAt: "2026-02-01T00:00:00.000Z",
        };

        clients = [...clients, created];

        return HttpResponse.json(
          { data: created },
          { status: 201 },
        );
      }),
    );

    renderClients();

    expect(
      await screen.findByText("Acme Technologies"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Add client",
      }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Add client",
    });

    await user.type(
      within(dialog).getByRole("textbox", {
        name: /Client name/,
      }),
      "Delta Systems",
    );

    await user.type(
      within(dialog).getByRole("textbox", {
        name: "Contact email",
      }),
      "CONTACT@DELTA.COM",
    );

    await user.click(
      within(dialog).getByRole("button", {
        name: "Create client",
      }),
    );

    await waitFor(() => {
      expect(createRequests).toBe(1);
    });

    // Optional fields are normalized by the real form helper.
    expect(receivedPayload).toEqual({
      name: "Delta Systems",
      contactName: null,
      contactEmail: "contact@delta.com",
      status: "active",
    });

    // Mutation must trigger a list refetch.
    await waitFor(() => {
      expect(listRequests).toBeGreaterThanOrEqual(2);
    });

    expect(
      await screen.findByText("Delta Systems"),
    ).toBeInTheDocument();

    const table = screen.getByRole("table", {
      name: "Clients",
    });

    expect(
      within(table).getByText("contact@delta.com"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("2 clients found"),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", {
          name: "Add client",
        }),
      ).not.toBeInTheDocument();
    });
  });
});
