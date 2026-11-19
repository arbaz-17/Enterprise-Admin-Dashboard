import axios from "axios";
import type { AuthResponse } from "@/features/auth/auth.types";

const clientConfig = {
  baseURL: "/api",
  withCredentials: true,
  timeout: 15000,
};

export const sessionClient = axios.create(clientConfig);

export const apiClient = axios.create(clientConfig);

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

let refreshPromise: Promise<AuthResponse> | null = null;

export function refreshAccessToken(): Promise<AuthResponse> {
  if (!refreshPromise) {
    refreshPromise = sessionClient
      .post<AuthResponse>("/auth/refresh")
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}
