
import { Router } from 'express'
import { desc } from 'drizzle-orm'

import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { requireAuth } from '../middleware/require-auth.js'
import { requirePermission } from '../middleware/require-permission.js'

export const usersRouter = Router()

// Protect every route in this router
usersRouter.use(requireAuth)

// GET /api/users
usersRouter.get(
  '/',
  requirePermission('users:read'),
  async (_req, res) => {
    const records = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(20)

    res.status(200).json({
      users: records,
    })
  }
)
