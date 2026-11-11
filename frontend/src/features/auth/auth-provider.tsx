import axios, { type InternalAxiosRequestConfig } from "axios";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { apiClient, getAccessToken, setAccessToken } from "@/lib/api-client";

import { authApi, restoreSession } from "./auth-api";
import { AuthContext, type AuthStatus } from "./auth-context";
import { useQueryClient } from "@tanstack/react-query";

import type {
  AuthUser,
  CurrentUserResponse,
  LoginCredentials,
  Permission,
} from "./auth.types";

type RetryableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

function isSessionInvalid(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const queryClient = useQueryClient();

  const establishSession = useCallback((data: CurrentUserResponse) => {
    setUser(data.user);
    setPermissions(data.permissions);
    setStatus("authenticated");
  }, []);

  const clearSession = useCallback(
    (nextStatus: "unauthenticated" | "error") => {
      setAccessToken(null);

      queryClient.clear();

      setUser(null);
      setPermissions([]);
      setStatus(nextStatus);
    },
    [queryClient],
  );

  const retrySession = useCallback(async () => {
    setStatus("loading");

    try {
      const data = await restoreSession();
      establishSession(data);
    } catch (error) {
      clearSession(isSessionInvalid(error) ? "unauthenticated" : "error");
    }
  }, [establishSession, clearSession]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await authApi.login(credentials);

      setAccessToken(response.accessToken);

      try {
        const data = await authApi.getCurrentUser();
        establishSession(data);
      } catch (error) {
        clearSession(isSessionInvalid(error) ? "unauthenticated" : "error");
        throw error;
      }
    },
    [establishSession, clearSession],
  );

  const logout = useCallback(async () => {
    // Only clear the local session after backend confirmation.
    await authApi.logout();

    clearSession("unauthenticated");
  }, [clearSession]);

  useEffect(() => {
    let active = true;

    // Refresh expired access tokens and retry once.
    const interceptorId = apiClient.interceptors.response.use(
      (response) => response,
      async (error: unknown) => {
        if (
          !axios.isAxiosError(error) ||
          error.response?.status !== 401 ||
          !error.config
        ) {
          return Promise.reject(error);
        }

        const request = error.config as RetryableRequest;

        const authHeader = request.headers.get("Authorization");
        const requestToken =
          typeof authHeader === "string"
            ? authHeader.replace(/^Bearer\s+/i, "")
            : null;

        const currentToken = getAccessToken();

        // A request already retried once must not retry again.
        if (request._retry) {
          if (active && requestToken && requestToken === currentToken) {
            clearSession("unauthenticated");
          }

          return Promise.reject(error);
        }

        // Do not attempt refresh without a prior access token.
        if (!currentToken) {
          return Promise.reject(error);
        }

        request._retry = true;

        // Another request may have already refreshed the token.
        if (requestToken !== currentToken) {
          request.headers.set("Authorization", `Bearer ${currentToken}`);

          return apiClient(request);
        }

        try {
          const refreshed = await authApi.refresh();

          request.headers.set(
            "Authorization",
            `Bearer ${refreshed.accessToken}`,
          );

          return apiClient(request);
        } catch (refreshError) {
          if (active && getAccessToken() === currentToken) {
            clearSession(
              isSessionInvalid(refreshError) ? "unauthenticated" : "error",
            );
          }

          return Promise.reject(refreshError);
        }
      },
    );

    // Restore the session when the provider mounts.
    void restoreSession()
      .then((data) => {
        if (active) {
          establishSession(data);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          clearSession(isSessionInvalid(error) ? "unauthenticated" : "error");
        }
      });

    return () => {
      active = false;
      apiClient.interceptors.response.eject(interceptorId);
    };
  }, [establishSession, clearSession]);

  const hasPermission = (permission: Permission) =>
    permissions.includes(permission);

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        status,
        login,
        logout,
        retrySession,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
