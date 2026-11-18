# Enterprise Administration Dashboard

**Frontend Engineering Internship - Month 4 Project**

[**Live Demo**](https://enterprise-admin-dashboard-lake.vercel.app/)

---

## Overview

The **Enterprise Administration Dashboard** is the monthly capstone for **Month 4 of a Frontend Engineering Internship**. It models an OptimusFox-inspired organization where administrators and managers need a central place to monitor operations, manage people and projects, and control access to sensitive actions.

The **frontend is the principal focus**: API architecture, secure session handling, RBAC-aware UX, reusable tables, complex forms, responsive and accessible states, performance optimization, and automated testing. The backend exists to support realistic data and **enforce authorization independently** of what the UI allows a user to see.

### At a glance

| | |
| --- | --- |
| **Project type** | Full-stack enterprise dashboard with a frontend-engineering emphasis |
| **Access roles** | Administrator, Manager, Viewer |
| **Business modules** | Dashboard, Departments, Employees, Clients, Projects, Teams, Users & Roles, Audit Logs |
| **Architecture** | React SPA → Express REST API → PostgreSQL |
| **Lighthouse performance** | **76 → 95** (+19 points across the supplied snapshots) |
| **Accessibility / Best Practices** | **100 / 100** in both Lighthouse captures |
| **Frontend automated tests** | **58 passed** — 47 Vitest + 11 Playwright, in the supplied test reports |

## Key Features

| Area | What it provides |
| --- | --- |
| **Operations dashboard** | KPIs, project trends and status, workforce distribution, priority breakdowns, recent projects, and independently refreshed dashboard widgets. |
| **Employees & departments** | Searchable/filterable directories, validated create/edit workflows, statuses, and relationship-aware operations. |
| **Client management** | Client records, contact details, status management, and CRUD workflows. |
| **Project management** | Projects with client/manager relationships, priority, status, dates, progress, and manager-scoped updates. |
| **Project team assignments** | View and manage employees assigned to projects without altering employee records. |
| **Users & roles** | Administrator-only role and account-status management, including confirmation for sensitive changes. |
| **Audit logs** | Administrator-only, searchable/filterable view of existing audit records. |
| **Authentication & access control** | Login, session restoration, logout, access-token refresh, protected routes, permission-aware navigation, and backend-enforced RBAC. |
| **Data-heavy workflows** | Reusable tables, server-side pagination and sorting, advanced filtering, URL-synchronized state, column controls, and conditional row virtualization. |
| **Polished application UX** | Responsive layout, light/dark mode, loading skeletons, empty/error states, retries, dialogs, and notifications. |

### Permission-aware experience

| Role | Typical access |
| --- | --- |
| **Administrator** | Organizational CRUD, user/role administration, projects, assignments, and audit-log viewing. |
| **Manager** | Allowed organization views and updates to projects/assignments within backend-enforced ownership and permission constraints. |
| **Viewer** | Dashboard-only read access; protected organization management routes are restricted. |

## Technology Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, TypeScript, Vite 8, React Router 7 |
| **UI & design** | Tailwind CSS 4, shadcn/ui, Radix UI, Lucide, Sonner, Poppins |
| **API & server state** | Axios, TanStack Query |
| **Tables & virtualization** | TanStack Table, TanStack Virtual |
| **Forms & validation** | React Hook Form, Zod |
| **Charts** | Recharts |
| **Backend** | Node.js, Express 5, TypeScript |
| **Database** | PostgreSQL (Supabase-hosted in development), Drizzle ORM |
| **Security & observability** | JWT (`jose`), bcrypt, HttpOnly refresh cookies, Helmet, CORS, rate limiting, Pino |
| **Frontend testing** | Vitest, React Testing Library, MSW, Playwright (Microsoft Edge) |

## Architecture & Engineering Decisions

The frontend is organized by **business feature**, while shared components and infrastructure provide consistent application behavior. The backend separates **routes, middleware, services, and repositories** so permission checks and business constraints do not depend on UI behavior.

Notable technical choices:

1. **Secure session flow:** Short-lived access tokens are held in memory, with rotating, database-backed refresh sessions through HttpOnly cookies. Axios interceptors coordinate refresh and retry eligible unauthorized requests.
2. **Defense in depth:** Protected routes and permission-aware controls improve UX; server-side middleware and project ownership checks make the authorization decisions.
3. **Reusable enterprise tables:** Shared table components support server-driven pagination/sorting, advanced filters, URL state, column visibility, and virtualization when appropriate.
4. **Measured performance work:** Lazy page/chart loading, `IntersectionObserver`-driven chart deferral, independent dashboard queries, caching, and virtualization limit unnecessary initial work.
5. **Reliable asynchronous UX:** Explicit loading, empty, error, retry, confirmation, and mutation states make API-backed interfaces resilient to delays and failures.

## Month 4 — Concepts Demonstrated

The internship's **Month 4 — Production Frontend Engineering** guide centers on API/security, testing, performance, and production integration. This table connects those topics to **features demonstrably present in the project**, rather than treating every training topic as an implemented requirement.

| Week | Focus | What this project demonstrates |
| --- | --- | --- |
| **13** | **API Architecture & Frontend Security** | Centralized Axios client and interceptors, error normalization, cancellation via query signals, JWT authentication/refresh, HttpOnly cookies, protected routes, RBAC, and backend validation/security middleware. |
| **14** | **Frontend Testing** | User-focused Vitest/React Testing Library tests, MSW API mocks, async behavior tests, and Playwright browser journeys with controlled network responses. |
| **15** | **Advanced Performance** | Lighthouse measurement, route/chart code splitting, lazy chart rendering with `IntersectionObserver`, query caching, pagination, and conditional virtualized table rendering. |
| **16** | **Production Dashboard Integration** | A cohesive authenticated app combining role-aware routing, advanced tables, URL state, forms, charts, loading/error/retry UX, responsive design, and automated frontend coverage. |


## Performance Optimization & Lighthouse Evidence

Performance work followed a **baseline → optimize → compare** workflow. The screenshots below are from the dashboard's Lighthouse reports; the original image filenames are preserved exactly in [`snapshots/`](snapshots/).

### Lighthouse score comparison

| Category | Before | After | Result |
| --- | ---: | ---: | --- |
| **Performance** | **76** | **95** | **+19 points** |
| Accessibility | 100 | 100 | Maintained |
| Best Practices | 100 | 100 | Maintained |
| SEO | 82 | 82 | Unchanged |

### Detailed performance metrics

| Metric | Before | After | Observed difference |
| --- | ---: | ---: | --- |
| First Contentful Paint (FCP) | 2.5 s | 2.0 s | **0.5 s faster** |
| Largest Contentful Paint (LCP) | 3.9 s | 2.2 s | **1.7 s faster** |
| Total Blocking Time (TBT) | 210 ms | 110 ms | **100 ms lower** |
| Cumulative Layout Shift (CLS) | 0.01 | 0 | **Reduced to 0** |
| Speed Index | 3.2 s | 3.8 s | **0.6 s slower** |

**Before and after — Lighthouse reports**:

| Baseline — Performance 76 | Optimized snapshot — Performance 95 |
| :---: | :---: |
| [![Lighthouse baseline performance screenshot](snapshots/before-optimzations.png)](snapshots/before-optimzations.png) | [![Lighthouse after optimization screenshot](snapshots/after-optimizations.png)](snapshots/after-optimizations.png) |

**What was optimized:** Lazy-loaded pages and chart modules, below-the-fold chart deferral, cached independently queried dashboard widgets, and conditional table virtualization, among other frontend performance-oriented implementation choices.

**SEO note:** SEO was **not an optimization priority for Month 4**, whose focus was frontend engineering, security, testing, performance, and integration. The SEO score remained **82** in both captures.

## Testing Strategy & Verified Results

The testing effort intentionally emphasizes **frontend behavior**, in line with the internship's objectives:

- **Vitest + React Testing Library:** Component and feature behavior, user interactions, validation, authentication state, permissions, and asynchronous UI.
- **MSW:** Predictable API scenarios for tests involving server data, mutations, and error handling.
- **Playwright:** Browser-level login/session, role restrictions, CRUD and navigation journeys, dashboard refresh behavior, and project-team workflows.

### Passing test results

| Test suite | Files | Passed | Failed | Evidence |
| --- | ---: | ---: | ---: | --- |
| **Vitest + RTL / MSW** | 12 | **47** | **0** | Captured CLI run; 13.86 s total |
| **Playwright (Edge)** | 6 | **11** | **0** | HTML report dated **18 Nov 2026**; 0 flaky, 0 skipped |
| **Total** | **18** | **58** | **0** | Two separate passing test runs |


**Vitest — 12 files, 47 tests passed**

![Vitest terminal screenshot showing 47 passing tests in 12 files](snapshots/vitest-results.png)

**Playwright — 11 browser tests passed in Microsoft Edge**

![Playwright HTML report showing 11 passing tests and zero failures](snapshots/playwright-tests.png)

### Run the tests locally

From the repository root:

```bash
npm run test -w frontend
```

For the browser suite, from `frontend/`:

```bash
cd frontend
npx playwright test
npx playwright show-report
```

## Getting Started

1. Install the workspaces from the project root:

   ```bash
   npm install
   ```

2. Create `backend/.env` with your own local values:

   ```dotenv
   NODE_ENV=development
   PORT=5000
   FRONTEND_ORIGIN=http://localhost:5173
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
   JWT_ACCESS_SECRET=replace-with-a-random-secret-of-at-least-32-characters
   ```

3. Start both workspaces:

   ```bash
   npm run dev
   ```

4. Open **http://localhost:5173**. The frontend proxies `/api` requests to the Express API at **http://localhost:5000**.


### Development commands

| Command (from project root unless noted) | Purpose |
| --- | --- |
| `npm run dev` | Start frontend and backend together |
| `npm run dev:frontend` / `npm run dev:backend` | Start one workspace |
| `npm run build` | Build both workspaces |
| `npm run lint` | Lint frontend code |
| `npm run check` | Lint and build |
| `npm run test -w frontend` | Run Vitest once |
| `npm run typecheck -w backend` | Type-check backend |
| `cd frontend && npx playwright test` | Run mocked browser tests in Edge |

## Repository Structure & Documentation

```text
enterprise-admin-dashboard/
├── frontend/                       # React SPA, domain features, components and tests
│   ├── e2e/                        # Playwright suites and API mocks
│   └── src/
│       ├── components/             # Dashboard tables/charts, layout, shared UI, theme
│       ├── features/               # Nine feature modules
│       ├── pages/                  # Route-level pages
│       ├── config/                 # Navigation definitions
│       ├── hooks/                  # Shared React hooks
│       ├── lib/                    # API client and utilities
│       └── test/                   # Vitest/MSW setup
├── backend/                        # Express + PostgreSQL API
│   └── src/
│       ├── routes/                 # API endpoints
│       ├── modules/                # Domain logic and repositories
│       ├── middleware/             # Auth, permission and error handling
│       ├── db/                     # Drizzle schema/connection
│       ├── config/                 # Environment and permissions
│       ├── lib/                    # Backend utilities
│       └── types/                  # Express TypeScript declarations
├── snapshots/                      # Actual Lighthouse and test-result proof
│   ├── before-optimzations.png     # Original filename preserved
│   ├── after-optimizations.png
│   ├── vitest-results.png
│   └── playwright-tests.png
├── package.json                    # npm workspaces/scripts
└── README.md                       # Project-level guide (this file)
```

| Documentation | Purpose |
| --- | --- |
| [Frontend README](frontend/README.md) | Frontend architecture, setup and navigation |
| [Frontend features](frontend/src/features/README.md) | Index of the nine business features |
| [Frontend components](frontend/src/components/README.md) | Reusable dashboards, layout, shared UI and theme |
| [Frontend pages](frontend/src/pages/README.md) | Pages, routes and access requirements |
| [Frontend tests](frontend/e2e/README.md) | Playwright tests, mocked APIs and workflows |
| [Backend README](backend/README.md) | API architecture, database, security and setup |
| [Backend modules](backend/src/modules/README.md) | Index of backend business modules |
| [Backend routes](backend/src/routes/README.md) | REST API organization |

---

