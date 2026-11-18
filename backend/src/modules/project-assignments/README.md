# Project Assignments

## Overview

Project team membership and employee assignment rules. This module backs `/api/projects/:projectId/assignments`.

## Key Responsibilities

- Retrieve a project's current team members.
- Search active employees not already assigned to that project.
- Add or remove members while preventing duplicate assignments.
- Allow admins and the project's assigned manager to change membership.

## Structure

| File | Purpose |
| --- | --- |
| `schemas.ts` | Validates project/member IDs, add-member payloads, and option searches. |
| `repository.ts` | Drizzle queries for team lists, available employees, and assignment changes. |
| `services.ts` | Checks project-specific mutation access and employee eligibility. |

## How It Works

Routes first verify authentication and permissions. Mutation services reuse [`../projects/access.ts`](../projects/access.ts) to verify manager ownership and require an active employee. The database enforces unique `(projectId, employeeId)` membership; routes translate duplicate or stale-reference conflicts into API errors.
