import { createContext } from "react";

import type { AuthUser, LoginCredentials, Permission } from "./auth.types";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

export interface AuthContextValue {
  user: AuthUser | null;
  permissions: Permission[];
  status: AuthStatus;

  login: (credentials: LoginCredentials) => Promise<void>;
  retrySession: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;

  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
