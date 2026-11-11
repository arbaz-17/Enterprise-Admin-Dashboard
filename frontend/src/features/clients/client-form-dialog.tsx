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
import type { Client, ClientInput } from "./clients.types";

const clientFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Client name is required")
    .max(160, "Maximum 160 characters"),
  contactName: z.string().trim().max(120, "Maximum 120 characters"),
  contactEmail: z
    .string()
    .trim()
    .max(254, "Maximum 254 characters")
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Enter a valid contact email address",
    ),
  status: z.enum(["active", "inactive"]),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormDialogProps {
  client?: Client | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: ClientInput) => Promise<void>;
}

export function ClientFormDialog({
  client,
  isPending,
  onOpenChange,
  onSave,
}: ClientFormDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: client?.name ?? "",
      contactName: client?.contactName ?? "",
      contactEmail: client?.contactEmail ?? "",
      status: client?.status ?? "active",
    },
  });

  const isSaving = isPending || isSubmitting;

  async function onSubmit(values: ClientFormValues) {
    setServerError(null);
    try {
      await onSave({
        name: values.name,
        contactName: values.contactName || null,
        contactEmail: values.contactEmail
          ? values.contactEmail.toLowerCase()
          : null,
        status: values.status,
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
      <DialogContent showCloseButton={!isSaving} className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{client ? "Edit client" : "Add client"}</DialogTitle>
          <DialogDescription>
            {client
              ? "Update this client organization."
              : "Create a new client organization."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="client-name">
              Client name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="client-name"
              placeholder="e.g. Acme Technologies"
              maxLength={160}
              autoFocus
              disabled={isSaving}
              aria-required="true"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "client-name-error" : undefined}
              {...register("name")}
            />
            {errors.name && (
              <p
                id="client-name-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-contact-name">
              Contact person (optional)
            </Label>
            <Input
              id="client-contact-name"
              placeholder="e.g. Ayesha Khan"
              maxLength={120}
              autoComplete="name"
              disabled={isSaving}
              aria-invalid={Boolean(errors.contactName)}
              aria-describedby={
                errors.contactName ? "client-contact-name-error" : undefined
              }
              {...register("contactName")}
            />
            {errors.contactName && (
              <p
                id="client-contact-name-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.contactName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-contact-email">
              Contact email (optional)
            </Label>
            <Input
              id="client-contact-email"
              type="email"
              placeholder="contact@example.com"
              maxLength={254}
              autoComplete="email"
              disabled={isSaving}
              aria-invalid={Boolean(errors.contactEmail)}
              aria-describedby={
                errors.contactEmail ? "client-contact-email-error" : undefined
              }
              {...register("contactEmail")}
            />
            {errors.contactEmail && (
              <p
                id="client-contact-email-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.contactEmail.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-status">Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSaving}
                >
                  <SelectTrigger id="client-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

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
            <Button type="submit" disabled={isSaving}>
              {isSaving && (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin motion-reduce:animate-none"
                />
              )}
              {isSaving
                ? "Saving..."
                : client
                  ? "Save changes"
                  : "Create client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
