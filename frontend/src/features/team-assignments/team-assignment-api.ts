import { apiClient } from "@/lib/api-client";
import type {
  AvailableEmployeeResponse,
  TeamResponse,
  AddTeamMemberInput,
  RemoveTeamMemberInput,
} from "./team-assignments.types";

const base = (id: string) => `/projects/${encodeURIComponent(id)}/assignments`;

export const teamAssignmentsApi = {
  async list(projectId: string, signal?: AbortSignal): Promise<TeamResponse> {
    const { data } = await apiClient.get<TeamResponse>(base(projectId), {
      signal,
    });
    return data;
  },
  async availableEmployees(
    projectId: string,
    q: string,
    signal?: AbortSignal,
  ): Promise<AvailableEmployeeResponse> {
    const { data } = await apiClient.get<AvailableEmployeeResponse>(
      `${base(projectId)}/options`,
      {
        params: q ? { q } : undefined,
        signal,
      },
    );
    return data;
  },
  async add(input: AddTeamMemberInput): Promise<void> {
    await apiClient.post(base(input.projectId), {
      employeeId: input.employeeId,
    });
  },
  async remove(input: RemoveTeamMemberInput): Promise<void> {
    await apiClient.delete(
      `${base(input.projectId)}/${encodeURIComponent(input.employeeId)}`,
    );
  },
};
