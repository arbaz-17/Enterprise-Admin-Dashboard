import { useState, type FormEvent } from 'react'
import { useSearchParams, Link } from 'react-router'
import { Plus, Search, Pencil, Trash2, UsersRound, X } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/page-header'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingState } from '@/components/shared/loading-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '@/components/ui/table'
import { useAuth } from '@/hooks/use-auth'
import { useDepartments } from '@/features/departments/departments.queries'
import { EmployeeFormDialog } from '@/features/employees/employee-form-dialog'
import {
  useCreateEmployee, useDeleteEmployee, useEmployees, useUpdateEmployee,
} from '@/features/employees/employees.queries'
import type { Employee, EmployeeInput, EmployeeStatus } from '@/features/employees/employees.types'
import { getApiErrorMessage } from '@/lib/api-error'

const PAGE_SIZE = 10
const STATUSES: EmployeeStatus[] = ['active', 'on_leave', 'inactive']
type Editor = { mode: 'create' } | { mode: 'edit'; employee: Employee } | null

function formatDate(value: string | null) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(date)
}

function StatusBadge({ status }: { status: EmployeeStatus }) {
  const labels: Record<EmployeeStatus, string> = {
    active: 'Active', on_leave: 'On leave', inactive: 'Inactive',
  }
  return (
    <Badge variant={status === 'inactive' ? 'destructive' : status === 'on_leave' ? 'secondary' : 'outline'}>
      {labels[status]}
    </Badge>
  )
}

export function EmployeesPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('employees:manage')
  const [params, setParams] = useSearchParams()
  const [editor, setEditor] = useState<Editor>(null)
  const [deleting, setDeleting] = useState<Employee | null>(null)

  const rawPage = Number(params.get('page') ?? '1')
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 100000 ? rawPage : 1
  const q = (params.get('q') ?? '').trim().slice(0, 100)
  const statusValue = params.get('status')
  const status = STATUSES.find((value) => value === statusValue)
  const departmentId = params.get('departmentId') || undefined

  const { data, isPending, isError, isFetching, error, refetch } = useEmployees({
    page, pageSize: PAGE_SIZE, q: q || undefined, status, departmentId,
  })
  const departmentsQuery = useDepartments({ page: 1, pageSize: 100 })
  const create = useCreateEmployee()
  const update = useUpdateEmployee()
  const remove = useDeleteEmployee()

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next)
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const term = String(new FormData(event.currentTarget).get('q') ?? '').trim().slice(0, 100)
    updateFilter('q', term)
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(params)
    if (nextPage <= 1) next.delete('page')
    else next.set('page', String(nextPage))
    setParams(next)
  }

  async function handleSave(input: EmployeeInput) {
    if (!canManage || !editor) throw new Error('Not authorized to manage employees')
    if (editor.mode === 'create') {
      await create.mutateAsync(input)
      toast.success('Employee created successfully')
    } else {
      await update.mutateAsync({ id: editor.employee.id, input })
      toast.success('Employee updated successfully')
    }
    setEditor(null)
  }

  async function handleDelete() {
    if (!canManage || !deleting || remove.isPending) return
    try {
      await remove.mutateAsync(deleting.id)
      toast.success('Employee deleted successfully')
      setDeleting(null)
      if (data?.data.length === 1 && page > 1) goToPage(page - 1)
    } catch (cause) {
      toast.error(getApiErrorMessage(cause))
    }
  }

  const total = data?.pagination.total ?? 0
  const totalPages = data?.pagination.totalPages ?? 0
  const start = data?.data.length ? (page - 1) * PAGE_SIZE + 1 : 0
  const end = data?.data.length ? start + data.data.length - 1 : 0

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Employees"
          description="Manage workforce records, department assignments, and employment status."
          actions={canManage ? (
            <Button type="button" onClick={() => setEditor({ mode: 'create' })}>
              <Plus aria-hidden="true" /> Add employee
            </Button>
          ) : <Badge variant="outline">Read-only</Badge>}
        />
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle><h2 className="text-base font-semibold">Employee directory</h2></CardTitle>
            <CardDescription>
              {data ? `${total} employee${total === 1 ? '' : 's'} found` : 'Search and browse employees'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-end gap-2">
              <form role="search" className="flex min-w-48 flex-1 items-end gap-2 sm:max-w-md" onSubmit={handleSearch}>
                <div className="relative min-w-0 flex-1">
                  <label htmlFor="employee-search" className="sr-only">Search employees</label>
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input key={q} id="employee-search" type="search" name="q" defaultValue={q}
                    maxLength={100} placeholder="Name, email or designation..." className="h-10 pl-9" />
                </div>
                <Button type="submit">Search</Button>
              </form>
              <div>
                <label htmlFor="employee-status-filter" className="sr-only">Filter by employment status</label>
                <select id="employee-status-filter" value={status ?? ''} onChange={(event) => updateFilter('status', event.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring">
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="on_leave">On leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label htmlFor="employee-department-filter" className="sr-only">Filter by department</label>
                <select id="employee-department-filter" value={departmentId ?? ''}
                  onChange={(event) => updateFilter('departmentId', event.target.value)}
                  className="h-10 max-w-[200px] rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring">
                  <option value="">All departments</option>
                  {departmentsQuery.data?.data.map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </div>
              {(q || status || departmentId) && (
                <Button variant="outline" type="button" onClick={() => setParams({})}>
                  <X aria-hidden="true" className="size-4" /> Clear
                </Button>
              )}
            </div>

            {isPending ? (
              <LoadingState message="Loading employees..." />
            ) : isError ? (
              <ErrorState title="Unable to load employees" message={getApiErrorMessage(error)}
                onRetry={() => void refetch()} isRetrying={isFetching} />
            ) : !data || total === 0 ? (
              <EmptyState icon={UsersRound}
                title={(q || status || departmentId) ? 'No matching employees' : 'No employees yet'}
                description={(q || status || departmentId)
                  ? 'Adjust your filters or search term.'
                  : 'Create a department first, then add your first employee.'}
                action={canManage && !q && !status && !departmentId ? (
                  <Button asChild variant="outline"><Link to="/departments">View departments</Link></Button>
                ) : undefined} />
            ) : data.data.length === 0 ? (
              <EmptyState icon={UsersRound} title="No employees on this page"
                description="Return to the first page to see available results."
                action={<Button variant="outline" onClick={() => goToPage(1)}>First page</Button>} />
            ) : (
              <div aria-busy={isFetching}>
                <Table aria-label="Employees">
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Employee</TableHead>
                      <TableHead scope="col">Designation</TableHead>
                      <TableHead scope="col">Department</TableHead>
                      <TableHead scope="col">Status</TableHead>
                      <TableHead scope="col">Joined</TableHead>
                      <TableHead scope="col">Linked account</TableHead>
                      {canManage && <TableHead scope="col" className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="min-w-40 space-y-1">
                            <p className="font-medium">{employee.fullName}</p>
                            <p className="text-xs text-muted-foreground">{employee.workEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>{employee.designation}</TableCell>
                        <TableCell>{employee.departmentName}</TableCell>
                        <TableCell><StatusBadge status={employee.status} /></TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(employee.joiningDate)}</TableCell>
                        <TableCell className="text-muted-foreground">{employee.linkedUserName ?? '—'}</TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon-sm" aria-label={`Edit ${employee.fullName}`}
                                onClick={() => setEditor({ mode: 'edit', employee })}>
                                <Pencil className="size-4" aria-hidden="true" />
                              </Button>
                              <Button variant="ghost" size="icon-sm" aria-label={`Delete ${employee.fullName}`}
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleting(employee)}>
                                <Trash2 className="size-4" aria-hidden="true" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {isFetching && <p role="status" className="mt-2 text-xs text-muted-foreground">Refreshing employees...</p>}
              </div>
            )}

            {data && total > 0 && (
              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">Showing {start ? `${start}–${end}` : '0'} of {total}</p>
                <nav aria-label="Employee pages" className="flex items-center gap-3">
                  <Button type="button" variant="outline" size="sm" disabled={page <= 1 || isFetching}
                    onClick={() => goToPage(page - 1)}>Previous</Button>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button type="button" variant="outline" size="sm" disabled={page >= totalPages || isFetching}
                    onClick={() => goToPage(page + 1)}>Next</Button>
                </nav>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {editor && (
        <EmployeeFormDialog
          key={editor.mode === 'edit' ? editor.employee.id : 'create'}
          employee={editor.mode === 'edit' ? editor.employee : null}
          isPending={create.isPending || update.isPending}
          onOpenChange={(open) => { if (!open) setEditor(null) }}
          onSave={handleSave}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        title="Delete employee?"
        description={deleting
          ? `Delete ${deleting.fullName}? This cannot be undone. Employees linked to projects cannot be deleted until their project relationships are removed.`
          : ''}
        confirmLabel="Delete employee"
        variant="destructive"
        isPending={remove.isPending}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
