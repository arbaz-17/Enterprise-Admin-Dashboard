import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "./projects-api";
import type {
  ProjectInput,
  ProjectListParams,
  ProjectStatusInput,
} from "./projects.types";

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (params: ProjectListParams) =>
    [...projectKeys.lists(), params] as const,
  options: () => [...projectKeys.all, "form-options"] as const,
};

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
    retry: false,
  });
}

export function useCreateProject() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectInput) => projectsApi.create(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: projectKeys.all }),
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
    onSuccess: () => client.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useDeleteProject() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => client.invalidateQueries({ queryKey: projectKeys.all }),
  });
}
