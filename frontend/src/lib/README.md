# Lib

## Overview
Shared frontend infrastructure and formatting helpers used across application features.

## Key Responsibilities
- Provide configured Axios clients for API and session requests.
- Hold the access token in memory, attach it to authenticated requests, and coordinate session refreshes.
- Convert API failures into user-friendly messages.
- Format dates and enum values consistently, and expose a shared class-name utility.

## Structure
- `api-client.ts` — Exports `apiClient`, `sessionClient`, token getters/setters, and `refreshAccessToken()`; uses `/api` as the base URL.
- `api-error.ts` — Exports `getApiErrorMessage()` for backend, connection, and unexpected errors.
- `utils.ts` — Re-exports the `cn` class-name helper.
- `formatters/date.ts` — Local/UTC date, date-only, and local date-time formatters.
- `formatters/text.ts` — `formatEnumLabel()` converts underscore-separated values into readable labels.

## How It Works
Feature API modules use `apiClient` for protected requests. The separate `sessionClient` is used for session operations; `refreshAccessToken()` shares one in-flight refresh request and updates the in-memory access token. Formatting helpers are imported wherever consistent display values are needed.
