
import { db, dbClient } from './index.js'
import { users } from './schema.js'

async function main() {
  try {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .limit(5)

    console.log('Users table connected successfully!')
    console.log('Users found:', result.length)
  } catch (error) {
    console.error('Database test failed:', error)
    process.exitCode = 1
  } finally {
    await dbClient.end()
  }
}

void main()
