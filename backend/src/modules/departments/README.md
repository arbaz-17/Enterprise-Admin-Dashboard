# Departments

## Overview

Validation and PostgreSQL operations for managing departments.

## Key Responsibilities

- List departments with search, sorting, and pagination.
- Create, retrieve, update, and delete departments.
- Enforce valid names/descriptions and surface duplicate or in-use records.

## Structure

| File | Purpose |
| --- | --- |
| `schemas.ts` | Validates IDs, list queries, and create/update payloads with Zod. |
| `repository.ts` | Implements department list/detail/CRUD database queries. |

## How It Works

Routes validate requests before calling repository functions. The database has a case-insensitive unique department-name index; deletion is restricted when employees still reference a department. The schema also supports an optional head-employee reference, though these module endpoints do not provide head assignment management.
