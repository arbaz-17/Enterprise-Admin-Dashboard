import type { UserRole } from "@/features/auth/auth.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ManagedUser } from "./users-api";

interface UserDirectoryTableProps {
  users?: ManagedUser[];
  currentUserId?: string;
  isPending: boolean;
  isFetching: boolean;
  isUpdating: boolean;
  onRoleChange: (user: ManagedUser, role: UserRole) => void;
  onStatusChange: (user: ManagedUser) => void;
}

export function UserDirectoryTable({
  users,
  currentUserId,
  isPending,
  isFetching,
  isUpdating,
  onRoleChange,
  onStatusChange,
}: UserDirectoryTableProps) {
  return (
    <div
      className="overflow-x-auto rounded-md border"
      aria-busy={isPending || isFetching}
    >
      {isPending && (
        <p className="sr-only" role="status">
          Loading user accounts...
        </p>
      )}

      <Table aria-label="User accounts">
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isPending
            ? // Skeleton rows during initial loading.
              Array.from({ length: 5 }, (_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {Array.from({ length: 4 }, (_, columnIndex) => (
                    <TableCell
                      key={`skeleton-${rowIndex}-${columnIndex}`}
                    >
                      <div
                        className="h-4 w-full animate-pulse rounded bg-muted motion-reduce:animate-none"
                        aria-hidden="true"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : // Actual user rows once data is available.
              users?.map((account) => {
                const isSelf = account.id === currentUserId;

                return (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="min-w-40 space-y-1">
                        <p className="font-medium">
                          {account.name}
                          {isSelf && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (You)
                            </span>
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {account.email}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Select
                        value={account.role}
                        disabled={isSelf || isUpdating}
                        onValueChange={(value) => {
                          if (
                            value === "admin" ||
                            value === "manager" ||
                            value === "viewer"
                          ) {
                            onRoleChange(account, value);
                          }
                        }}
                      >
                        <SelectTrigger
                          aria-label={`Role for ${account.name}`}
                          className="w-32"
                        >
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">
                            Manager
                          </SelectItem>
                          <SelectItem value="viewer">
                            Viewer
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          account.isActive ? "outline" : "destructive"
                        }
                      >
                        {account.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isSelf || isUpdating}
                        onClick={() => onStatusChange(account)}
                      >
                        {account.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>
    </div>
  );
}
