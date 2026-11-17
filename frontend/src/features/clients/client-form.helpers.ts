import type { Client, ClientInput } from "./clients.types";
import type { ClientFormValues } from "./client-form.schema";

export function getClientFormDefaults(client?: Client | null): ClientFormValues {
  return {
    name: client?.name ?? "",
    contactName: client?.contactName ?? "",
    contactEmail: client?.contactEmail ?? "",
    status: client?.status ?? "active",
  };
}

export function toClientInput(values: ClientFormValues): ClientInput {
  return {
    name: values.name,
    contactName: values.contactName || null,
    contactEmail: values.contactEmail ? values.contactEmail.toLowerCase() : null,
    status: values.status,
  };
}
