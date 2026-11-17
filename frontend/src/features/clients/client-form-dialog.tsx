import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { clientFormSchema, type ClientFormValues } from "./client-form.schema";
import { getClientFormDefaults, toClientInput } from "./client-form.helpers";

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
    defaultValues: getClientFormDefaults(client),
  });

  const isSaving = isPending || isSubmitting;

  async function onSubmit(values: ClientFormValues) {
    setServerError(null);
    try {
      await onSave(toClientInput(values));
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
              Contact person
            </Label>
            <Input
              id="client-contact-name"
              placeholder="e.g. Arbaz Ahmad"
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
              Contact email
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
