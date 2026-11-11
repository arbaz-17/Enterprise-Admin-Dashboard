import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { Building2, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/page-header'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingState } from '@/components/shared/loading-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ClientFormDialog } from '@/features/clients/client-form-dialog'
import { useClients, useCreateClient, useDeleteClient, useUpdateClient } from '@/features/clients/clients.queries'
import type { Client, ClientInput, ClientStatus } from '@/features/clients/clients.types'
import { useAuth } from '@/hooks/use-auth'
import { getApiErrorMessage } from '@/lib/api-error'

const PAGE_SIZE = 10
type Editor = { mode: 'create' } | { mode: 'edit'; client: Client } | null

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(date)
}

export function ClientsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('clients:manage')
  const [params, setParams] = useSearchParams()
  const [editor, setEditor] = useState<Editor>(null)
  const [deleting, setDeleting] = useState<Client | null>(null)

  const rawPage = Number(params.get('page') ?? '1')
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 100000 ? rawPage : 1
  const q = (params.get('q') ?? '').trim().slice(0, 100)
  const statusParam = params.get('status')
  const status: ClientStatus | undefined = statusParam === 'active' || statusParam === 'inactive'
    ? statusParam : undefined

  const { data, isPending, isError, isFetching, error, refetch } = useClients({
    page, pageSize: PAGE_SIZE, q: q || undefined, status,
  })
  const create = useCreateClient()
  const update = useUpdateClient()
  const remove = useDeleteClient()

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next)
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = String(new FormData(event.currentTarget).get('q') ?? '').trim().slice(0, 100)
    setFilter('q', value)
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(params)
    if (nextPage <= 1) next.delete('page')
    else next.set('page', String(nextPage))
    setParams(next)
  }

  async function handleSave(payload: ClientInput): Promise<void> {
    if (!canManage || !editor) throw new Error('Not authorized to manage clients')

    if (editor.mode === 'create') {
      await create.mutateAsync(payload)
      toast.success('Client created successfully')
    } else {
      await update.mutateAsync({ id: editor.client.id, payload })
      toast.success('Client updated successfully')
    }

    setEditor(null)
  }

  async function handleDelete() {
    if (!canManage || !deleting || remove.isPending) return

    try {
      await remove.mutateAsync(deleting.id)
      toast.success('Client deleted successfully')
      setDeleting(null)
      if (data?.data.length === 1 && page > 1) goToPage(page - 1)
    } catch (cause) {
      // The dialog remains open so the user can read the conflict and cancel.
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
          title="Clients"
          description="Manage the client organizations associated with company projects."
          actions={canManage ? (
            <Button type="button" onClick={() => setEditor({ mode: 'create' })}>
              <Plus aria-hidden="true" /> Add client
            </Button>
          ) : <Badge variant="outline">Read-only</Badge>}
        />

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle><h2 className="text-base font-semibold">Client directory</h2></CardTitle>
            <CardDescription>
              {data ? `${total} client${total === 1 ? '' : 's'} found` : 'Search and browse client records'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <form role="search" className="flex min-w-0 flex-1 items-end gap-2" onSubmit={handleSearch}>
                <div className="relative min-w-0 flex-1 sm:max-w-sm">
                  <label htmlFor="client-search" className="sr-only">Search clients</label>
                  <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="client-search" name="q" type="search" key={q} defaultValue={q}
                    maxLength={100} placeholder="Search clients..." className="h-10 pl-9"
                  />
                </div>
                <Button type="submit" className="shrink-0">Search</Button>
                {q && (
                  <Button type="button" variant="outline" size="icon" aria-label="Clear client search" onClick={() => setFilter('q', '')}>
                    <X aria-hidden="true" />
                  </Button>
                )}
              </form>

              <div className="w-full sm:w-44">
                <label htmlFor="client-status-filter" className="sr-only">Filter clients by status</label>
                <Select value={status ?? 'all'} onValueChange={(value) => setFilter('status', value === 'all' ? '' : value)}>
                  <SelectTrigger id="client-status-filter" className="h-10 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isPending ? (
              <LoadingState message="Loading clients..." />
            ) : isError ? (
              <ErrorState
                title="Unable to load clients"
                message={getApiErrorMessage(error)}
                onRetry={() => void refetch()}
                isRetrying={isFetching}
              />
            ) : data.pagination.total === 0 ? (
              <EmptyState
                icon={Building2}
                title={q || status ? 'No matching clients' : 'No clients yet'}
                description={q || status
                  ? 'Try changing the search term or status filter.'
                  : 'No client organizations have been added yet.'}
              />
            ) : data.data.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No clients on this page"
                description="The requested page is beyond the available results."
                action={<Button type="button" variant="outline" onClick={() => goToPage(1)}>Back to first page</Button>}
              />
            ) : (
              <Table aria-label="Clients">
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell className="text-muted-foreground">{client.contactName || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{client.contactEmail || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={client.status === 'active' ? 'outline' : 'secondary'}>
                          {client.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(client.updatedAt)}</TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button" variant="ghost" size="icon-sm"
                              aria-label={`Edit ${client.name}`}
                              onClick={() => setEditor({ mode: 'edit', client })}
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                            </Button>
                            <Button
                              type="button" variant="ghost" size="icon-sm"
                              className="text-destructive hover:text-destructive"
                              aria-label={`Delete ${client.name}`}
                              onClick={() => setDeleting(client)}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {data && data.pagination.total > 0 && (
              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {start > 0 ? `Showing ${start}–${end} of ${total}` : `Showing 0 of ${total}`}
                </p>
                <nav aria-label="Client pages" className="flex items-center gap-3">
                  <Button type="button" size="sm" variant="outline" disabled={page <= 1 || isFetching} onClick={() => goToPage(page - 1)}>
                    Previous
                  </Button>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button type="button" size="sm" variant="outline" disabled={page >= totalPages || isFetching} onClick={() => goToPage(page + 1)}>
                    Next
                  </Button>
                </nav>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {editor && (
        <ClientFormDialog
          key={editor.mode === 'edit' ? editor.client.id : 'create'}
          client={editor.mode === 'edit' ? editor.client : null}
          isPending={create.isPending || update.isPending}
          onOpenChange={(open) => { if (!open) setEditor(null) }}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => { if (!open) setDeleting(null) }}
        title="Delete client?"
        description={deleting
          ? `Delete "${deleting.name}"? This cannot be undone. Clients linked to projects cannot be deleted.`
          : ''}
        confirmLabel="Delete client"
        variant="destructive"
        isPending={remove.isPending}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
