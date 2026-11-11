import { apiClient } from "@/lib/api-client";

import type {
  DepartmentInput,
  DepartmentListParams,
  DepartmentListResponse,
  DepartmentResponse,
} from "./departments.types";

export const departmentsApi = {
  async list(
    params: DepartmentListParams,
    signal?: AbortSignal,
  ): Promise<DepartmentListResponse> {
    const { data } = await apiClient.get<DepartmentListResponse>(
      "/departments",
      { params, signal },
    );

    return data;
  },

  async getById(id: string): Promise<DepartmentResponse> {
    const { data } = await apiClient.get<DepartmentResponse>(
      `/departments/${encodeURIComponent(id)}`,
    );

    return data;
  },

  async create(payload: DepartmentInput): Promise<DepartmentResponse> {
    const { data } = await apiClient.post<DepartmentResponse>(
      "/departments",
      payload,
    );

    return data;
  },

  async update(
    id: string,
    payload: DepartmentInput,
  ): Promise<DepartmentResponse> {
    const { data } = await apiClient.patch<DepartmentResponse>(
      `/departments/${encodeURIComponent(id)}`,
      payload,
    );

    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/departments/${encodeURIComponent(id)}`);
  },
};
