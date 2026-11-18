# Shared Components

## Overview

Small, reusable presentation components for common application states and branding across dashboard pages and features.

## Key Responsibilities

- Display consistent loading, empty, and error experiences.
- Request confirmation before an action, with pending-state protection.
- Reuse the same brand mark across the application.

## Structure

| File | Purpose |
| --- | --- |
| `confirm-dialog.tsx` | Controlled confirmation dialog with optional destructive style and pending state. |
| `empty-state.tsx` | Empty-content message with icon and optional action. |
| `error-state.tsx` | Error alert with optional retry button and retrying state. |
| `loading-state.tsx` | Accessible loading indicator with customizable message. |
| `logo.tsx` | `BrandMark` SVG used by the application layout. |

## Usage

These components receive content and callbacks through props; feature logic and API requests remain in their consuming pages or features.
