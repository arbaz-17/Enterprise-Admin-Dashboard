
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { and, eq, gt, isNull } from 'drizzle-orm'
import type { CookieOptions } from 'express'

import { db } from '../../db/index.js'
import { refreshSessions, users } from '../../db/schema.js'
import { env } from '../../config/env.js'

export const REFRESH_COOKIE_NAME = 'refresh_token'

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000

export const refreshCookieClearOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
}

export const refreshCookieOptions: CookieOptions = {
  ...refreshCookieClearOptions,
  maxAge: REFRESH_TTL_MS,
}

function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

// Called after successful login
export async function createRefreshSession(userId: string) {
  const token = generateRefreshToken()

  await db.insert(refreshSessions).values({
    userId,
    familyId: randomUUID(),
    tokenHash: hashRefreshToken(token),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  })

  return token
}

// Consume old token exactly once and issue a replacement
export async function rotateRefreshSession(token: string) {
  const tokenHash = hashRefreshToken(token)
  const newToken = generateRefreshToken()

  return db.transaction(async (tx) => {
    const [session] = await tx
      .update(refreshSessions)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(refreshSessions.tokenHash, tokenHash),
          isNull(refreshSessions.usedAt),
          isNull(refreshSessions.revokedAt),
          gt(refreshSessions.expiresAt, new Date())
        )
      )
      .returning({
        userId: refreshSessions.userId,
        familyId: refreshSessions.familyId,
      })

    if (!session) {
      // Check whether an already-used token was replayed.
      const [previous] = await tx
        .select({
          familyId: refreshSessions.familyId,
          usedAt: refreshSessions.usedAt,
        })
        .from(refreshSessions)
        .where(eq(refreshSessions.tokenHash, tokenHash))
        .limit(1)

      if (previous?.usedAt) {
        // Revoke the entire affected login session.
        await tx
          .update(refreshSessions)
          .set({ revokedAt: new Date() })
          .where(
            and(
              eq(refreshSessions.familyId, previous.familyId),
              isNull(refreshSessions.revokedAt)
            )
          )
      }

      return null
    }

    const [user] = await tx
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(
        and(
          eq(users.id, session.userId),
          eq(users.isActive, true)
        )
      )
      .limit(1)

    if (!user) {
      await tx
        .update(refreshSessions)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(refreshSessions.familyId, session.familyId),
            isNull(refreshSessions.revokedAt)
          )
        )

      return null
    }

    // Preserve the same family across rotations.
    await tx.insert(refreshSessions).values({
      userId: session.userId,
      familyId: session.familyId,
      tokenHash: hashRefreshToken(newToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    })

    return { user, refreshToken: newToken }
  })
}

// Revoke one login session, including its token family.
export async function revokeRefreshSession(token: string) {
  const [session] = await db
    .select({ familyId: refreshSessions.familyId })
    .from(refreshSessions)
    .where(eq(refreshSessions.tokenHash, hashRefreshToken(token)))
    .limit(1)

  if (!session) return

  await db
    .update(refreshSessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(refreshSessions.familyId, session.familyId),
        isNull(refreshSessions.revokedAt)
      )
    )
}
