# Database

## Overview

PostgreSQL persistence through Drizzle ORM. All declared tables belong to the `app_private` PostgreSQL schema.

## Key Responsibilities

- Establish the database connection and typed Drizzle client.
- Declare tables, relationships, unique indexes, checks, and shared row types.
- Supply database objects to domain repositories and auth middleware.

## Structure

| File | Purpose |
| --- | --- |
| `index.ts` | Creates the `postgres` client and exports `db` / `dbClient`. |
| `schema.ts` | Defines eight tables plus constraints, indexes, and inferred row types. |

## Tables

| Table | Purpose |
| --- | --- |
| `users` | Accounts, roles, active status, password hashes. |
| `refresh_sessions` | Hashed refresh-token sessions and token families. |
| `departments` | Departments and optional head-employee reference. |
| `employees` | Staff records, departments, and optional linked users. |
| `clients` | Client contacts and status. |
| `projects` | Client projects, managers, statuses, priorities, dates, and progress. |
| `project_assignments` | Project-to-employee memberships. |
| `audit_logs` | Recorded administrative/security activity. |
