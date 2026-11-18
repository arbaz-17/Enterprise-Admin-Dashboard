# Team Assignments

## Overview

Project-specific employee assignments for `/projects/:projectId/team`.

## Key Responsibilities

- Load the current team and search employees eligible to join a project.
- Add or remove project members with permission-aware controls.
- Refresh team and available-employee data after membership changes.

## Structure

| File | Purpose |
| --- | --- |
| `team-assignment-api.ts` | Project team, eligible employee, add-member, and remove-member endpoints. |
| `team-assignment.queries.ts` | Team/available-employee queries and add/remove mutations. |
| `team-assignments.types.ts` | Team member, project capability, and employee-option types. |
| `add-project-member-dialog.tsx` | Search/select eligible active employees and submit an assignment. |
| `team-member-columns.tsx` | Team table columns and remove-member actions. |
| `team-assignments.test.tsx` | Permission restriction, add-member, and removal confirmation tests. |

## How It Works

`ProjectTeamPage` loads a team by project ID. The add dialog searches `GET /projects/:id/assignments/options`; mutations use the project-scoped assignment endpoints. Management is shown only when `assignments:manage` and the API's `project.canManageTeam` allow it. After add/remove, the hooks invalidate team detail and available-employee results for that project.
