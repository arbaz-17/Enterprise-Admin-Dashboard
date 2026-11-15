import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientsApi } from "./client.api";
import type { ClientInput, ClientListParams } from "./clients.types";
import type { QueryClient } from "@tanstack/react-query";

import { dashboardKeys } from "../dashboard/dashboard.queries";
import { projectKeys } from "../projects/projects.queries";

export const clientKeys = {
  all: ["clients"] as const,
  lists: () => [...clientKeys.all, "list"] as const,
  list: (params: ClientListParams) => [...clientKeys.lists(), params] as const,
};

async function invalidateClientQueries(
  queryClient: QueryClient,
) {
  await queryClient.invalidateQueries({
    queryKey: clientKeys.all,
  });

  await queryClient.invalidateQueries({
    queryKey: dashboardKeys.all,
  });

  await queryClient.invalidateQueries({
    queryKey: projectKeys.all,
  });
}

export function useClients(params: ClientListParams) {
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: ({ signal }) => clientsApi.list(params, signal),
    staleTime: 30_000,
    retry: false,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientInput) => clientsApi.create(payload),
    onSuccess: () =>
      invalidateClientQueries(queryClient),
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ClientInput }) =>
      clientsApi.update(id, payload),
    onSuccess: () =>
      invalidateClientQueries(queryClient),
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientsApi.remove(id),
    onSuccess: () =>
      invalidateClientQueries(queryClient),
  });
}
