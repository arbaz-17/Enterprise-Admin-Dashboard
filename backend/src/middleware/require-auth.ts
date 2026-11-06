
import type { RequestHandler } from 'express'
import { and, eq } from 'drizzle-orm'

import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { verifyAccessToken } from '../modules/auth/tokens.js'

export const requireAuth: RequestHandler = async (
  req,
  res,
  next
) => {
  // Extract Bearer token
  const token = req
    .get('authorization')
    ?.match(/^Bearer (\S+)$/i)?.[1]

  if (!token) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    })
    return
  }

  // Verify signature and expiration
  const userId = await verifyAccessToken(token)

  if (!userId) {
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired access token',
      },
    })
    return
  }

  // Find current active user
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(
      and(
        eq(users.id, userId),
        eq(users.isActive, true)
      )
    )
    .limit(1)

  if (!user) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'User not found or inactive',
      },
    })
    return
  }

  // Available to subsequent middleware and route handlers
  req.authUser = user

  next()
}
