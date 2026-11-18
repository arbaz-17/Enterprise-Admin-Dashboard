# Lib

## Overview

Small, reusable backend helpers that are not owned by a particular business module.

## Key Responsibilities

- Emit structured logs while redacting sensitive headers.
- Build consistent paginated response metadata.
- Safely handle text searches and identify PostgreSQL error codes.

## Structure

| File | Purpose |
| --- | --- |
| `logger.ts` | Configures Pino logging and redacts authorization/cookie headers. |
| `pagination.ts` | Calculates `page`, `pageSize`, `total`, and `totalPages`. |
| `postgres-error.ts` | Extracts PostgreSQL error codes, including nested causes. |
| `search.ts` | Escapes wildcard characters for SQL `LIKE` / `ILIKE` patterns. |

## How It Works

Routes use `createPagination()` for list responses and `getPostgresErrorCode()` to translate database conflicts. Repositories use `escapeLike()` for literal user searches; `app.ts` uses the shared Pino logger.
