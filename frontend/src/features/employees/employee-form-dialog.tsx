import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle } from "lucide-react";

import { useDepartments } from "@/features/departments/departments.queries";
import { getApiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccountOptions } from "./employees.queries";
import type { Employee, EmployeeInput } from "./employees.types";

const formSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(120),
  workEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email")
    .max(254),
  designation: z.string().trim().min(1, "Designation is required").max(100),
  departmentId: z.string().uuid("Select a department"),
  status: z.enum(["active", "on_leave", "inactive"]),
  userId: z.string().nullable(),
  joiningDate: z
    .string()
    .refine(
      (date) => !date || z.iso.date().safeParse(date).success,
      "Enter a valid joining date",
    ),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  employee?: Employee | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (value: EmployeeInput) => Promise<void>;
}

export function EmployeeFormDialog({
  employee,
  isPending,
  onOpenChange,
  onSave,
}: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    data: departmentData,
    isPending: departmentsLoading,
    isError: departmentsError,
  } = useDepartments({ page: 1, pageSize: 100 });
  const { data: accounts, isError: accountsError } = useAccountOptions(true);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: employee?.fullName ?? "",
      workEmail: employee?.workEmail ?? "",
      designation: employee?.designation ?? "",
      departmentId: employee?.departmentId ?? "",
      userId: employee?.userId ?? null,
      status: employee?.status ?? "active",
      joiningDate: employee?.joiningDate ?? "",
    },
  });
  const isSaving = isPending || isSubmitting;
  const noDepartments = !departmentsLoading && !departmentData?.data.length;

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await onSave({
        ...values,
        joiningDate: values.joiningDate || null,
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
        className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>
            {employee ? "Edit employee" : "Add employee"}
          </DialogTitle>
          <DialogDescription>
            Assign a department and maintain an employee record. Linking a login
            account is optional.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="employee-name">Full name *</Label>
              <Input
                id="employee-name"
                disabled={isSaving}
                aria-invalid={!!errors.fullName}
                aria-describedby={
                  errors.fullName ? "employee-name-error" : undefined
                }
                {...register("fullName")}
              />
              {errors.fullName && (
                <p
                  id="employee-name-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errors.fullName.message}
                </p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="employee-email">Work email *</Label>
              <Input
                id="employee-email"
                type="email"
                autoComplete="off"
                disabled={isSaving}
                aria-invalid={!!errors.workEmail}
                aria-describedby={
                  errors.workEmail ? "employee-email-error" : undefined
                }
                {...register("workEmail")}
              />
              {errors.workEmail && (
                <p
                  id="employee-email-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errors.workEmail.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-designation">Designation *</Label>
              <Input
                id="employee-designation"
                placeholder="Software Engineer"
                disabled={isSaving}
                aria-invalid={!!errors.designation}
                aria-describedby={
                  errors.designation ? "employee-designation-error" : undefined
                }
                {...register("designation")}
              />
              {errors.designation && (
                <p
                  id="employee-designation-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errors.designation.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-department">Department *</Label>
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={
                      isSaving || departmentsLoading || departmentsError
                    }
                  >
                    <SelectTrigger
                      id="employee-department"
                      className="w-full"
                      aria-invalid={!!errors.departmentId}
                    >
                      <SelectValue
                        placeholder={
                          departmentsLoading
                            ? "Loading departments..."
                            : "Choose department"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentData?.data.map((dept) => (
                        <SelectItem value={dept.id} key={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.departmentId && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.departmentId.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-status">Employment status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSaving}
                  >
                    <SelectTrigger id="employee-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_leave">On leave</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-date">Joining date (optional)</Label>
              <Input
                id="employee-date"
                type="date"
                disabled={isSaving}
                aria-invalid={!!errors.joiningDate}
                {...register("joiningDate")}
              />
              {errors.joiningDate && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.joiningDate.message}
                </p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="employee-user">
                Linked dashboard account (optional)
              </Label>
              <Controller
                name="userId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? "_none"}
                    onValueChange={(value) =>
                      field.onChange(value === "_none" ? null : value)
                    }
                    disabled={isSaving || accountsError}
                  >
                    <SelectTrigger id="employee-user" className="w-full">
                      <SelectValue placeholder="No linked account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">No linked account</SelectItem>
                      {accounts?.map((user) => (
                        <SelectItem value={user.id} key={user.id}>
                          {user.name} — {user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">
                Only active accounts are shown. Each account can link to one
                employee.
              </p>
              {accountsError && (
                <p role="alert" className="text-xs text-destructive">
                  Unable to load account options; retry after checking your
                  connection.
                </p>
              )}
            </div>
          </div>
          {departmentsError && (
            <p role="alert" className="text-sm text-destructive">
              Unable to load departments. Close the dialog and retry.
            </p>
          )}
          {noDepartments && !departmentsError && (
            <p className="text-sm text-muted-foreground">
              Create a department before adding employees.
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
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSaving ||
                departmentsLoading ||
                departmentsError ||
                noDepartments ||
                accountsError
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
                : employee
                  ? "Save changes"
                  : "Create employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
