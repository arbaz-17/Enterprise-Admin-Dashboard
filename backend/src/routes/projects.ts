import { Router } from 'express'
import { z } from 'zod'
import { and, asc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm'

import { db } from '../db/index.js'
import { clients, employees, projects, users } from '../db/schema.js'
import { requireAuth } from '../middleware/require-auth.js'
import { requirePermission } from '../middleware/require-permission.js'
import { requireTrustedOrigin } from '../middleware/trusted-origin.js'

export const projectsRouter = Router()
projectsRouter.use(requireAuth)

const uuidParams = z.object({ id: z.uuid() })
const statusSchema = z.enum(['planning', 'active', 'on_hold', 'completed'])
const prioritySchema = z.enum(['low', 'medium', 'high'])
const optionalDate = z.iso.date().nullable()

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().max(100).optional(),
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
  clientId: z.uuid().optional(),
})

const projectFields = z.strictObject({
  name: z.string().trim().min(1, 'Project name is required').max(160),
  description: z.string().trim().max(2000).nullable(),
  clientId: z.uuid(),
  managerEmployeeId: z.uuid().nullable(),
  status: statusSchema,
  priority: prioritySchema,
  progress: z.number().int().min(0).max(100),
  startDate: optionalDate,
  dueDate: optionalDate,
})
const createProjectSchema = projectFields.extend({
  description: projectFields.shape.description.optional(),
  managerEmployeeId: projectFields.shape.managerEmployeeId.optional(),
  status: statusSchema.default('planning'),
  priority: prioritySchema.default('medium'),
  progress: z.number().int().min(0).max(100).default(0),
  startDate: optionalDate.optional(),
  dueDate: optionalDate.optional(),
})
const adminUpdateSchema = projectFields.partial().refine(
  (values) => Object.keys(values).length > 0,
  'Provide at least one field to update'
)
const managerUpdateSchema = z.strictObject({
  status: statusSchema.optional(),
  progress: z.number().int().min(0).max(100).optional(),
}).refine((values) => Object.keys(values).length > 0,
  'Provide at least one field to update'
)

const projectProjection = {
  id: projects.id,
  name: projects.name,
  description: projects.description,
  clientId: projects.clientId,
  clientName: clients.name,
  managerEmployeeId: projects.managerEmployeeId,
  managerName: employees.fullName,
  status: projects.status,
  priority: projects.priority,
  progress: projects.progress,
  startDate: projects.startDate,
  dueDate: projects.dueDate,
  completedAt: projects.completedAt,
  createdAt: projects.createdAt,
  updatedAt: projects.updatedAt,
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, '\\$&')
}

function pgErrorCode(error: unknown): string | null {
  let value: unknown = error
  for (let i = 0; i < 4; i++) {
    if (!value || typeof value !== 'object') return null
    if ('code' in value && typeof value.code === 'string') return value.code
    value = 'cause' in value ? value.cause : null
  }
  return null
}

async function managedEmployeeId(userId: string): Promise<string | null> {
  const [employee] = await db.select({ id: employees.id })
    .from(employees)
    .where(and(eq(employees.userId, userId), eq(employees.status, 'active')))
    .limit(1)
  return employee?.id ?? null
}

async function projectById(id: string) {
  const [record] = await db.select(projectProjection)
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .leftJoin(employees, eq(projects.managerEmployeeId, employees.id))
    .where(eq(projects.id, id))
    .limit(1)
  return record
}

async function checkReferences(input: {
  clientId?: string
  managerEmployeeId?: string | null
}, previous?: { clientId: string; managerEmployeeId: string | null }) {
  if (input.clientId && input.clientId !== previous?.clientId) {
    const [client] = await db.select({ status: clients.status })
      .from(clients).where(eq(clients.id, input.clientId)).limit(1)
    if (!client || client.status !== 'active') {
      return { code: 'INVALID_CLIENT', message: 'Select an active client' }
    }
  }

  if (input.managerEmployeeId && input.managerEmployeeId !== previous?.managerEmployeeId) {
    const [manager] = await db.select({ id: employees.id })
      .from(employees)
      .innerJoin(users, eq(employees.userId, users.id))
      .where(and(
        eq(employees.id, input.managerEmployeeId),
        eq(employees.status, 'active'),
        eq(users.isActive, true),
        inArray(users.role, ['admin', 'manager'])
      )).limit(1)
    if (!manager) {
      return { code: 'INVALID_PROJECT_MANAGER', message: 'Select an active employee linked to an Admin or Manager account' }
    }
  }
  return null
}

function validDates(start: string | null | undefined, due: string | null | undefined) {
  return !start || !due || due >= start // ISO YYYY-MM-DD sorts chronologically
}

function validCompletedProgress(status: string, progress: number) {
  return status !== 'completed' || progress === 100
}

async function actorCanEdit(role: string, userId: string, managerEmployeeId: string | null) {
  if (role === 'admin') return true
  if (role !== 'manager' || !managerEmployeeId) return false
  return (await managedEmployeeId(userId)) === managerEmployeeId
}

// GET /api/projects?page=1&pageSize=10&q=&status=&priority=&clientId=
projectsRouter.get('/', requirePermission('projects:read'), async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid project list filters' } })
    return
  }
  const { page, pageSize, q, status, priority, clientId } = parsed.data
  const filters: SQL[] = []
  if (q) {
    const pattern = `%${escapeLike(q)}%`
    const search = or(ilike(projects.name, pattern), ilike(clients.name, pattern))
    if (search) filters.push(search)
  }
  if (status) filters.push(eq(projects.status, status))
  if (priority) filters.push(eq(projects.priority, priority))
  if (clientId) filters.push(eq(projects.clientId, clientId))
  const where = filters.length ? and(...filters) : undefined

  // IMPORTANT: sequential queries with the existing Supabase Postgres.js pool.
  const records = await db.select(projectProjection)
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .leftJoin(employees, eq(projects.managerEmployeeId, employees.id))
    .where(where)
    .orderBy(asc(projects.name), asc(projects.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const [count] = await db.select({ total: sql<number>`count(*)::int` })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(where)

  const actor = req.authUser!
  const employeeId = actor.role === 'manager' ? await managedEmployeeId(actor.id) : null
  const data = records.map((record) => ({
    ...record,
    canEdit: actor.role === 'admin' || (actor.role === 'manager' && !!employeeId && record.managerEmployeeId === employeeId),
  }))
  const total = count?.total ?? 0
  res.json({ data, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
})

// Only Admin needs these selectors (Managers may edit status/progress only).
projectsRouter.get('/form-options', requirePermission('projects:create'), async (_req, res) => {
  const clientOptions = await db.select({ id: clients.id, name: clients.name, status: clients.status })
    .from(clients).orderBy(asc(clients.name))

  const managerOptions = await db.select({ id: employees.id, name: employees.fullName, email: employees.workEmail })
    .from(employees)
    .innerJoin(users, eq(employees.userId, users.id))
    .where(and(eq(employees.status, 'active'), eq(users.isActive, true), inArray(users.role, ['admin', 'manager'])))
    .orderBy(asc(employees.fullName))

  res.json({ clients: clientOptions, managers: managerOptions })
})

// GET /api/projects/:id
projectsRouter.get('/:id', requirePermission('projects:read'), async (req, res) => {
  const parsed = uuidParams.safeParse(req.params)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid project ID' } })
    return
  }
  const record = await projectById(parsed.data.id)
  if (!record) {
    res.status(404).json({ error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } })
    return
  }
  const actor = req.authUser!
  res.json({ data: { ...record, canEdit: await actorCanEdit(actor.role, actor.id, record.managerEmployeeId) } })
})

// POST /api/projects — Admin only
projectsRouter.post('/', requireTrustedOrigin, requirePermission('projects:create'), async (req, res) => {
  const parsed = createProjectSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid project data' } })
    return
  }
  const input = parsed.data
  if (!validDates(input.startDate, input.dueDate) || !validCompletedProgress(input.status, input.progress)) {
    res.status(400).json({ error: { code: 'INVALID_PROJECT_DATES_OR_PROGRESS', message: 'Check the project date order and ensure completed projects have 100% progress' } })
    return
  }
  const invalid = await checkReferences(input)
  if (invalid) {
    res.status(400).json({ error: invalid })
    return
  }
  try {
    const [created] = await db.insert(projects).values({
      ...input,
      completedAt: input.status === 'completed' ? new Date() : null,
    }).returning({ id: projects.id })

    const record = await projectById(created.id)
    res.status(201).location(`/api/projects/${created.id}`).json({ data: { ...record!, canEdit: true } })
  } catch (error) {
    if (pgErrorCode(error) === '23503') {
      res.status(409).json({ error: { code: 'INVALID_RELATION', message: 'Client or manager no longer exists' } })
      return
    }
    throw error
  }
})

// PATCH /api/projects/:id — Admin full edit, Manager status/progress on own project.
projectsRouter.patch('/:id', requireTrustedOrigin, requirePermission('projects:manage'), async (req, res) => {
  const params = uuidParams.safeParse(req.params)
  const actor = req.authUser!
  const body = actor.role === 'admin'
    ? adminUpdateSchema.safeParse(req.body)
    : managerUpdateSchema.safeParse(req.body)

  if (!params.success || !body.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid project update or unauthorized fields' } })
    return
  }
  const [existing] = await db.select().from(projects).where(eq(projects.id, params.data.id)).limit(1)
  if (!existing) {
    res.status(404).json({ error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } })
    return
  }
  if (!(await actorCanEdit(actor.role, actor.id, existing.managerEmployeeId))) {
    res.status(403).json({ error: { code: 'PROJECT_NOT_ASSIGNED', message: 'You can only update projects assigned to you' } })
    return
  }
  const updates: Partial<z.infer<typeof projectFields>> = body.data
  const status = updates.status ?? existing.status
  const progress = updates.progress ?? existing.progress
  const start = 'startDate' in updates ? updates.startDate : existing.startDate
  const due = 'dueDate' in updates ? updates.dueDate : existing.dueDate
  if (!validDates(start, due) || !validCompletedProgress(status, progress)) {
    res.status(400).json({ error: { code: 'INVALID_PROJECT_DATES_OR_PROGRESS', message: 'Check project dates and ensure completed projects have 100% progress' } })
    return
  }
  if (actor.role === 'admin') {
    const invalid = await checkReferences(updates, existing)
    if (invalid) {
      res.status(400).json({ error: invalid })
      return
    }
  }

  const completedAt = status === 'completed'
    ? (existing.status === 'completed' ? existing.completedAt : new Date())
    : null

  try {
    // Condition the write on current assignment to prevent updates after reassignment.
    const ownerCondition = actor.role === 'manager'
      ? and(eq(projects.id, existing.id), eq(projects.managerEmployeeId, existing.managerEmployeeId!))
      : eq(projects.id, existing.id)
    const [updated] = await db.update(projects)
      .set({ ...updates, completedAt, updatedAt: sql`now()` })
      .where(ownerCondition)
      .returning({ id: projects.id })
    if (!updated) {
      res.status(actor.role === 'manager' ? 403 : 404).json({ error: { code: 'PROJECT_NOT_ASSIGNED_OR_NOT_FOUND', message: 'Project is no longer available for editing' } })
      return
    }
    const record = await projectById(updated.id)
    res.json({ data: { ...record!, canEdit: await actorCanEdit(actor.role, actor.id, record!.managerEmployeeId) } })
  } catch (error) {
    if (pgErrorCode(error) === '23503') {
      res.status(409).json({ error: { code: 'INVALID_RELATION', message: 'Client or manager no longer exists' } })
      return
    }
    throw error
  }
})

// DELETE /api/projects/:id — Admin only. Team assignments will prevent deletion.
projectsRouter.delete('/:id', requireTrustedOrigin, requirePermission('projects:delete'), async (req, res) => {
  const params = uuidParams.safeParse(req.params)
  if (!params.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid project ID' } })
    return
  }
  try {
    const [deleted] = await db.delete(projects).where(eq(projects.id, params.data.id))
      .returning({ id: projects.id })
    if (!deleted) {
      res.status(404).json({ error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } })
      return
    }
    res.sendStatus(204)
  } catch (error) {
    if (pgErrorCode(error) === '23503') {
      res.status(409).json({ error: { code: 'PROJECT_IN_USE', message: 'Remove project team assignments before deleting the project' } })
      return
    }
    throw error
  }
})
