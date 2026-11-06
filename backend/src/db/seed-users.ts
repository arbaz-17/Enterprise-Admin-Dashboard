
import 'dotenv/config'

import { db, dbClient } from './index.js'
import { users } from './schema.js'
import { hashPassword } from '../modules/auth/password.js'

const accounts = [
  {
    name: 'Arbaz Ahmad',
    email: 'admin@example.test',
    role: 'admin',
    passwordKey: 'SEED_ADMIN_PASSWORD',
  },
  {
    name: 'Peter Parker',
    email: 'manager@example.test',
    role: 'manager',
    passwordKey: 'SEED_MANAGER_PASSWORD',
  },
  {
    name: 'Harry Osborne',
    email: 'viewer@example.test',
    role: 'viewer',
    passwordKey: 'SEED_VIEWER_PASSWORD',
  },
] as const

async function main() {
  try {
    for (const account of accounts) {
      const password = process.env[account.passwordKey]

      if (
        !password ||
        password.length < 12 ||
        Buffer.byteLength(password, 'utf8') > 72
      ) {
        throw new Error(
          `Provide a valid password for ${account.role}`
        )
      }

      const passwordHash = await hashPassword(password)

      const [created] = await db
        .insert(users)
        .values({
          name: account.name,
          email: account.email,
          role: account.role,
          passwordHash,
        })
        .onConflictDoNothing({
          target: users.email,
        })
        .returning({ id: users.id })

      console.log(
        `${account.role}: ${created ? 'Created' : 'Already exists'}`
      )
    }
  } finally {
    await dbClient.end()
  }
}

main().catch((error) => {
  console.error('Seeding failed:', error)
  process.exitCode = 1
})


//"db:seed-users": "tsx src/db/seed-users.ts"

//npm run db:seed-users -w backend