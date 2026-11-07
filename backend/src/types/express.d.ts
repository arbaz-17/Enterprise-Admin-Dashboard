
import type { User } from '../db/schema.js'

declare global {
  namespace Express {
    interface Request {
      authUser?: Pick<
        User,
        'id' | 'name' | 'email' | 'role'
      >
    }
  }
}

export {}
