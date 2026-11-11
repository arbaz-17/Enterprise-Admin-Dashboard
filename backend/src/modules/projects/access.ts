import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { employees } from "../../db/schema.js";

// Shared ownership rule for project updates and team assignment mutations.
export async function managedEmployeeId(
  userId: string,
): Promise<string | null> {
  const [employee] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.userId, userId), eq(employees.status, "active")))
    .limit(1);
  return employee?.id ?? null;
}

export async function actorCanEdit(
  role: string,
  userId: string,
  managerEmployeeId: string | null,
): Promise<boolean> {
  if (role === "admin") return true;
  if (role !== "manager" || !managerEmployeeId) return false;
  return (await managedEmployeeId(userId)) === managerEmployeeId;
}
