
import type { ProjectFields } from "./schemas.js";

import {
  getClientStatusById,
  isEligibleProjectManager,
} from "./repository.js";

type ProjectReferences = Pick<
  ProjectFields,
  "clientId" | "managerEmployeeId"
>;

type ReferenceInput = Partial<ProjectReferences>;

type ProjectStatus = ProjectFields["status"];

interface PreviousCompletion {
  status: ProjectStatus;
  completedAt: Date | null;
}

interface BusinessError {
  code: string;
  message: string;
}

/**
 * Validates references against current database state.
 *
 * Only checks references that were supplied and changed.
 * A null managerEmployeeId is allowed (unassign manager).
 */
export async function checkProjectReferences(
  input: ReferenceInput,
  previous?: ProjectReferences,
): Promise<BusinessError | null> {
  if (input.clientId && input.clientId !== previous?.clientId) {
    const status = await getClientStatusById(input.clientId);

    if (status !== "active") {
      return {
        code: "INVALID_CLIENT",
        message: "Select an active client",
      };
    }
  }

  if (
    input.managerEmployeeId &&
    input.managerEmployeeId !== previous?.managerEmployeeId
  ) {
    const eligible = await isEligibleProjectManager(
      input.managerEmployeeId,
    );

    if (!eligible) {
      return {
        code: "INVALID_PROJECT_MANAGER",
        message:
          "Select an active employee linked to an Admin or Manager account",
      };
    }
  }

  return null;
}

/**
 * ISO date strings (YYYY-MM-DD) can be compared
 * lexicographically.
 *
 * Missing dates are allowed.
 */
export function validDates(
  start: string | null | undefined,
  due: string | null | undefined,
): boolean {
  return !start || !due || due >= start;
}

/**
 * Completed projects must have 100% progress.
 */
export function validCompletedProgress(
  status: ProjectStatus,
  progress: number,
): boolean {
  return status !== "completed" || progress === 100;
}

/**
 * Determines a project's completedAt value.
 *
 * - Not completed: null
 * - Newly completed: current timestamp
 * - Already completed: preserve existing timestamp
 */
export function determineCompletedAt(
  status: ProjectStatus,
  previous?: PreviousCompletion,
  now: Date = new Date(),
): Date | null {
  if (status !== "completed") {
    return null;
  }

  if (previous?.status === "completed") {
    return previous.completedAt;
  }

  return now;
}
