# End-to-End Tests

## Overview

Playwright browser tests for critical user journeys in the Enterprise Administration Dashboard. Tests interact with the real React UI while intercepting API requests with local, predictable mock responses; they do **not** require a running backend or database.

## Key Responsibilities

- Verify authentication, session restoration, logout, and protected routes.
- Check role-based navigation and access restrictions for admins, managers, and viewers.
- Exercise employee management, project updates, team assignments, and dashboard navigation through browser interactions.
- Assert API requests and UI updates, including behavior after page reloads.

## Structure

| File | Coverage |
| --- | --- |
| `auth.spec.ts` | Login, protected routes, session cookie, reload, logout |
| `authorization.spec.ts` | Admin, manager, and viewer permissions |
| `employees.spec.ts` | Employee create, edit, and delete workflow |
| `navigation.spec.ts` | Module navigation and dashboard widget refresh |
| `projects.spec.ts` | Manager project access and progress/status updates |
| `team-assignments.spec.ts` | Add/remove team members and access restrictions |
| `mocks/` | Playwright API interceptors and test data (see below) |

The `mocks/` directory contains `auth.ts`, `roles.ts`, `employees.ts`, `navigation.ts`, `projects.ts`, and `team-assignments.ts`, each supporting its corresponding browser scenarios.

## Running Tests

From the `frontend/` directory:

```bash
npx playwright test                       # All E2E suites
npx playwright test e2e/auth.spec.ts      # One suite
npx playwright show-report                # View HTML report
```
