# Layout Components

## Overview

The shared application shell for authenticated dashboard pages: navigation, breadcrumbs, account controls, and consistent page spacing.

## Key Responsibilities

- Compose the responsive sidebar, sticky header, and routed page content.
- Display permission-filtered navigation and handle sign-out.
- Show route-aware breadcrumbs, user information, and theme controls.
- Provide accessible navigation, including a skip-to-content link.

## Structure

| File | Purpose |
| --- | --- |
| `app-layout.tsx` | Shell with sidebar/tooltip providers, skip link, content container, and React Router `Outlet`. |
| `app-sidebar.tsx` | Grouped navigation from `src/config/navigation`, permission checks, mobile behavior, and logout. |
| `app-header.tsx` | Sidebar trigger, breadcrumbs, account display, and theme toggle. |
| `page-header.tsx` | Reusable page title, optional description, and action area. |

## How It Works

`AppLayout` wraps nested route content with `AppSidebar` and `AppHeader`. Sidebar state is restored from the `sidebar_state` cookie. The sidebar uses `useAuth()` for permission-aware links and sign-out, while the header reads route breadcrumbs from `src/config/navigation`.
