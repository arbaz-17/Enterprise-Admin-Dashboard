import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Plus, Trash2, UsersRound } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/page-header'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingState } from '@/components/shared/loading-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/hooks/use-auth'
import { AddProjectMemberDialog } from '@/features/team-assignments/add-project-member-dialog'
import { useAddTeamMember, useProjectTeam, useRemoveTeamMember } from '@/features/team-assignments/team-assignment.queries'
import type { EmployeeStatus, ProjectTeamMember } from '@/features/team-assignments/team-assignments.types'
import { getApiErrorMessage } from '@/lib/api-error'

const statusLabel: Record<EmployeeStatus, string> = {
  active: 'Active', on_leave: 'On leave', inactive: 'Inactive',
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(date)
}

export function ProjectTeamPage() {
  const { projectId = '' } = useParams<{ projectId: string }>()
  const { hasPermission } = useAuth()
  const [addOpen, setAddOpen] = useState(false)
  const [removing, setRemoving] = useState<ProjectTeamMember | null>(null)

  const { data, isPending, isError, isFetching, error, refetch } = useProjectTeam(projectId)
  const add = useAddTeamMember()
  const remove = useRemoveTeamMember()
  const canManage = hasPermission('assignments:manage') && Boolean(data?.project.canManageTeam)

  async function handleAdd(employeeId: string) {
    if (!canManage) throw new Error('You do not have permission to manage this team')
    await add.mutateAsync({ projectId, employeeId })
    toast.success('Employee assigned to project')
    setAddOpen(false)
  }

  async function handleRemove() {
    if (!canManage || !removing || remove.isPending) return
    try {
      await remove.mutateAsync({ projectId, employeeId: removing.employeeId })
      toast.success('Employee removed from project team')
      setRemoving(null)
    } catch (reason) {
      toast.error(getApiErrorMessage(reason))
    }
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader title={data ? `${data.project.name} — Team` : 'Project team'}
          description={data
            ? `View team assignments for ${data.project.clientName}. The project manager is assigned separately from team membership.`
            : 'View and manage employee assignments for this project.'}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/projects"><ArrowLeft className="size-4" aria-hidden="true" /> Back to Projects</Link>
              </Button>
              {canManage && <Button type="button" onClick={() => setAddOpen(true)}>
                <Plus aria-hidden="true" /> Add member
              </Button>}
            </div>
          }
        />

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle><h2 className="text-base font-semibold">Team members</h2></CardTitle>
            <CardDescription>
              {data
                ? `${data.data.length} employee${data.data.length === 1 ? '' : 's'} assigned to this project`
                : 'Employees currently assigned to this project'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <LoadingState message="Loading project team..." />
            ) : isError ? (
              <ErrorState title="Unable to load project team" message={getApiErrorMessage(error)}
                onRetry={() => void refetch()} isRetrying={isFetching} />
            ) : data.data.length === 0 ? (
              <EmptyState icon={UsersRound} title="No team members yet"
                description="This project has no assigned employees. Assign active employees to form its team."
                action={canManage ? <Button type="button" onClick={() => setAddOpen(true)}>
                  <Plus aria-hidden="true" /> Add first member
                </Button> : undefined} />
            ) : (
              <Table aria-label="Project team members">
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="min-w-48">
                        <div className="font-medium">{member.fullName}</div>
                        <div className="text-xs text-muted-foreground">{member.workEmail}</div>
                      </TableCell>
                      <TableCell className="whitespace-normal">{member.designation}</TableCell>
                      <TableCell>{member.departmentName}</TableCell>
                      <TableCell>
                        <Badge variant={member.status === 'inactive' ? 'destructive' : 'outline'}>
                          {statusLabel[member.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(member.assignedAt)}
                      </TableCell>
                      {canManage && <TableCell className="text-right">
                        <Button type="button" variant="ghost" size="icon-sm"
                          aria-label={`Remove ${member.fullName} from project`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setRemoving(member)}>
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {canManage && addOpen && <AddProjectMemberDialog
        projectId={projectId} open={addOpen} onOpenChange={setAddOpen}
        isPending={add.isPending} onAdd={handleAdd}
      />}

      <ConfirmDialog open={canManage && removing !== null}
        onOpenChange={(open) => { if (!open) setRemoving(null) }}
        title="Remove team member?"
        description={removing
          ? `Remove ${removing.fullName} from this project's team? Their employee profile will not be deleted.`
          : ''}
        confirmLabel="Remove member" variant="destructive"
        isPending={remove.isPending} onConfirm={() => void handleRemove()}
      />
    </>
  )
}
