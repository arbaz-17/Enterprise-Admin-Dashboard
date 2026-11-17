import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";

import { getApiErrorMessage } from "@/lib/api-error";

import type { Department, DepartmentInput } from "./departments.types";
import {
  departmentFormSchema,
  type DepartmentFormValues,
} from "./department-form.schema";
import {
  getDepartmentFormDefaults,
  toDepartmentInput,
} from "./department-form.helpers";

interface DepartmentFormDialogProps {
  department?: Department | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: DepartmentInput) => Promise<void>;
}

export function DepartmentFormDialog({
  department,
  isPending,
  onOpenChange,
  onSave,
}: DepartmentFormDialogProps) {
  const isEditing = Boolean(department);

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: getDepartmentFormDefaults(department),
  });

  const isSaving = isPending || isSubmitting;

  async function onSubmit(values: DepartmentFormValues) {
    setServerError(null);

    try {
      await onSave(toDepartmentInput(values));
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!isSaving) {
          onOpenChange(open);
        }
      }}
    >
      <DialogContent showCloseButton={!isSaving}>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit department" : "Add department"}
          </DialogTitle>

          <DialogDescription>
            {isEditing
              ? "Update the department information."
              : "Create a new organizational department."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-5"
        >
          {/* Department name */}
          <div className="space-y-2">
            <Label htmlFor="department-name">
              Department name
              <span className="text-destructive"> *</span>
            </Label>

            <Input
              id="department-name"
              placeholder="e.g. Engineering"
              maxLength={100}
              disabled={isSaving}
              aria-required="true"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={
                errors.name ? "department-name-error" : undefined
              }
              {...register("name")}
            />

            {errors.name && (
              <p
                id="department-name-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="department-description">Description</Label>

            <Textarea
              id="department-description"
              placeholder="Briefly describe this department..."
              rows={3}
              maxLength={500}
              disabled={isSaving}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? "department-description-error" : undefined
              }
              {...register("description")}
            />

            {errors.description && (
              <p
                id="department-description-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Backend error */}
          {serverError && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30
                         bg-destructive/5 p-3 text-sm
                         text-destructive"
            >
              {serverError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isSaving}>
              {isSaving && (
                <LoaderCircle
                  className="size-4 animate-spin
                             motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}

              {isSaving
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Create department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
