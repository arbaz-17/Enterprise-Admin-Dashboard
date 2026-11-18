# Enterprise Administration Dashboard — Frontend

## Overview

The React frontend for the **OptimusFox Enterprise Administration Dashboard**. It provides a permission-aware interface for managing employees, departments, clients, projects, project teams, user accounts, and audit logs, alongside an operational dashboard.

This directory is the `frontend` workspace in a repository that also contains an Express/PostgreSQL backend.

## Tech Stack

- **React 19, TypeScript, Vite 8** — application and build tooling
- **React Router 7** — routing and lazy-loaded pages
- **TanStack Query, Table & Virtual** — server-state management, tables, and virtualization
- **Tailwind CSS 4, shadcn/ui, Radix UI** — styling and UI components
- **React Hook Form + Zod** — forms and validation
- **Axios** — API requests and session handling
- **Recharts** — dashboard visualizations
- **Vitest, React Testing Library, MSW, Playwright** — automated testing

## Key Responsibilities

- Provide responsive, accessible application screens and shared layouts.
- Manage login, session restoration, permission-based navigation, and protected routes.
- Integrate with the backend for dashboard data and administration workflows.
- Support searching, filtering, sorting, pagination, and virtualization where needed.
- Handle loading, errors, empty states, mutation feedback, and theme switching.

## Getting Started

Requires **Node.js 22.12+** and npm. From the **repository root**:

```bash
npm install
npm run dev
```

This starts both workspaces. The frontend runs at **http://localhost:5173**, and Vite proxies `/api` requests to the backend at **http://localhost:5000**. The backend requires its own configuration, including `DATABASE_URL` and `JWT_ACCESS_SECRET`.

To run only the frontend, use `npm run dev:frontend` from the repository root, or `npm run dev` inside `frontend/` (API calls still need a working backend).

## Available Commands

Run these from `frontend/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Type-check and build for production. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint. |
| `npm run test` | Run Vitest tests once. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npx playwright test` | Run Playwright browser tests (Microsoft Edge required). |

## Project Structure

| Path | Purpose | Documentation |
| --- | --- | --- |
| `src/components/` | Reusable UI, layouts, tables, charts, and themes. | [Components](./src/components/README.md) |
| `src/config/` | Permission-aware navigation and breadcrumbs. | [Config](./src/config/README.md) |
| `src/features/` | Domain modules, APIs, queries, forms, and feature tests. | [Features](./src/features/README.md) |
| `src/hooks/` | Shared React hooks. | [Hooks](./src/hooks/README.md) |
| `src/lib/` | API client, error handling, formatters, and utilities. | [Lib](./src/lib/README.md) |
| `src/pages/` | Route-level screens and page composition. | [Pages](./src/pages/README.md) |
| `src/test/` | Shared Vitest/RTL/MSW test setup. | [Test Setup](./src/test/README.md) |
| `e2e/` | Playwright browser tests and API mocks. | [E2E Tests](./e2e/README.md) |

### Important Entry Points

- `src/main.tsx` — mounts the app and registers router, theme, query, and authentication providers.
- `src/App.tsx` — defines routes, page-level code splitting, shared layout, and permission guards.
- `src/index.css` — global styles and design tokens.
- `vite.config.ts` — Vite plugins, `@/` alias, local server, and `/api` proxy.
- `vitest.config.ts` / `playwright.config.ts` — unit/integration and browser test configuration.
- `vercel.json` — production rewrites for frontend routes and `/api` requests; review the API destination before deploying to a different backend.

## How It Works

`src/App.tsx` loads pages on demand. Pages compose feature modules from `src/features/`, which use the shared Axios client in `src/lib/` and TanStack Query for fetching, caching, and mutations. The auth provider holds the access token in memory and restores sessions through the backend's refresh flow; protected routes and UI controls check the returned permissions. **The backend remains responsible for enforcing authorization.**
