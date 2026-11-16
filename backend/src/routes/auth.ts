import { Router, type Request, type Response } from "express";

import { rateLimit } from "express-rate-limit";

// Middleware
import { requireAuth } from "../middleware/require-auth.js";
import { requireTrustedOrigin } from "../middleware/trusted-origin.js";

// Permissions
import { getPermissions } from "../config/permissions.js";

// Schemas
import { loginSchema } from "../modules/auth/schemas.js";

// Services
import {
  loginWithPassword,
  refreshAuthentication,
  type AuthCredentials,
} from "../modules/auth/services.js";

// Existing session utilities
import {
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
  refreshCookieClearOptions,
  revokeRefreshSession,
} from "../modules/auth/sessions.js";

export const authRouter = Router();

// Must remain consistent with the 15-minute JWT lifetime
// configured in modules/auth/tokens.ts.
const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 900;

// ============================================================
// LOGIN RATE LIMITING
// ============================================================

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// ============================================================
// COOKIE AND RESPONSE HELPERS
// ============================================================

/**
 * Read the refresh token from the request cookie.
 *
 * A 32-byte random token encoded as base64url
 * produces a 43-character token.
 */
function getRefreshToken(req: Request): string | null {
  const token: unknown = req.cookies?.[REFRESH_COOKIE_NAME];

  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token)
    ? token
    : null;
}

/**
 * Remove the refresh-token cookie from the client.
 */
function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieClearOptions);
}

/**
 * Send a successful authentication response.
 *
 * Used by both login and refresh to keep
 * their response formats consistent.
 */

function sendAuthResponse(
  res: Response,
  credentials: AuthCredentials,
): void {
  // Never cache a response containing access tokens.
  res.setHeader("Cache-Control", "no-store");

  // Preserve the existing secure refresh cookie.
  res.cookie(
    REFRESH_COOKIE_NAME,
    credentials.refreshToken,
    refreshCookieOptions,
  );

  res.status(200).json({
    accessToken: credentials.accessToken,
    tokenType: "Bearer",
    expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,

    // User already retrieved and validated by backend.
    user: credentials.user,

    // Derive permissions from the current database role.
    permissions: getPermissions(credentials.user.role),
  });
}


/**
 * Send the standard invalid-session response
 * and clear any stale refresh cookie.
 */
function sendInvalidSession(res: Response): void {
  clearRefreshCookie(res);

  res.status(401).json({
    error: {
      code: "INVALID_SESSION",
      message: "Session expired or invalid",
    },
  });
}

// ============================================================
// POST /api/auth/login
// ============================================================

authRouter.post(
  "/login",
  requireTrustedOrigin,
  loginLimiter,
  async (req, res) => {
    // 1. Validate credentials.
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid login request",
        },
      });
      return;
    }

    // 2. Authenticate and create credentials.
    const result = await loginWithPassword(parsed.data);

    if (result.kind === "invalid_credentials") {
      res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      });
      return;
    }

    // 3. Set refresh cookie and return access token.
    sendAuthResponse(res, result.credentials);
  },
);

// ============================================================
// POST /api/auth/refresh
// ============================================================

authRouter.post("/refresh", requireTrustedOrigin, async (req, res) => {
  // 1. Retrieve refresh token from HttpOnly cookie.
  const refreshToken = getRefreshToken(req);

  if (!refreshToken) {
    sendInvalidSession(res);
    return;
  }

  // 2. Rotate refresh session and create access token.
  const credentials = await refreshAuthentication(refreshToken);

  if (!credentials) {
    sendInvalidSession(res);
    return;
  }

  // 3. Issue the new credentials.
  sendAuthResponse(res, credentials);
});

// ============================================================
// POST /api/auth/logout
// ============================================================

/**
 * Revoke the current refresh session and clear its cookie.
 *
 * An access token isn't required, allowing logout
 * even when the access token has expired.
 */
authRouter.post("/logout", requireTrustedOrigin, async (req, res) => {
  const refreshToken = getRefreshToken(req);

  // Revoke the session if a valid token is present.
  if (refreshToken) {
    await revokeRefreshSession(refreshToken);
  }

  clearRefreshCookie(res);

  // Logout remains idempotent.
  res.sendStatus(204);
});

// ============================================================
// GET /api/auth/me
// ============================================================

authRouter.get("/me", requireAuth, (req, res) => {
  const user = req.authUser;

  if (!user) {
    res.sendStatus(401);
    return;
  }

  res.setHeader("Cache-Control", "no-store");

  res.status(200).json({
    user,
    permissions: getPermissions(user.role),
  });
});
