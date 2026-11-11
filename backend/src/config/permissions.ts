
import type { User } from '../db/schema.js'

export type Role = User['role']

export type Permission =
  | 'dashboard:read'
  | 'users:read'
  | 'users:manage'
  | 'departments:read'
  | 'departments:manage'
  | 'employees:read'
  | 'employees:manage'
  | 'clients:read'
  | 'clients:manage'
  | 'projects:read'
  | 'projects:create'
  | 'projects:manage'
  | 'projects:delete'
  | 'assignments:manage'

const permissionRoles: Record<
  Permission,
  readonly Role[]
> = {
  'dashboard:read': ['admin', 'manager', 'viewer'],

  'users:read': ['admin', 'manager'],
  'users:manage': ['admin'],

  'departments:read': ['admin', 'manager'],
  'departments:manage': ['admin'],

  'employees:read': ['admin', 'manager'],
  'employees:manage': ['admin'],

  'clients:read': ['admin', 'manager'],
  'clients:manage': ['admin'],

  'projects:read': ['admin', 'manager'],
  'projects:create': ['admin'],
  'projects:manage': ['admin', 'manager'],
  'projects:delete': ['admin'],

  'assignments:manage': ['admin', 'manager'],
}

export function hasPermission(
  role: Role,
  permission: Permission
): boolean {
  return permissionRoles[permission].includes(role)
}

export function getPermissions(role: Role): Permission[] {
  return (Object.keys(permissionRoles) as Permission[])
    .filter((permission) => hasPermission(role, permission))
}
