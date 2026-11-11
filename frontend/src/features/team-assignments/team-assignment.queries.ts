import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teamAssignmentsApi } from "./team-assignment-api";
import type {
  AddTeamMemberInput,
  RemoveTeamMemberInput,
} from "./team-assignments.types";

export const teamKeys = {
  all: ["project-teams"] as const,
  detail: (projectId: string) => [...teamKeys.all, projectId] as const,
  available: (projectId: string, q: string) =>
    [...teamKeys.detail(projectId), "available", q] as const,
  availablePrefix: (projectId: string) =>
    [...teamKeys.detail(projectId), "available"] as const,
};

export function useProjectTeam(projectId: string) {
  return useQuery({
    queryKey: teamKeys.detail(projectId),
    queryFn: ({ signal }) => teamAssignmentsApi.list(projectId, signal),
    enabled: Boolean(projectId),
    retry: false,
  });
}

export function useAvailableEmployees(
  projectId: string,
  q: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: teamKeys.available(projectId, q),
    queryFn: ({ signal }) =>
      teamAssignmentsApi.availableEmployees(projectId, q, signal),
    enabled: Boolean(projectId) && enabled,
    retry: false,
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddTeamMemberInput) => teamAssignmentsApi.add(input),
    onSuccess: async (_data, variables) => {
      // Sequential invalidation to avoid concurrent DB fetches with the small connection pool.
      await queryClient.invalidateQueries({
        queryKey: teamKeys.detail(variables.projectId),
        exact: true,
      });
      await queryClient.invalidateQueries({
        queryKey: teamKeys.availablePrefix(variables.projectId),
      });
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RemoveTeamMemberInput) =>
      teamAssignmentsApi.remove(input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: teamKeys.detail(variables.projectId),
        exact: true,
      });
      await queryClient.invalidateQueries({
        queryKey: teamKeys.availablePrefix(variables.projectId),
      });
    },
  });
}
