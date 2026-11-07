
import 'dotenv/config'
import { z } from 'zod'

import { db, dbClient } from './index.js'
import { users } from './schema.js'
import { hashPassword } from '../modules/auth/password.js'

const seedSchema = z.object({
  SEED_ADMIN_NAME: z.string().min(1),
  SEED_ADMIN_EMAIL: z.string().email(),
  SEED_ADMIN_PASSWORD: z.string().min(12),
})

async function main() {
  try {
    const config = seedSchema.parse(process.env)

    const passwordHash = await hashPassword(
      config.SEED_ADMIN_PASSWORD
    )

    const [created] = await db
      .insert(users)
      .values({
        name: config.SEED_ADMIN_NAME,
        email: config.SEED_ADMIN_EMAIL.trim().toLowerCase(),
        passwordHash,
        role: 'admin',
      })
      .onConflictDoNothing({
        target: users.email,
      })
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
      })

    if (created) {
      console.log('Admin user created:', created)
    } else {
      console.log('User already exists. No changes made.')
    }
  } catch (error) {
    console.error('Admin seed failed:', error)
    process.exitCode = 1
  } finally {
    await dbClient.end()
  }
}

void main()
