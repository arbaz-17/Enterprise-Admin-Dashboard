import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "./projects-api";
import type {
  ProjectInput,
  ProjectListParams,
  ProjectStatusInput,
} from "./projects.types";
import type { QueryClient } from "@tanstack/react-query";

import { dashboardKeys } from "../dashboard/dashboard.queries";
import { teamKeys } from "../team-assignments/team-assignment.queries";

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (params: ProjectListParams) =>
    [...projectKeys.lists(), params] as const,
  options: () => [...projectKeys.all, "form-options"] as const,
};

async function invalidateProjectQueries(
  queryClient: QueryClient,
) {
  await queryClient.invalidateQueries({
    queryKey: projectKeys.lists(),
  });

  await queryClient.invalidateQueries({
    queryKey: dashboardKeys.all,
  });

  await queryClient.invalidateQueries({
    queryKey: teamKeys.all,
  });
}

export function useProjects(params: ProjectListParams) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: ({ signal }) => projectsApi.list(params, signal),
    staleTime: 30_000,
    retry: false,
  });
}

export function useProjectFormOptions(enabled: boolean) {
  return useQuery({
    queryKey: projectKeys.options(),
    queryFn: ({ signal }) => projectsApi.formOptions(signal),
    enabled,
    staleTime: 60_000,
    retry: false,
  });
}

export function useCreateProject() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectInput) => projectsApi.create(payload),
    onSuccess: () => invalidateProjectQueries(client),
  });
}

export function useUpdateProject() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ProjectInput | ProjectStatusInput;
    }) => projectsApi.update(id, payload),
    onSuccess: () => invalidateProjectQueries(client),
  });
}

export function useDeleteProject() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => invalidateProjectQueries(client),
  });
}
