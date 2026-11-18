# Test Setup

## Overview
Shared test environment for frontend unit and integration tests using **Vitest**, **React Testing Library**, and **Mock Service Worker (MSW)**.

## Key Responsibilities
- Configure DOM matchers and React Testing Library cleanup.
- Start and stop the MSW server for mocked HTTP requests.
- Reset request handlers between tests to keep tests isolated.
- Fail tests on unhandled network requests.

## Structure
- `setup.ts` — Global test hooks, `jest-dom` matchers, cleanup, and MSW lifecycle.
- `mocks/server.ts` — Exports the Node.js MSW server, initially without default handlers.

## How It Works
`frontend/vitest.config.ts` runs tests in **jsdom** and loads `setup.ts` before test files. Individual tests can register API mocks with `server.use(...)`; handlers are reset after each test.

## Run Tests
From `frontend/`:

```bash
npm test          # Run tests once
npm run test:watch # Watch mode
```