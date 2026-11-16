
import {
  apiClient,
  sessionClient,
  refreshAccessToken,
} from "@/lib/api-client";

import type {
  LoginCredentials,
  AuthResponse,
  CurrentUserResponse,
} from "./auth.types";

export const authApi = {
  async login(
    credentials: LoginCredentials,
  ): Promise<AuthResponse> {
    const { data } =
      await sessionClient.post<AuthResponse>(
        "/auth/login",
        credentials,
      );

    return data;
  },

  refresh(): Promise<AuthResponse> {
    return refreshAccessToken();
  },

  // Retained for explicit user/session revalidation.
  async getCurrentUser(): Promise<CurrentUserResponse> {
    const { data } =
      await apiClient.get<CurrentUserResponse>(
        "/auth/me",
      );

    return data;
  },

  async logout(): Promise<void> {
    await sessionClient.post("/auth/logout");
  },
};

// Prevent duplicate restoration requests.
let restorePromise: Promise<CurrentUserResponse> | null =
  null;

export function restoreSession(): Promise<CurrentUserResponse> {
  if (!restorePromise) {
    restorePromise = authApi
      .refresh()
      .then(({ user, permissions }) => ({
        user,
        permissions,
      }))
      .finally(() => {
        restorePromise = null;
      });
  }

  return restorePromise;
}
