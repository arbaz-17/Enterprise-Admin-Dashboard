import { actorCanEdit } from "../projects/access.js";

import { getAssignmentProject, isActiveEmployee } from "./repository.js";

// Only the information needed for authorization.
// No dependency on Express.
interface TeamActor {
  id: string;
  role: string;
}

export type TeamAccessResult = "ok" | "not-found" | "forbidden";

/**
 * Check whether the actor can modify a project's team.
 *
 * Admin: Can manage any existing project.
 * Manager: Can manage their own assigned projects.
 * Others: Forbidden.
 *
 * The route handles HTTP responses.
 */
export async function authorizeTeamMutation(
  actor: TeamActor,
  projectId: string,
): Promise<TeamAccessResult> {
  const project = await getAssignmentProject(projectId);

  if (!project) {
    return "not-found";
  }

  const canEdit = await actorCanEdit(
    actor.role,
    actor.id,
    project.managerEmployeeId,
  );

  if (!canEdit) {
    return "forbidden";
  }

  return "ok";
}

/**
 * Validate that an employee is eligible
 * to be added to a project team.
 */
export async function validateAssignableEmployee(employeeId: string) {
  const eligible = await isActiveEmployee(employeeId);

  if (!eligible) {
    return {
      code: "INVALID_EMPLOYEE",
      message: "Select an active employee",
    };
  }

  return null;
}
