import { apiClient } from "@/lib/api-client";
import type {
  ProjectFormOptions,
  ProjectInput,
  ProjectListParams,
  ProjectListResponse,
  ProjectResponse,
  ProjectStatusInput,
} from "./projects.types";

export const projectsApi = {
  async list(
    params: ProjectListParams,
    signal?: AbortSignal,
  ): Promise<ProjectListResponse> {
    const { data } = await apiClient.get<ProjectListResponse>("/projects", {
      params,
      signal,
    });
    return data;
  },
  async getById(id: string): Promise<ProjectResponse> {
    const { data } = await apiClient.get<ProjectResponse>(
      `/projects/${encodeURIComponent(id)}`,
    );
    return data;
  },
  async formOptions(signal?: AbortSignal): Promise<ProjectFormOptions> {
    const { data } = await apiClient.get<ProjectFormOptions>(
      "/projects/form-options",
      { signal },
    );
    return data;
  },
  async create(input: ProjectInput): Promise<ProjectResponse> {
    const { data } = await apiClient.post<ProjectResponse>("/projects", input);
    return data;
  },
  async update(
    id: string,
    input: ProjectInput | ProjectStatusInput,
  ): Promise<ProjectResponse> {
    const { data } = await apiClient.patch<ProjectResponse>(
      `/projects/${encodeURIComponent(id)}`,
      input,
    );
    return data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/projects/${encodeURIComponent(id)}`);
  },
};
