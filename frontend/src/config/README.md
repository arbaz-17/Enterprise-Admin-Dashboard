# Config

## Overview
Centralizes configuration for the frontend's application navigation.

## Key Responsibilities
- Define sidebar navigation groups, labels, routes, Lucide icons, and required permissions.
- Identify the active navigation item from the current URL.
- Build breadcrumbs, including the nested project team route.

## Files
- `navigation.ts` — Exports `navigationGroups`, `isNavigationActive`, `findNavigationItem`, and `getNavigationBreadcrumbs`.

## Notes
Navigation items declare permissions from `features/auth/auth.types`. These declarations support permission-aware navigation; access must still be enforced by route guards and the backend.
