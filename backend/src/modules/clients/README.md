# Clients

## Overview

Backend data access and request validation for the client directory.

## Key Responsibilities

- List clients with search, status filtering, sorting, and pagination.
- Create, retrieve, update, and delete client records.
- Validate client names, contact details, and status values.

## Structure

| File | Purpose |
| --- | --- |
| `schemas.ts` | Zod schemas for client IDs, list queries, create, and update payloads. |
| `repository.ts` | Drizzle queries for listing and CRUD operations. |

## How It Works

`/api/clients` routes validate input before calling the repository. Search uses escaped case-insensitive patterns; list responses include pagination metadata. Database conflicts and references (such as projects using a client) are handled by the route layer.
