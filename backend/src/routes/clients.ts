import { Router } from 'express'
import { z } from 'zod'
import { and, asc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'

import { db } from '../db/index.js'
import { clients } from '../db/schema.js'
import { requireAuth } from '../middleware/require-auth.js'
import { requirePermission } from '../middleware/require-permission.js'
import { requireTrustedOrigin } from '../middleware/trusted-origin.js'

export const clientsRouter = Router()
clientsRouter.use(requireAuth)

const clientStatusSchema = z.enum(['active', 'inactive'])
const idParamsSchema = z.object({ id: z.uuid() })
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().max(100).optional(),
  status: clientStatusSchema.optional(),
})

const clientFields = z.strictObject({
  name: z.string().trim().min(1, 'Client name is required').max(160),
  contactName: z.string().trim().max(120).nullable(),
  contactEmail: z.email().max(254).nullable(),
  status: clientStatusSchema,
})

const createClientSchema = clientFields.extend({
  contactName: clientFields.shape.contactName.optional(),
  contactEmail: clientFields.shape.contactEmail.optional(),
  status: clientStatusSchema.default('active'),
})

const updateClientSchema = clientFields.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Provide at least one field to update'
)

function escapeLike(value: string) {
  // % and _ are LIKE wildcards; treat them as literal search characters.
  return value.replace(/[\\%_]/g, '\\$&')
}

function getPgErrorCode(error: unknown): string | null {
  let current: unknown = error
  for (let depth = 0; depth < 4; depth++) {
    if (!current || typeof current !== 'object') return null
    if ('code' in current && typeof current.code === 'string') return current.code
    current = 'cause' in current ? current.cause : null
  }
  return null
}

// GET /api/clients?page=1&pageSize=10&q=&status=
clientsRouter.get('/', requirePermission('clients:read'), async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid client filters' } })
    return
  }

  const { page, pageSize, q, status } = parsed.data
  const filters: SQL[] = []

  if (q) {
    const pattern = `%${escapeLike(q)}%`
    const searchFilter = or(
      ilike(clients.name, pattern),
      ilike(clients.contactName, pattern),
      ilike(clients.contactEmail, pattern)
    )
    if (searchFilter) filters.push(searchFilter)
  }

  if (status) filters.push(eq(clients.status, status))
  const where = filters.length > 0 ? and(...filters) : undefined

  // Sequential reads avoid query-pipelining problems with the current small pool.
  const records = await db.select().from(clients)
    .where(where)
    .orderBy(asc(clients.name), asc(clients.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const total = await db.$count(clients, where)

  res.json({
    data: records,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  })
})

// GET /api/clients/:id
clientsRouter.get('/:id', requirePermission('clients:read'), async (req, res) => {
  const parsed = idParamsSchema.safeParse(req.params)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid client ID' } })
    return
  }

  const [record] = await db.select().from(clients)
    .where(eq(clients.id, parsed.data.id)).limit(1)

  if (!record) {
    res.status(404).json({ error: { code: 'CLIENT_NOT_FOUND', message: 'Client not found' } })
    return
  }

  res.json({ data: record })
})

// POST /api/clients
clientsRouter.post('/', requireTrustedOrigin, requirePermission('clients:manage'), async (req, res) => {
  const parsed = createClientSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid client data' } })
    return
  }

  const [record] = await db.insert(clients).values(parsed.data).returning()
  res.status(201).location(`/api/clients/${record.id}`).json({ data: record })
})

// PATCH /api/clients/:id
clientsRouter.patch('/:id', requireTrustedOrigin, requirePermission('clients:manage'), async (req, res) => {
  const params = idParamsSchema.safeParse(req.params)
  const body = updateClientSchema.safeParse(req.body)
  if (!params.success || !body.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid client update request' } })
    return
  }

  const [updated] = await db.update(clients)
    .set({ ...body.data, updatedAt: sql`now()` })
    .where(eq(clients.id, params.data.id))
    .returning()

  if (!updated) {
    res.status(404).json({ error: { code: 'CLIENT_NOT_FOUND', message: 'Client not found' } })
    return
  }

  res.json({ data: updated })
})

// DELETE /api/clients/:id
clientsRouter.delete('/:id', requireTrustedOrigin, requirePermission('clients:manage'), async (req, res) => {
  const parsed = idParamsSchema.safeParse(req.params)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid client ID' } })
    return
  }

  try {
    const [deleted] = await db.delete(clients)
      .where(eq(clients.id, parsed.data.id))
      .returning({ id: clients.id })

    if (!deleted) {
      res.status(404).json({ error: { code: 'CLIENT_NOT_FOUND', message: 'Client not found' } })
      return
    }

    res.sendStatus(204)
  } catch (error) {
    if (getPgErrorCode(error) === '23503') {
      res.status(409).json({
        error: {
          code: 'CLIENT_IN_USE',
          message: 'This client has linked projects. Reassign or remove those projects first.',
        },
      })
      return
    }
    throw error
  }
})
