# Theme Components

## Overview

Application-wide appearance management for light, dark, and operating-system themes.

## Key Responsibilities

- Store the selected theme and expose it through React context.
- Persist theme preference in browser local storage.
- Resolve the system preference and apply the `dark` class and `color-scheme` to the document.
- Provide a header menu for choosing the theme.

## Structure

| File | Purpose |
| --- | --- |
| `theme-context.ts` | Theme type (`light`, `dark`, `system`) and React context definition. |
| `theme-provider.tsx` | Context provider, preference persistence, and system-theme change listener. |
| `use-theme.ts` | Hook for accessing theme state; requires `ThemeProvider`. |
| `mode-toggle.tsx` | Light/dark/system dropdown control using `useTheme`. |

## How It Works

`ThemeProvider` reads `enterprise-dashboard-theme` from local storage. It applies the resolved theme to `<html>` and listens for OS theme changes while system mode is selected. Components can read or update the preference through `useTheme()`; `ModeToggle` provides the UI.
