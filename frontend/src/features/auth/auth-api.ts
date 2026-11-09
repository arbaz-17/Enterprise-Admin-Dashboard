
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
    credentials: LoginCredentials
  ): Promise<AuthResponse> {
    const { data } = await sessionClient.post<AuthResponse>(
      "/auth/login",
      credentials
    );

    return data;
  },

  refresh(): Promise<AuthResponse> {
    return refreshAccessToken();
  },

  async getCurrentUser(): Promise<CurrentUserResponse> {
    const { data } =
      await apiClient.get<CurrentUserResponse>("/auth/me");

    return data;
  },
};

// Prevent duplicate session restoration requests
let restorePromise: Promise<CurrentUserResponse> | null = null;

export function restoreSession(): Promise<CurrentUserResponse> {
  if (!restorePromise) {
    restorePromise = (async () => {
      await authApi.refresh();
      return authApi.getCurrentUser();
    })().finally(() => {
      restorePromise = null;
    });
  }

  return restorePromise;
}
