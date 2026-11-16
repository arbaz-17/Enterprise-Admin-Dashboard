
import type { User } from "../../db/schema.js";

import { findUserForLogin } from "./repository.js";
import { verifyPassword } from "./password.js";
import { createAccessToken } from "./tokens.js";

import {
  createRefreshSession,
  rotateRefreshSession,
} from "./sessions.js";

import type { LoginInput } from "./schemas.js";

// ============================================================
// TYPES
// ============================================================

// Fields safe to expose to the authenticated client.
type AuthUser = Pick<
  User,
  "id" | "name" | "email" | "role"
>;

export interface AuthCredentials {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export type LoginResult =
  | { kind: "invalid_credentials" }
  | {
      kind: "success";
      credentials: AuthCredentials;
    };

// ============================================================
// PASSWORD LOGIN
// ============================================================

/**
 * Authenticate a user using email and password.
 *
 * Keeps the same response for nonexistent users,
 * inactive users and incorrect passwords.
 */
export async function loginWithPassword({
  email,
  password,
}: LoginInput): Promise<LoginResult> {
  // 1. Retrieve the account.
  const user = await findUserForLogin(email);

  if (!user || !user.isActive) {
    return { kind: "invalid_credentials" };
  }

  // 2. Verify the password hash.
  const passwordValid = await verifyPassword(
    password,
    user.passwordHash,
  );

  if (!passwordValid) {
    return { kind: "invalid_credentials" };
  }

  // 3. Create authentication credentials.
  const accessToken = await createAccessToken(user.id);
  const refreshToken = await createRefreshSession(user.id);

  // Never expose passwordHash or other internal user fields.
  const authUser: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  return {
    kind: "success",
    credentials: {
      accessToken,
      refreshToken,
      user: authUser,
    },
  };
}

// ============================================================
// SESSION REFRESH
// ============================================================

/**
 * Rotate a refresh session and issue a new access token.
 *
 * Existing token reuse detection, expiration handling,
 * and session validation remain in sessions.ts.
 *
 * Returns null when the refresh session is invalid.
 */
export async function refreshAuthentication(
  refreshToken: string,
): Promise<AuthCredentials | null> {
  // 1. Consume the old refresh token and rotate the session.
  const result = await rotateRefreshSession(refreshToken);

  if (!result) {
    return null;
  }

  // 2. Create a new short-lived access token.
  const accessToken = await createAccessToken(
    result.user.id,
  );

  return {
    accessToken,
    refreshToken: result.refreshToken,
    user: result.user,
  };
}
