import { apiClient } from "@/lib/api-client";
import type { UserRole } from "@/features/auth/auth.types";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface UpdateUserInput {
  role?: UserRole;
  isActive?: boolean;
}

interface UserResponse {
  data: ManagedUser;
}

export interface UsersListParams {
  page: number;
  pageSize: number;
  q?: string;
}

export interface UsersListResponse {
  users: ManagedUser[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const usersApi = {
  async list(
    params: UsersListParams,
    signal?: AbortSignal,
  ): Promise<UsersListResponse> {
    const { data } = await apiClient.get<UsersListResponse>("/users", {
      params,
      signal,
    });

    return data;
  },

  async update(id: string, payload: UpdateUserInput): Promise<ManagedUser> {
    const { data } = await apiClient.patch<UserResponse>(
      `/users/${encodeURIComponent(id)}`,
      payload,
    );

    return data.data;
  },
};
