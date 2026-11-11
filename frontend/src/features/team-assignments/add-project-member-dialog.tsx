import { useState, type FormEvent } from "react";
import { LoaderCircle, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { useAvailableEmployees } from "./team-assignment.queries"
import { getApiErrorMessage } from "@/lib/api-error";

interface AddProjectMemberDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (employeeId: string) => Promise<void>;
  isPending: boolean;
}

export function AddProjectMemberDialog({
  projectId,
  open,
  onOpenChange,
  onAdd,
  isPending,
}: AddProjectMemberDialogProps) {
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    data,
    isPending: isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useAvailableEmployees(projectId, search, open);

  function runSearch() {
    setSelectedEmployeeId("");
    setSubmitError(null);
    setSearch(searchDraft.trim().slice(0, 100));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEmployeeId || isPending) return;
    setSubmitError(null);
    try {
      await onAdd(selectedEmployeeId);
    } catch (reason) {
      setSubmitError(getApiErrorMessage(reason));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Add team member</DialogTitle>
          <DialogDescription>
            Choose an active employee who is not already assigned to this
            project.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <div className="space-y-2">
            <Label htmlFor="member-search">Find employee</Label>
            <div className="flex gap-2">
              <Input
                id="member-search"
                value={searchDraft}
                maxLength={100}
                disabled={isPending}
                placeholder="Search name or work email"
                onChange={(event) => setSearchDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    runSearch();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={runSearch}
              >
                <Search className="size-4" aria-hidden="true" /> Search
              </Button>
            </div>
          </div>

          {isLoading ? (
            <LoadingState message="Loading eligible employees..." />
          ) : isError ? (
            <ErrorState
              title="Couldn't load employees"
              message={getApiErrorMessage(error)}
              onRetry={() => void refetch()}
              isRetrying={isFetching}
            />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="member-select">Employee</Label>
              <Select
                value={selectedEmployeeId}
                onValueChange={setSelectedEmployeeId}
                disabled={isPending || !data?.data.length}
              >
                <SelectTrigger id="member-select" className="w-full">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {data?.data.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} — {employee.departmentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {data?.data.length
                  ? "Showing up to 20 eligible employees. Search to narrow the list."
                  : "No eligible employees found. Try another search or add an active employee first."}
              </p>
            </div>
          )}

          {submitError && (
            <p role="alert" className="text-sm text-destructive">
              {submitError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedEmployeeId || isFetching}
            >
              {isPending && (
                <LoaderCircle
                  className="size-4 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}
              {isPending ? "Adding..." : "Add member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
