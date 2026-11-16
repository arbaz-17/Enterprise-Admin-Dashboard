import { eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";

/**
 * Retrieve the fields required for password login.
 *
 * The password hash is only used internally to verify
 * credentials and must never be returned to the client.
 */
export async function findUserForLogin(email: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user;
}
