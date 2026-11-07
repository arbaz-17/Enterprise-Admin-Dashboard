
import type { RequestHandler } from 'express'

import {
  hasPermission,
  type Permission,
} from '../config/permissions.js'

export function requirePermission(
  permission: Permission
): RequestHandler {
  return (req, res, next) => {
    const user = req.authUser

    if (!user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      })
      return
    }

    if (!hasPermission(user.role, permission)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      })
      return
    }

    next()
  }
}
