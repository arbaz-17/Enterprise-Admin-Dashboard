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
import { getApiErrorMessage } from "@/lib/api-error";
import type { Project, ProjectStatusInput } from "./projects.types";

const schema = z
  .object({
    status: z.enum(["planning", "active", "on_hold", "completed"]),
    progress: z.number().int().min(0).max(100),
  })
  .refine((v) => v.status !== "completed" || v.progress === 100, {
    path: ["progress"],
    message: "Completed projects must have 100% progress",
  });

type Values = z.infer<typeof schema>;
interface Props {
  project: Project;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: ProjectStatusInput) => Promise<void>;
}

export function ProjectProgressDialog({
  project,
  isPending,
  onOpenChange,
  onSave,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { status: project.status, progress: project.progress },
  });
  const saving = isPending || isSubmitting;
  async function submit(values: Values) {
    setError(null);
    try {
      await onSave(values);
    } catch (cause) {
      setError(getApiErrorMessage(cause));
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!saving) onOpenChange(open);
      }}
    >
      <DialogContent showCloseButton={!saving} className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Update project progress</DialogTitle>
          <DialogDescription>
            Update status and progress for {project.name}. Other project
            settings are managed by Admins.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="assigned-project-status">Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value: Values["status"]) => {
                    field.onChange(value);
                    if (value === "completed")
                      setValue("progress", 100, { shouldValidate: true });
                  }}
                  disabled={saving}
                >
                  <SelectTrigger
                    id="assigned-project-status"
                    className="w-full"
                  >
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
            <Label htmlFor="assigned-project-progress">Progress (%)</Label>
            <Input
              id="assigned-project-progress"
              type="number"
              min="0"
              max="100"
              step="1"
              disabled={saving}
              aria-invalid={!!errors.progress}
              {...register("progress", { valueAsNumber: true })}
            />
            {errors.progress && (
              <p role="alert" className="text-xs text-destructive">
                {errors.progress.message}
              </p>
            )}
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && (
                <LoaderCircle
                  className="size-4 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}
              {saving ? "Saving..." : "Save progress"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
