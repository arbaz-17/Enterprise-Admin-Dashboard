# Enterprise Administration Dashboard — Backend

## Overview

The **Express/TypeScript REST API** for the OptimusFox Enterprise Administration Dashboard. It provides authentication, role-based authorization, PostgreSQL-backed administration workflows, dashboard reporting, and read-only audit-log retrieval. This is the `backend/` workspace of a repository with a separate React frontend.

## Tech Stack

- **Node.js 22+, Express 5, TypeScript** — HTTP API and application runtime.
- **PostgreSQL + Drizzle ORM (`postgres` driver)** — persistent data and typed queries.
- **Zod** — environment, request-body, path-parameter, and query validation.
- **bcrypt, jose** — password verification and signed JWT access tokens.
- **HttpOnly cookies + database refresh sessions** — session refresh and logout.
- **Helmet, CORS, express-rate-limit, Pino** — HTTP security and request logging.

## Key Responsibilities

- Authenticate users and protect routes using `admin`, `manager`, and `viewer` permissions.
- Manage users, departments, employees, clients, projects, and project-team assignments.
- Validate input and enforce resource-specific business rules before database updates.
- Supply dashboard metrics, charts, operational insights, and recent project data.
- Retrieve recent audit records with admin-only access.

## Getting Started

```bash
npm install
```

Create `backend/.env`:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_ACCESS_SECRET=replace-with-a-long-random-secret-of-at-least-32-characters
FRONTEND_ORIGIN=http://localhost:5173
PORT=5000
NODE_ENV=development
```

Start both workspaces with `npm run dev`, or run only the backend with `npm run dev:backend`. The default API address is `http://localhost:5000`; `GET /api/health` returns a basic process health response.

## Available Commands

Run from `backend/` (or use `npm run <script> -w backend` at the repository root):

| Command | Purpose |
| --- | --- |
| `npm run dev` | Watch and run `src/server.ts` with `tsx`. |
| `npm run typecheck` | Check TypeScript without emitting output. |
| `npm run build` | Compile TypeScript to `dist/`. |
| `npm run start` | Start compiled `dist/server.js`. |


`package.json` defines the backend dependencies and commands; `tsconfig.json` configures strict TypeScript compilation to `dist/`.

## Project Structure

| Folder | Responsibility | Documentation |
| --- | --- | --- |
| `src/` | Application entry points and backend source navigation. | [Source](./src/README.md) |
| `src/config/` | Validated environment values and RBAC permissions. | [Config](./src/config/README.md) |
| `src/db/` | PostgreSQL connection, tables, relations, and constraints. | [Database](./src/db/README.md) |
| `src/lib/` | Shared logging, pagination, search, and DB-error helpers. | [Lib](./src/lib/README.md) |
| `src/middleware/` | Authentication, permissions, trusted-origin checks, and errors. | [Middleware](./src/middleware/README.md) |
| `src/modules/` | Domain repositories, business services, and validation schemas. | [Modules](./src/modules/README.md) |
| `src/routes/` | REST endpoints and HTTP response handling. | [Routes](./src/routes/README.md) |
| `src/types/` | Express request type augmentation. | [Types](./src/types/README.md) |

## API Overview

| Base path | Function |
| --- | --- |
| `/api/health` | Basic health response (no authentication). |
| `/api/auth` | Login, token refresh, logout, current user. |
| `/api/users` | List users and update roles/account status. |
| `/api/departments`, `/api/employees`, `/api/clients` | Administration and CRUD. |
| `/api/projects` | Projects and nested team assignments. |
| `/api/dashboard` | Separate dashboard-data endpoints. |
| `/api/audits` | Recent audit records (admin only). |

## Request Flow

`src/server.ts` listens locally using the Express app exported by `src/app.ts`. Requests pass through logging, security headers, CORS, rate limiting, and parsers before reaching a router. Protected endpoints check the bearer token, current active account, and required permission. Routers validate requests with Zod and call domain services/repositories; the global error handler formats unexpected errors.