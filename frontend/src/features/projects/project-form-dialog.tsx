import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-error";
import { useProjectFormOptions } from "./projects.queries";
import type { Project, ProjectInput } from "./projects.types";

const formSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is required").max(160),
    description: z.string().trim().max(2000, "Maximum 2,000 characters"),
    clientId: z.uuid("Choose a client"),
    managerEmployeeId: z.string().nullable(),
    status: z.enum(["planning", "active", "on_hold", "completed"]),
    priority: z.enum(["low", "medium", "high"]),
    progress: z.number().int().min(0, "Minimum 0").max(100, "Maximum 100"),
    startDate: z
      .string()
      .refine(
        (value) => !value || z.iso.date().safeParse(value).success,
        "Invalid start date",
      ),
    dueDate: z
      .string()
      .refine(
        (value) => !value || z.iso.date().safeParse(value).success,
        "Invalid due date",
      ),
  })
  .superRefine((value, ctx) => {
    if (value.startDate && value.dueDate && value.dueDate < value.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Due date must not precede the start date",
      });
    }
    if (value.status === "completed" && value.progress !== 100) {
      ctx.addIssue({
        code: "custom",
        path: ["progress"],
        message: "Completed projects must have 100% progress",
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;
interface Props {
  project?: Project | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (value: ProjectInput) => Promise<void>;
}

export function ProjectFormDialog({
  project,
  isPending,
  onOpenChange,
  onSave,
}: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    data: options,
    isPending: optionsLoading,
    isError: optionsError,
  } = useProjectFormOptions(true);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      clientId: project?.clientId ?? "",
      managerEmployeeId: project?.managerEmployeeId ?? null,
      status: project?.status ?? "planning",
      priority: project?.priority ?? "medium",
      progress: project?.progress ?? 0,
      startDate: project?.startDate ?? "",
      dueDate: project?.dueDate ?? "",
    },
  });
  const isSaving = isPending || isSubmitting;
  const noActiveClients =
    !optionsLoading &&
    !options?.clients.some((client) => client.status === "active");

  async function submit(values: FormValues) {
    setServerError(null);
    try {
      await onSave({
        ...values,
        description: values.description || null,
        managerEmployeeId: values.managerEmployeeId || null,
        startDate: values.startDate || null,
        dueDate: values.dueDate || null,
      });
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!isSaving) onOpenChange(open);
      }}
    >
      <DialogContent
        showCloseButton={!isSaving}
        className="max-h-[92dvh] overflow-y-auto sm:max-w-[660px]"
      >
        <DialogHeader>
          <DialogTitle>
            {project ? "Edit project" : "Create project"}
          </DialogTitle>
          <DialogDescription>
            Maintain the project, its client and the responsible manager. Team
            members will be configured separately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project name *</Label>
            <Input
              id="project-name"
              placeholder="e.g. Client Portal Redesign"
              maxLength={160}
              disabled={isSaving}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "project-name-error" : undefined}
              {...register("name")}
            />
            {errors.name && (
              <p
                id="project-name-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              rows={3}
              maxLength={2000}
              disabled={isSaving}
              {...register("description")}
            />
            {errors.description && (
              <p role="alert" className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-client">Client *</Label>
              <Controller
                name="clientId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={isSaving || optionsLoading || optionsError}
                  >
                    <SelectTrigger
                      id="project-client"
                      className="w-full"
                      aria-invalid={!!errors.clientId}
                    >
                      <SelectValue
                        placeholder={
                          optionsLoading
                            ? "Loading clients..."
                            : "Select client"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.clients.map((client) => (
                        <SelectItem
                          key={client.id}
                          value={client.id}
                          disabled={
                            client.status === "inactive" &&
                            client.id !== project?.clientId
                          }
                        >
                          {client.name}
                          {client.status === "inactive" ? " (inactive)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.clientId && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.clientId.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-manager">
                Project manager (optional)
              </Label>
              <Controller
                name="managerEmployeeId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? "_none"}
                    onValueChange={(value) =>
                      field.onChange(value === "_none" ? null : value)
                    }
                    disabled={isSaving || optionsLoading || optionsError}
                  >
                    <SelectTrigger id="project-manager" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">No manager assigned</SelectItem>
                      {project?.managerEmployeeId &&
                        !options?.managers.some(
                          (m) => m.id === project.managerEmployeeId,
                        ) && (
                          <SelectItem value={project.managerEmployeeId}>
                            {project.managerName ?? "Existing manager"} (no
                            longer eligible)
                          </SelectItem>
                        )}
                      {options?.managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name} — {manager.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">
                Only active employees linked to active Admin/Manager accounts
                are eligible.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value: FormValues["status"]) => {
                      field.onChange(value);
                      if (value === "completed")
                        setValue("progress", 100, { shouldValidate: true });
                    }}
                    disabled={isSaving}
                  >
                    <SelectTrigger id="project-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-priority">Priority</Label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSaving}
                  >
                    <SelectTrigger id="project-priority" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-progress">Progress (0–100%)</Label>
              <Input
                id="project-progress"
                type="number"
                min={0}
                max={100}
                step={1}
                disabled={isSaving}
                aria-invalid={!!errors.progress}
                {...register("progress", { valueAsNumber: true })}
              />
              {errors.progress && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.progress.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-start-date">Start date (optional)</Label>
              <Input
                id="project-start-date"
                type="date"
                disabled={isSaving}
                {...register("startDate")}
              />
              {errors.startDate && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-due-date">Due date (optional)</Label>
              <Input
                id="project-due-date"
                type="date"
                disabled={isSaving}
                {...register("dueDate")}
              />
              {errors.dueDate && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.dueDate.message}
                </p>
              )}
            </div>
          </div>
          {noActiveClients && !project && !optionsError && (
            <p className="text-sm text-muted-foreground">
              Create an active client before creating a project.
            </p>
          )}
          {optionsError && (
            <p role="alert" className="text-sm text-destructive">
              Unable to load client and manager options. Close the form and
              retry.
            </p>
          )}
          {serverError && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {serverError}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSaving ||
                optionsLoading ||
                optionsError ||
                (!project && noActiveClients)
              }
            >
              {isSaving && (
                <LoaderCircle
                  className="size-4 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}
              {isSaving
                ? "Saving..."
                : project
                  ? "Save changes"
                  : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
