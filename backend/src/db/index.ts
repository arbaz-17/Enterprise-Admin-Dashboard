
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { env } from '../config/env.js'

export const dbClient = postgres(env.DATABASE_URL, {
  prepare: false,
  max: 1,
  ssl: 'require',
  connect_timeout: 10,
})

export const db = drizzle({ client: dbClient })
