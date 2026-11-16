
import {
  departmentExists,
  activeUserExists,
} from "./repository.js";

import type { UpdateEmployeeInput } from "./schemas.js";

type EmployeeReferences = Pick<
  UpdateEmployeeInput,
  "departmentId" | "userId"
>;

interface ReferenceError {
  code: "INVALID_DEPARTMENT" | "INVALID_USER";
  message: string;
}

/**
 * Validates employee-related database references.
 *
 * - departmentId: if provided, it must exist.
 * - userId: if provided and non-null, it must be active.
 * - null userId: allowed (unlink account).
 *
 * Returns null when references are valid.
 */
export async function validateEmployeeReferences(
  input: EmployeeReferences,
): Promise<ReferenceError | null> {
  if (input.departmentId !== undefined) {
    const exists = await departmentExists(input.departmentId);

    if (!exists) {
      return {
        code: "INVALID_DEPARTMENT",
        message: "Select an existing department",
      };
    }
  }

  if (input.userId) {
    const exists = await activeUserExists(input.userId);

    if (!exists) {
      return {
        code: "INVALID_USER",
        message: "Linked user account must be active",
      };
    }
  }

  return null;
}
