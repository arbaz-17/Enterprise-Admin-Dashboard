
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

interface UsersResponse {
  users: ManagedUser[];
}

interface UserResponse {
  data: ManagedUser;
}

export const usersApi = {
  async list(signal?: AbortSignal): Promise<ManagedUser[]> {
    const { data } = await apiClient.get<UsersResponse>(
      "/users",
      { signal },
    );

    return data.users;
  },

  async update(
    id: string,
    payload: UpdateUserInput,
  ): Promise<ManagedUser> {
    const { data } = await apiClient.patch<UserResponse>(
      `/users/${encodeURIComponent(id)}`,
      payload,
    );

    return data.data;
  },
};
