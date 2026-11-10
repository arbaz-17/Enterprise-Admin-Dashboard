import { Router } from "express";
import type { Request, Response } from 'express'
import { z } from "zod";
import { eq } from "drizzle-orm";
import { rateLimit } from "express-rate-limit";

import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { verifyPassword } from "../modules/auth/password.js";
import { createAccessToken } from "../modules/auth/tokens.js";
import { getPermissions } from '../config/permissions.js'

import { requireAuth } from '../middleware/require-auth.js'

import {
  createRefreshSession,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
    refreshCookieClearOptions,
  rotateRefreshSession,
  revokeRefreshSession,
} from "../modules/auth/sessions.js";

import { requireTrustedOrigin } from '../middleware/trusted-origin.js'

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z
    .string()
    .min(1)
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "Password exceeds bcrypt input limit",
    ),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});


function getRefreshToken(req: Request): string | null {
  const token: unknown = req.cookies?.[REFRESH_COOKIE_NAME]

  return typeof token === 'string' &&
    /^[A-Za-z0-9_-]{43}$/.test(token)
    ? token
    : null
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(
    REFRESH_COOKIE_NAME,
    refreshCookieClearOptions
  )
}


// POST /api/auth/login
authRouter.post("/login", requireTrustedOrigin, loginLimiter, async (req, res) => {
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

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !user.isActive) {
    res.status(401).json({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      },
    });
    return;
  }

  const validPassword = await verifyPassword(password, user.passwordHash);

  if (!validPassword) {
    res.status(401).json({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      },
    });
    return;
  }

  // Create access and refresh credentials
  const accessToken = await createAccessToken(user.id);
  const refreshToken = await createRefreshSession(user.id);

  // Store refresh token in a secure cookie
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

  // Return only the access token and safe user information
  res.status(200).json({
    accessToken,
    tokenType: "Bearer",
    expiresIn: 900,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});


authRouter.post(
  '/refresh',
  requireTrustedOrigin,
  async (req, res) => {
    const token = getRefreshToken(req)

    if (!token) {
      clearRefreshCookie(res)

      res.status(401).json({
        error: {
          code: 'INVALID_SESSION',
          message: 'Session expired or invalid',
        },
      })
      return
    }

    const result = await rotateRefreshSession(token)

    if (!result) {
      clearRefreshCookie(res)

      res.status(401).json({
        error: {
          code: 'INVALID_SESSION',
          message: 'Session expired or invalid',
        },
      })
      return
    }

    const accessToken = await createAccessToken(
      result.user.id
    )

    res.cookie(
      REFRESH_COOKIE_NAME,
      result.refreshToken,
      refreshCookieOptions
    )

    res.status(200).json({
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      user: result.user,
    })
  }
)


/**
 * POST /api/auth/logout
 *
 * Revoke the current refresh session and clear its cookie.
 * Access token is not required, so logout still works
 * when the short-lived access token has expired.
 */
authRouter.post(
  "/logout",
  requireTrustedOrigin,
  async (req, res) => {
    const refreshToken = getRefreshToken(req);

    if (refreshToken) {
      await revokeRefreshSession(refreshToken);
    }

    clearRefreshCookie(res);

    // Idempotent: also succeeds when no session exists.
    res.sendStatus(204);
  }
);



// GET /api/auth/me

authRouter.get('/me', requireAuth, (req, res) => {
  const user = req.authUser

  if (!user) {
    res.sendStatus(401)
    return
  }

  res.setHeader('Cache-Control', 'no-store')

  res.status(200).json({
    user,
    permissions: getPermissions(user.role),
  })
})



