# API Routes

## Overview

Express routers that expose backend features under `/api`. These files validate requests, apply middleware, call domain repositories/services, and format HTTP responses.

## Key Responsibilities

- Declare HTTP methods, paths, and endpoint permissions.
- Parse and validate parameters, queries, and request bodies.
- Translate business outcomes and database constraints into API responses.

## Structure & Endpoints

| File | Base path | Supported endpoints |
| --- | --- | --- |
| `health.ts` | `/api/health` | `GET /` |
| `auth.ts` | `/api/auth` | `POST /login`, `/refresh`, `/logout`; `GET /me` |
| `users.ts` | `/api/users` | `GET /`; `PATCH /:id` |
| `departments.ts` | `/api/departments` | `GET /`, `/:id`; `POST /`; `PATCH /:id`; `DELETE /:id` |
| `employees.ts` | `/api/employees` | `GET /`, `/account-options`, `/:id`; `POST /`; `PATCH /:id`; `DELETE /:id` |
| `clients.ts` | `/api/clients` | `GET /`, `/:id`; `POST /`; `PATCH /:id`; `DELETE /:id` |
| `projects.ts` | `/api/projects` | `GET /`, `/form-options`, `/:id`; `POST /`; `PATCH /:id`; `DELETE /:id` |
| `project-assignments.ts` | `/api/projects/:projectId/assignments` | `GET /`, `/options`; `POST /`; `DELETE /:employeeId` |
| `dashboard.ts` | `/api/dashboard` | `GET /metrics`, `/monthly-activity`, `/project-status`, `/departments`, `/recent-projects`, `/operations` |
| `audits.ts` | `/api/audits` | `GET /` |

## How It Works

`../app.ts` mounts all routers. Most routers call `requireAuth`, then `requirePermission()` for the action; write endpoints also use `requireTrustedOrigin`. `health.ts` is public. Routes call `../modules/` for data access and business checks and use shared `../lib/` helpers where needed.

